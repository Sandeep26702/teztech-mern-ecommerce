import Product from "../models/Product.js";
import ProductImportJob from "../models/ProductImportJob.js";
import Category from "../models/Category.js";
import { v2 as cloudinary } from 'cloudinary';
import { getCache, setCache, clearProductsCache, cacheKeys } from "../utils/cache.js";

const DEFAULT_PRODUCT_IMAGE = "https://placehold.co/600x600?text=Product";

// ==========================
// 🔥 ROBUST CSV PARSER (Excel jaisa smart)
// ==========================
function parseCSVLine(line) {
  const result = [];
  let currentVal = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (i < line.length - 1 && line[i + 1] === '"') {
          currentVal += '"';
          i++; 
        } else {
          inQuotes = false;
        }
      } else {
        currentVal += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        result.push(currentVal.trim());
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
  }
  result.push(currentVal.trim());
  return result;
}

// Safely convert formatted strings like "1,200.50" to numbers
const sanitizeNum = (val) => {
  if (!val) return 0;
  const num = Number(String(val).replace(/[^0-9.-]+/g, ""));
  return isNaN(num) ? 0 : num;
};

// ==========================
// BASIC CRUD
// ==========================

export const getProducts = async (req, res) => {
  try {
    const { keyword, category, minPrice, maxPrice, page = 1, limit = 8, sortBy, sortOrder, length, width } = req.query;

    const cacheKey = `${cacheKeys.PRODUCTS_PREFIX}${JSON.stringify({
      keyword: keyword || "",
      category: category || "",
      minPrice: minPrice || "",
      maxPrice: maxPrice || "",
      page,
      limit,
      sortBy: sortBy || "",
      sortOrder: sortOrder || "",
      length: length || "",
      width: width || ""
    })}`;

    const cachedData = getCache(cacheKey);
    if (cachedData) {
      return res.status(200).json(cachedData);
    }

    // 1. Match Stage (Filters setup)
    let matchStage = { status: "Active" };

    // 🔍 SUBSTRING / PARTIAL MATCH SEARCH
    if (keyword) {
      const words = keyword.trim().split(/\s+/).filter(Boolean);
      if (words.length > 0) {
        // Escape special regex characters
        const escapedWords = words.map(w => w.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
        
        // Match name if ALL words are present anywhere in the name (order independent)
        const nameRegexStr = escapedWords.map(w => `(?=.*${w})`).join("");
        const nameRegex = new RegExp(nameRegexStr, "i");
        
        // Match other fields if they contain the full raw keyword
        const rawKeywordEscaped = keyword.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        
        matchStage.$or = [
          { name: { $regex: nameRegex } },
          { baseSku: { $regex: rawKeywordEscaped, $options: "i" } },
          { category: { $regex: rawKeywordEscaped, $options: "i" } },
          { searchTags: { $regex: rawKeywordEscaped, $options: "i" } }
        ];
      }
    }

    if (category) {
      matchStage.categories = category;
    }

    if (minPrice || maxPrice) {
      matchStage.price = {};
      if (minPrice) matchStage.price.$gte = Number(minPrice);
      if (maxPrice) matchStage.price.$lte = Number(maxPrice);
    }

    if (length || width) {
      const detailsConditions = [];
      if (length) {
        const lenStr = String(length).trim();
        const lenNum = Number(lenStr);
        const possibleStrings = [lenStr];
        if (!isNaN(lenNum)) {
          possibleStrings.push(String(lenNum));
          possibleStrings.push(lenNum.toFixed(1));
          possibleStrings.push(lenNum.toFixed(2));
        }
        detailsConditions.push({
          details: {
            $elemMatch: {
              key: "LENGTH_ft",
              value: { $in: [...new Set(possibleStrings)] }
            }
          }
        });
      }
      if (width) {
        const widthStr = String(width).trim();
        const widthNum = Number(widthStr);
        const possibleStrings = [widthStr];
        if (!isNaN(widthNum)) {
          possibleStrings.push(String(widthNum));
          possibleStrings.push(widthNum.toFixed(1));
          possibleStrings.push(widthNum.toFixed(2));
        }
        detailsConditions.push({
          details: {
            $elemMatch: {
              key: "WIDTH_ft",
              value: { $in: [...new Set(possibleStrings)] }
            }
          }
        });
      }
      if (detailsConditions.length > 0) {
        matchStage.$and = matchStage.$and || [];
        matchStage.$and.push(...detailsConditions);
      }
    }

    const skip = (Number(page) - 1) * Number(limit);
    let products = [];
    let totalProducts = 0;

    // Define normal query sorting object
    let sortObj = { createdAt: -1 }; // Default
    if (sortBy === "name") {
      sortObj = { name: sortOrder === "desc" ? -1 : 1 };
    } else if (sortBy === "date") {
      sortObj = { createdAt: sortOrder === "desc" ? -1 : 1 };
    }

    // If keyword search OR sorting by size, we MUST use Aggregation Pipeline
    if (keyword || sortBy === "size") {
      const pipeline = [
        { $match: matchStage }
      ];

      // Add matchIndex for search relevance
      if (keyword) {
        pipeline.push({
          $addFields: {
            matchIndex: {
              $cond: {
                if: { $eq: [ { $indexOfCP: [ { $toLower: "$name" }, keyword.toLowerCase() ] }, -1 ] },
                then: 9999,
                else: { $indexOfCP: [ { $toLower: "$name" }, keyword.toLowerCase() ] }
              }
            }
          }
        });
      }

      // Add fields for size sorting
      if (sortBy === "size") {
        pipeline.push(
          {
            $addFields: {
              lengthVal: {
                $let: {
                  vars: {
                    lengthDetail: {
                      $filter: {
                        input: "$details",
                        as: "d",
                        cond: { $eq: ["$$d.key", "LENGTH_ft"] }
                      }
                    }
                  },
                  in: {
                    $convert: {
                      input: { $arrayElemAt: ["$$lengthDetail.value", 0] },
                      to: "double",
                      onError: 0.0,
                      onNull: 0.0
                    }
                  }
                }
              },
              widthVal: {
                $let: {
                  vars: {
                    widthDetail: {
                      $filter: {
                        input: "$details",
                        as: "d",
                        cond: { $eq: ["$$d.key", "WIDTH_ft"] }
                      }
                    }
                  },
                  in: {
                    $convert: {
                      input: { $arrayElemAt: ["$$widthDetail.value", 0] },
                      to: "double",
                      onError: 0.0,
                      onNull: 0.0
                    }
                  }
                }
              }
            }
          },
          {
            $addFields: {
              sizeArea: { $multiply: ["$lengthVal", "$widthVal"] }
            }
          }
        );
      }

      // Determine sorting stage
      let sortStage = { $sort: { createdAt: -1 } };
      if (sortBy === "name") {
        sortStage = { $sort: { name: sortOrder === "desc" ? -1 : 1 } };
      } else if (sortBy === "date") {
        sortStage = { $sort: { createdAt: sortOrder === "desc" ? -1 : 1 } };
      } else if (sortBy === "size") {
        sortStage = { $sort: { sizeArea: sortOrder === "desc" ? -1 : 1, name: 1 } };
      } else if (keyword) {
        sortStage = { $sort: { matchIndex: 1, name: 1 } };
      }
      pipeline.push(sortStage);

      // Pagination & Projection
      pipeline.push(
        { $skip: skip },
        { $limit: Number(limit) },
        {
          $project: {
            name: 1,
            price: 1,
            mrp: 1,
            image: 1,
            images: 1,
            baseSku: 1,
            status: 1,
            category: 1,
            categories: 1,
            gstRate: 1,
            shippingCharge: 1,
            attributes: 1,
            variants: 1,
            hasVariants: 1,
            customFields: 1,
            details: 1,
            weightKg: 1,
            stock: 1
          }
        }
      );

      products = await Product.aggregate(pipeline);

      const countPipeline = [
        { $match: matchStage },
        { $count: "total" }
      ];
      const countResult = await Product.aggregate(countPipeline);
      totalProducts = countResult.length > 0 ? countResult[0].total : 0;
    } else {
      // Normal find path (extremely fast for standard browsing)
      products = await Product.find(matchStage)
        .select("name price mrp image images baseSku status category categories gstRate shippingCharge attributes variants hasVariants customFields details weightKg stock")
        .sort(sortObj)
        .skip(skip)
        .limit(Number(limit))
        .lean();
        
      totalProducts = await Product.countDocuments(matchStage);
    }

    const totalPages = Math.ceil(totalProducts / Number(limit));

    const responseData = {
      success: true,
      products,
      totalPages,
      currentPage: Number(page),
      totalProducts
    };

    setCache(cacheKey, responseData);

    res.status(200).json(responseData);

  } catch (err) {
    console.error("GET PRODUCTS ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getProductsAdmin = async (req, res) => {
  try {
    const { search, category, page = 1, limit = 100 } = req.query;
    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { baseSku: { $regex: search, $options: 'i' } },
          { searchTags: { $regex: search, $options: 'i' } },
          { category: { $regex: search, $options: 'i' } }
        ]
      };
    }
    if (category) {
      query.$or = [
        { category: category },
        { categories: category }
      ];
    }
    
    const skip = (Number(page) - 1) * Number(limit);
    const totalProducts = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();
      
    res.json({ 
      success: true, 
      products,
      totalPages: Math.ceil(totalProducts / Number(limit)),
      currentPage: Number(page),
      totalProducts
    });
  } catch (err) {
    console.error("ADMIN ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getProductBySlug = async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug });
    if (!product) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createProduct = async (req, res) => {
  try {
    const { 
      sku, name, status, searchTags, description, 
      mrp, sellingPrice, gst, shippingCharge, stock, 
      category1, category2, category3,
      specifications, variations, weightKg 
    } = req.body;

    const baseSku = sku || `SKU-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    let parsedSpecs = [];
    let parsedVars = [];
    try { if (specifications) parsedSpecs = JSON.parse(specifications); } catch (e) {}
    try { if (variations) parsedVars = JSON.parse(variations); } catch (e) {}

    // Process variations into attributes format expected by schema
    const attributesMap = {};
    parsedVars.forEach(v => {
      if (!v.group || !v.option) return;
      if (!attributesMap[v.group]) attributesMap[v.group] = [];
      attributesMap[v.group].push({
        value: v.option,
        priceAdjustment: Number(v.priceOffset) || 0,
        meta: { sku: v.sku, stock: v.stock, mrp: v.mrp }
      });
    });
    
    const attributesArray = Object.keys(attributesMap).map(group => ({
      name: group,
      type: "select",
      options: attributesMap[group]
    }));

    // Handle images
    const imageUrls = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => imageUrls.push(file.path));
    } else if (req.file) {
      imageUrls.push(req.file.path);
    }

    const categories = [category1, category2, category3].filter(Boolean);

    const product = await Product.create({
      baseSku,
      name,
      description,
      price: Number(sellingPrice) || 0,
      mrp: Number(mrp) || 0,
      stock: Number(stock) || 0,
      status: status || 'Active',
      category: category1, // Main category
      categories,
      gstRate: Number(gst) || 0,
      shippingCharge: Number(shippingCharge) || 0,
      weightKg: Number(weightKg) || 0,
      searchTags: searchTags ? searchTags.split(',').map(t => t.trim()) : [],
      details: parsedSpecs,
      attributes: attributesArray,
      hasVariants: attributesArray.length > 0,
      user: req.user?._id || null,
      image: imageUrls.length > 0 ? imageUrls[0] : DEFAULT_PRODUCT_IMAGE,
      images: imageUrls,
    });

    clearProductsCache();

    res.status(201).json({ 
      success: true, 
      message: "Product created successfully",
      product 
    });
  } catch (err) {
    console.error("CREATE PRODUCT ERROR:", err);
    res.status(500).json({ success: false, message: "Server error while creating product", error: err.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { 
      sku, name, status, searchTags, description, 
      mrp, sellingPrice, gst, shippingCharge, stock, 
      category1, category2, category3,
      specifications, variations, deletedImages, weightKg 
    } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (sellingPrice) updateData.price = Number(sellingPrice);
    if (mrp !== undefined) updateData.mrp = Number(mrp);
    if (category1) updateData.category = category1;
    if (stock !== undefined) updateData.stock = Number(stock);
    if (status) updateData.status = status;
    if (sku) updateData.baseSku = sku;
    if (gst) updateData.gstRate = Number(gst);
    if (shippingCharge) updateData.shippingCharge = Number(shippingCharge);
    if (weightKg !== undefined) updateData.weightKg = Number(weightKg);
    if (searchTags) updateData.searchTags = searchTags.split(',').map(t => t.trim());
    
    if (category1 || category2 || category3) {
      updateData.categories = [category1, category2, category3].filter(Boolean);
    }

    if (specifications) {
      try { updateData.details = JSON.parse(specifications); } catch(e) {}
    }

    if (variations) {
      try {
        const parsedVars = JSON.parse(variations);
        const attributesMap = {};
        parsedVars.forEach(v => {
          if (!v.group || !v.option) return;
          if (!attributesMap[v.group]) attributesMap[v.group] = [];
          attributesMap[v.group].push({
            value: v.option,
            priceAdjustment: Number(v.priceOffset) || 0,
            meta: { sku: v.sku, stock: v.stock, mrp: v.mrp }
          });
        });
        updateData.attributes = Object.keys(attributesMap).map(group => ({
          name: group,
          type: "select",
          options: attributesMap[group]
        }));
        updateData.hasVariants = updateData.attributes.length > 0;
      } catch(e) {}
    }

    // Process deleted images
    if (deletedImages) {
      const imagesToDelete = typeof deletedImages === "string" ? JSON.parse(deletedImages) : deletedImages;
      
      // Ensure Cloudinary configuration
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });

      for (const imgUrl of imagesToDelete) {
        if (imgUrl && imgUrl.includes("cloudinary.com")) {
          try {
            const parts = imgUrl.split("/");
            const filename = parts[parts.length - 1];
            const publicId = filename.split(".")[0];
            const folder = parts[parts.length - 2]; 
            await cloudinary.uploader.destroy(`${folder}/${publicId}`);
          } catch (e) {
            console.error("Cloudinary delete error:", e);
          }
        }
      }
    }

    // Handle new images
    const imageUrls = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => imageUrls.push(file.path));
    } else if (req.file) {
      imageUrls.push(req.file.path);
    }

    if (imageUrls.length > 0) {
      updateData.image = imageUrls[0];
      // Append or replace depending on logic. Here we just replace or add.
      updateData.images = imageUrls;
    }

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    clearProductsCache();

    res.json({ 
      success: true, 
      message: "Product updated successfully",
      product: updated 
    });
  } catch (err) {
    console.error("UPDATE PRODUCT ERROR:", err);
    res.status(500).json({ success: false, message: "Server error while updating product", error: err.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Ensure Cloudinary configuration
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    const allImages = [...new Set([...(product.images || []), product.image])].filter(Boolean);
    for (const imgUrl of allImages) {
      if (imgUrl.includes("cloudinary.com")) {
        try {
          const parts = imgUrl.split("/");
          const filename = parts[parts.length - 1];
          const publicId = filename.split(".")[0];
          const folder = parts[parts.length - 2]; 
          await cloudinary.uploader.destroy(`${folder}/${publicId}`);
        } catch (e) {
          console.error("Cloudinary delete error:", e);
        }
      }
    }

    await Product.findByIdAndDelete(req.params.id);
    clearProductsCache();
    res.json({ success: true, message: "Product deleted permanently" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const toggleVisibility = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    
    product.status = (product.status === "Active" || product.status === "active") ? "Inactive" : "Active";
    await product.save();
    clearProductsCache();
    
    res.json({ success: true, status: product.status });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getProductCategories = async (req, res) => {
  try {
    const categories = await Product.distinct("category");
    res.json({ success: true, categories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ==========================
// 🔥 ULTIMATE DYNAMIC IMPORT (Zero Hardcoding + Bug Fixes)
// ==========================

export const importProductsCsv = async (req, res) => {
  try {
    const startTime = new Date(); 
    
    // 🔥 BOM FIX: Excel ke hidden characters ko hamesha ke liye hata diya
    const rawBuffer = req.file.buffer.toString("utf8");
    const csv = rawBuffer.replace(/^\uFEFF/, ''); 
    
    const rawLines = csv.split(/\r?\n/).filter(r => r.trim() !== "");
    const rows = rawLines.map(line => parseCSVLine(line));
    const rawHeaders = rows[0]; 
    
    const ops = [];
    const baseSkusImported = []; 
    let failed = 0;
    const errorLogs = []; 

    const coreFields = [
      "sku", "product_id", "code", "name", "product_name", "title", "selling_price", 
      "price", "mrp", "stock", "qty", "status", "search_tags", "tags",
      "gst", "gst_rate", "gst_percent", "tax", "shipping", "shipping_charge", 
      "delivery", "delivery_charge", "description", "desc", "detail", "brand", "brand_name"
    ];

    const categoryCache = {}; // Slug -> Category Document

    const getOrCreateCategory = async (catName, parentObj, level) => {
      if (!catName) return null;
      
      const toSlug = (value = "") => String(value || "").trim().replace(/\s+/g, " ").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
      
      const parentSlugPrefix = parentObj ? parentObj.slug + "-" : "";
      const rawSlug = parentSlugPrefix + toSlug(catName);

      if (categoryCache[rawSlug]) return categoryCache[rawSlug];

      let cat = await Category.findOne({ slug: rawSlug });
      if (!cat) {
        cat = await Category.create({
          name: catName,
          slug: rawSlug,
          parent: parentObj ? parentObj._id : null,
          level: level,
          createdBy: req.user?._id
        });
      }
      categoryCache[rawSlug] = cat;
      return cat;
    };

    for (let i = 1; i < rows.length; i++) {
      try {
        const row = rows[i];
        if (!row || row.length < 2) continue; 

        // Row ko Object me convert karna
        const obj = {};
        rawHeaders.forEach((h, idx) => {
          if (h) obj[h.trim()] = row[idx];
        });

        // Smart Key Finder
        const getValIgnoreCase = (possibleKeys) => {
            const normPossible = possibleKeys.map(k => k.toLowerCase().replace(/[^a-z0-9]/g, ""));
            const foundKey = Object.keys(obj).find(k => {
                if (!k) return false;
                const normK = k.toLowerCase().replace(/[^a-z0-9]/g, "");
                return normPossible.includes(normK);
            });
            return foundKey ? obj[foundKey] : "";
        };

        const skuRaw = getValIgnoreCase(["sku", "product_id", "code"]) || obj["SKU"];
        const nameRaw = getValIgnoreCase(["name", "product_name", "title"]) || obj["Product_Name"];
        
        if (!skuRaw || !nameRaw) {
          throw new Error("Is row mein SKU ya Name missing hai!"); 
        }

        const sku = String(skuRaw).trim();
        const name = String(nameRaw).trim();

        if (!baseSkusImported.includes(sku)) {
          baseSkusImported.push(sku);
        }

        const price = sanitizeNum(getValIgnoreCase(["selling_price", "price", "selling price", "sellingprice"]));
        const mrp = sanitizeNum(getValIgnoreCase(["mrp", "mrp_price", "mrp price", "original_price", "original price"]));
        const stock = sanitizeNum(getValIgnoreCase(["stock", "qty"]));
        const gstRate = sanitizeNum(getValIgnoreCase(["gst", "gst_rate", "gst_percent", "tax"]));
        const shippingCharge = sanitizeNum(getValIgnoreCase(["shipping", "shipping_charge", "delivery", "delivery_charge"]));
        const weightKg = sanitizeNum(getValIgnoreCase(["weight", "weight_kg", "weight_kg", "weight(kg)", "weight (kg)"]));
        
        const description = String(getValIgnoreCase(["description", "desc", "detail"]) || "").trim();
        const brand = String(getValIgnoreCase(["brand", "brand_name"]) || "").trim();

        let status = String(getValIgnoreCase(["status"]) || "Active").trim();
        if (status.toLowerCase() === "active") status = "Active";
        else if (status.toLowerCase() === "inactive") status = "Inactive";
        else status = "Active"; 

        const slugBase = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        const slug = `${slugBase}-${sku.toLowerCase()}`;

        let searchTags = [];
        const searchTagsRaw = getValIgnoreCase(["search_tags", "tags"]);
        if (searchTagsRaw) {
           searchTags = String(searchTagsRaw).split(",").map(t => t.trim()).filter(t => t !== "");
        }

        // 🔥 NO HARDCODING: Dynamic loop for Categories, Images, Variations, and Details!
        const categories = [];
        const images = [];
        const attributesMap = {};
        const detailsArray = [];

        Object.keys(obj).forEach(key => {
            if (!key) return;
            const lowerKey = key.toLowerCase();
            const val = obj[key];

            if (val === undefined || val === null || val === "") return; // Skip empty fields

            // Dynamic Images
            if (lowerKey.startsWith("image")) {
                images.push(String(val).trim());
            }
            // 3. Dynamic Variations (_Add, _SKU, _MRP, _Stock, _Qty)
            else if (
                lowerKey.endsWith("_add") || 
                lowerKey.endsWith("_sku") || 
                lowerKey.endsWith("_mrp") || 
                lowerKey.endsWith("_stock") || 
                lowerKey.endsWith("_qty")
            ) {
                let suffix = "";
                let cleanKey = "";
                if (lowerKey.endsWith("_add")) { suffix = "add"; cleanKey = key.slice(0, -4); }
                else if (lowerKey.endsWith("_sku")) { suffix = "sku"; cleanKey = key.slice(0, -4); }
                else if (lowerKey.endsWith("_mrp")) { suffix = "mrp"; cleanKey = key.slice(0, -4); }
                else if (lowerKey.endsWith("_stock")) { suffix = "stock"; cleanKey = key.slice(0, -6); }
                else if (lowerKey.endsWith("_qty")) { suffix = "stock"; cleanKey = key.slice(0, -4); }

                if (suffix) {
                    const parts = cleanKey.split("_");
                    const groupName = parts[0].trim().toUpperCase();
                    const optionName = parts.slice(1).join(" ").trim();

                    if (groupName && optionName) {
                        if (!attributesMap[groupName]) {
                            attributesMap[groupName] = [];
                        }
                        let optionObj = attributesMap[groupName].find(opt => opt.value === optionName);
                        if (!optionObj) {
                            optionObj = {
                                value: optionName,
                                priceAdjustment: 0,
                                meta: { sku: "", stock: "", mrp: "" }
                            };
                            attributesMap[groupName].push(optionObj);
                        }

                        if (suffix === "add") {
                            optionObj.priceAdjustment = sanitizeNum(val);
                        } else if (suffix === "sku") {
                            optionObj.meta.sku = String(val).trim();
                        } else if (suffix === "mrp") {
                            optionObj.meta.mrp = String(sanitizeNum(val));
                        } else if (suffix === "stock") {
                            optionObj.meta.stock = String(sanitizeNum(val));
                        }
                    }
                }
            }
            // 4. Dynamic Details (Everything else!)
            else if (!coreFields.includes(lowerKey) && !lowerKey.startsWith("unnamed")) {
                detailsArray.push({ key: String(key).trim(), value: String(val).trim() });
            }
        });

        // 🔥 Nested Category Extraction & Resolution
        const cat1Name = String(getValIgnoreCase(["category_1", "category 1", "category1", "main_category", "category"]) || "").trim();
        const cat2Name = String(getValIgnoreCase(["category_2", "category 2", "category2", "sub_category"]) || "").trim();
        const cat3Name = String(getValIgnoreCase(["category_3", "category 3", "category3"]) || "").trim();

        if (cat1Name) categories.push(cat1Name);
        if (cat2Name) categories.push(cat2Name);
        if (cat3Name) categories.push(cat3Name);

        let deepestCategoryId = null;
        let deepestCategoryName = "Uncategorized";

        if (cat1Name) {
            const cat1 = await getOrCreateCategory(cat1Name, null, 1);
            deepestCategoryId = cat1._id;
            deepestCategoryName = cat1.name;

            if (cat2Name) {
                const cat2 = await getOrCreateCategory(cat2Name, cat1, 2);
                deepestCategoryId = cat2._id;
                deepestCategoryName = cat2.name;

                if (cat3Name) {
                    const cat3 = await getOrCreateCategory(cat3Name, cat2, 3);
                    deepestCategoryId = cat3._id;
                    deepestCategoryName = cat3.name;
                }
            }
        }

        const mainCategory = deepestCategoryName;
        const mainImage = images.length > 0 ? images[0] : DEFAULT_PRODUCT_IMAGE;

        const attributesArray = Object.keys(attributesMap).map(group => ({
          name: group,
          type: "select",
          options: attributesMap[group]
        }));

        const updatePayload = {
            baseSku: sku,         
            name: name,
            description: description,
            brand: brand,
            slug: slug,           
            price: price,
            mrp: mrp,
            stock: stock,
            status: status,       
            gstRate: gstRate,
            shippingCharge: shippingCharge, 
            weightKg: weightKg,
            category: mainCategory,
            categoryId: deepestCategoryId,
            categories: categories,
            image: mainImage,
            images: images,
            searchTags: searchTags,
            attributes: attributesArray, 
            hasVariants: attributesArray.length > 0,
            details: detailsArray
        };

        if (req.user && req.user._id) {
            updatePayload.user = req.user._id;
        }

        ops.push({
          updateOne: {
            filter: { baseSku: sku },
            update: { $set: updatePayload },
            upsert: true,
          },
        });
      } catch (e) {
        failed++;
        errorLogs.push({ row: i + 1, message: e.message, rawData: rows[i] });
      }
    }

    let importedCount = 0;
    let updatedCount = 0;
    let matchedCount = 0;
    let uiDisplayCount = 0;
    let createdProductIds = [];

    if (ops.length > 0) {
      const bulkResult = await Product.bulkWrite(ops, { ordered: false });
      importedCount = bulkResult.upsertedCount || 0; 
      updatedCount = bulkResult.modifiedCount || 0; 
      matchedCount = bulkResult.matchedCount || 0;
      // uiDisplayCount is total touched items. Since matchedCount includes modified items, we sum imported + matched.
      uiDisplayCount = importedCount + matchedCount; 
      
      if (bulkResult.upsertedIds) {
        createdProductIds = Object.values(bulkResult.upsertedIds).map(val => val._id || val);
      }
    }

    await ProductImportJob.create({
      fileName: req.file?.originalname || "upload.csv",
      originalName: req.file?.originalname || "upload.csv",
      fileSize: req.file?.size || 0,
      totalRows: rows.length - 1,
      processed: ops.length,
      importedCount: uiDisplayCount, 
      updatedCount: updatedCount,
      failedCount: failed,
      status: ops.length === 0 ? "failed" : "completed",
      createdBy: req.user?._id || null,
      createdProductIds: createdProductIds, 
      errorLogs: errorLogs,
      startedAt: startTime,
      completedAt: new Date()
    });

    clearProductsCache();

    res.json({
      success: true,
      message: `Success! Checked ${uiDisplayCount} items. (New: ${importedCount}, Updated: ${updatedCount})`,
      stats: { processed: ops.length, new: importedCount, updated: updatedCount, matched: matchedCount, failed },
      errors: errorLogs.length > 0 ? errorLogs.slice(0, 5) : undefined // Agar fail hua, toh frontend pe reason dikhayega
    });

  } catch (err) {
    console.error("IMPORT ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ==========================
// CSV EXPORT
// ==========================

export const exportProductsCsv = async (req, res) => {
  try {
    const products = await Product.find().lean();
    const rows = [];

    products.forEach(p => {
      rows.push([
        p.baseSku || "", 
        p.name || "", 
        p.category || "", 
        p.price || 0, 
        p.mrp || 0,
        p.gstRate || 0,            
        p.shippingCharge || 0,     
        p.weightKg || 0,
        p.stock || 0,
        p.hasVariants ? "Yes" : "No"
      ]);
    });

    const headers = ["SKU", "Name", "Category", "Base Price", "MRP", "GST (%)", "Shipping Charge", "Weight (kg)", "Stock", "Has Variations"];
    const csv = [
      headers.join(","),
      ...rows.map(r => r.join(",")),
    ].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=products_export.csv");
    res.send(csv);

  } catch (err) {
    console.error("EXPORT ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ==========================
// IMPORT HISTORY & ROLLBACK
// ==========================

export const getImportOverview = async (req, res) => {
  try {
    const jobs = await ProductImportJob.find();
    res.json({
      success: true,
      overview: {
        totalJobs: jobs.length,
        totalImported: jobs.reduce((sum, job) => sum + (job.importedCount || 0), 0),
        totalFailed: jobs.reduce((sum, job) => sum + (job.failedCount || 0), 0),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getImportHistory = async (req, res) => {
  try {
    const jobs = await ProductImportJob.find().sort({ createdAt: -1 });
    res.json({ success: true, jobs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const rollbackImport = async (req, res) => {
  try {
    const jobId = req.params.id;
    const job = await ProductImportJob.findById(jobId);
    if (!job) return res.status(404).json({ success: false, message: "Import record not found!" });

    if (job.status === "rolled_back") {
      return res.status(400).json({ success: false, message: "This file has already been rolled back!" });
    }

    if (job.createdProductIds && job.createdProductIds.length > 0) {
      await Product.deleteMany({ _id: { $in: job.createdProductIds } });
    }

    job.status = "rolled_back";
    job.rollbackAt = new Date(); 
    await job.save();

    clearProductsCache();

    res.json({ success: true, message: "Rollback Successful! Products have been deleted." });

  } catch (err) {
    res.status(500).json({ success: false, message: "Rollback failed." });
  }
};

export const deleteImportHistory = async (req, res) => {
  try {
    const jobId = req.params.id;
    await ProductImportJob.findByIdAndDelete(jobId);
    res.json({ success: true, message: "CSV History record deleted!" });
  } catch (err) {
    res.status(500).json({ success: false, message: "History deletion failed." });
  }
};

export const clearCatalog = async (req, res) => {
  try {
    await Product.deleteMany({});
    await Category.deleteMany({});
    await ProductImportJob.deleteMany({});
    clearProductsCache();
    res.json({ success: true, message: "Catalog cleared successfully! All products, categories, and import jobs have been deleted." });
  } catch (err) {
    console.error("Clear Catalog Error:", err);
    res.status(500).json({ success: false, message: "Failed to clear catalog: " + err.message });
  }
};