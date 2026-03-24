import fs from "fs/promises";
import Product from "../models/Product.js";
import ProductImportJob from "../models/ProductImportJob.js";
import Category from "../models/Category.js";

const DEFAULT_PRODUCT_IMAGE = "https://placehold.co/600x600?text=Product";
const LEGACY_IMPORT_JOB_ID = "legacy-untracked-products";

const normalizeCsvKey = (key = "") =>
  key.trim().toLowerCase().replace(/\s+/g, "_");

const getFirstNonEmptyValue = (rowObj, keys = []) => {
  for (const key of keys) {
    const value = rowObj[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return "";
};

const parseCsvContent = (csvText = "") => {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i += 1) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        cell += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") i += 1;
      row.push(cell);
      if (row.some((item) => String(item || "").trim() !== "")) {
        rows.push(row.map((item) => String(item || "").trim()));
      }
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    if (row.some((item) => String(item || "").trim() !== "")) {
      rows.push(row.map((item) => String(item || "").trim()));
    }
  }

  return rows;
};

const csvEscape = (value) => {
  const str = value === undefined || value === null ? "" : String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const escapeRegex = (text = "") => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const normalizeText = (value = "") => String(value || "").trim().replace(/\s+/g, " ");
const stripHtml = (value = "") => normalizeText(String(value || "").replace(/<[^>]*>/g, " "));
const toSlug = (value = "") =>
  normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
const cleanLabel = (raw = "", prefix = "") =>
  normalizeText(
    String(raw || "")
      .replace(prefix, "")
      .replace(/[{}]/g, "")
      .replace(/_/g, " ")
  ).toUpperCase();

const splitOptionTokens = (rawValue = "") => {
  const raw = String(rawValue || "").trim();
  if (!raw) return [];
  if (/[;\n]/.test(raw)) {
    return raw
      .split(/[;\n]+/)
      .map((value) => normalizeText(value))
      .filter(Boolean);
  }
  if (raw.includes("|")) {
    const looksLikeAdjustment = /^.+\|\s*-?\d+(\.\d+)?$/.test(raw);
    if (looksLikeAdjustment) return [normalizeText(raw)];
    return raw
      .split("|")
      .map((value) => normalizeText(value))
      .filter(Boolean);
  }
  return [normalizeText(raw)];
};

const parseOptionLine = (rawOption = "") => {
  const [rawLabel, rawAdjustment] = String(rawOption || "").split("|");
  const label = normalizeText(rawLabel);
  if (!label) return null;
  const adjustment = Number(rawAdjustment);
  return {
    label,
    priceAdjustment: Number.isFinite(adjustment) ? adjustment : 0,
  };
};

const ALLOWED_CUSTOM_FIELD_TYPES = new Set(["radio", "checkbox", "text"]);
const toSafeNumber = (value, fallback = 0) => {
  const parsed = Number(String(value ?? "").replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toOptionalNumber = (value) => {
  if (value === undefined || value === null) return null;
  const raw = String(value).replace(/,/g, "").trim();
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
};

const hasMeaningfulValue = (value) => {
  if (value === undefined || value === null) return false;
  const raw = String(value).trim();
  if (!raw) return false;
  const parsed = Number(raw);
  if (Number.isFinite(parsed) && parsed === 0) return false;
  return true;
};

const parseSearchTags = (rawValue = "") => {
  const raw = String(rawValue || "").trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((tag) => normalizeText(tag.replace(/[()]/g, "")))
    .filter(Boolean);
};

const normalizeStatus = (rawValue = "") => {
  const raw = normalizeText(rawValue).toLowerCase();
  if (!raw) return "Active";
  if (raw.includes("hidden") || raw.includes("inactive")) return "Hidden";
  return "Active";
};

const buildCategoryPath = (categories = []) =>
  categories.map((item) => normalizeText(item)).filter(Boolean).join(" / ");

const buildSearchIndex = (name = "", sku = "", tags = []) =>
  normalizeText([name, sku, ...(Array.isArray(tags) ? tags : [])].join(" ")).toLowerCase();

const buildCatalogCustomFields = (variation) => {
  const fields = [];
  const buildOption = (label, adjustment) => {
    if (adjustment === null || adjustment === undefined) return null;
    const safeLabel = normalizeText(label);
    if (!safeLabel) return null;
    return { label: safeLabel, priceAdjustment: toSafeNumber(adjustment, 0) };
  };

  const colorOptions = [
    buildOption("Red", variation.colorRedAdd),
    buildOption("Green", variation.colorGreenAdd),
    buildOption("Blue", variation.colorBlueAdd),
  ].filter(Boolean);
  if (colorOptions.length > 0) {
    fields.push({ label: "Color", type: "radio", required: true, options: colorOptions });
  }

  const holeOptions = [
    buildOption("9mm", variation.hole9mmAdd),
    buildOption("12mm", variation.hole12mmAdd),
  ].filter(Boolean);
  if (holeOptions.length > 0) {
    fields.push({ label: "Hole Size", type: "radio", required: true, options: holeOptions });
  }

  const materialOptions = [
    buildOption("TezTech", variation.materialTezTechAdd),
    buildOption("Sunrise", variation.materialSunriseAdd),
  ].filter(Boolean);
  if (materialOptions.length > 0) {
    fields.push({ label: "Material Brand", type: "radio", required: true, options: materialOptions });
  }

  const powerOptions = [
    buildOption("12W", variation.power12WAdd),
    buildOption("24W", variation.power24WAdd),
  ].filter(Boolean);
  if (powerOptions.length > 0) {
    fields.push({ label: "Power", type: "radio", required: true, options: powerOptions });
  }

  const addonOptions = [
    buildOption("Remote", variation.remoteAdd),
    buildOption("Waterproof", variation.waterproofAdd),
  ].filter(Boolean);
  if (addonOptions.length > 0) {
    fields.push({ label: "Add-ons", type: "checkbox", required: false, options: addonOptions });
  }

  return fields;
};

const buildCatalogDetails = (specs = {}) => {
  const specRows = [
    { key: "Height (ft)", value: specs.heightFt },
    { key: "Width (ft)", value: specs.widthFt },
    { key: "Total Holes", value: specs.totalHoles },
    { key: "Hole Size", value: specs.holeSize },
    { key: "Material Type", value: specs.materialType },
    { key: "Sheet Thickness", value: specs.sheetThickness },
    { key: "LED Compatible", value: specs.ledCompatible },
    { key: "Input Voltage", value: specs.inputVoltage },
    { key: "Output Voltage", value: specs.outputVoltage },
    { key: "Power (Watt)", value: specs.powerWatt },
    { key: "Connectivity", value: specs.connectivity },
    { key: "IC Number", value: specs.icNumber },
    { key: "LED Per Meter", value: specs.ledPerMeter },
    { key: "Controller Type", value: specs.controllerType },
    { key: "Warranty", value: specs.warranty },
  ];

  return specRows
    .map((item) => ({
      key: normalizeText(item.key),
      value: normalizeText(item.value),
    }))
    .filter((item) => item.key && hasMeaningfulValue(item.value));
};

const cleanupUploadedCsv = async (file) => {
  if (!file?.path) return;
  try {
    await fs.unlink(file.path);
  } catch {
    // Ignore cleanup errors (file may already be removed).
  }
};

const parseCustomFields = (rawValue) => {
  if (rawValue === undefined) return undefined;

  let parsed = rawValue;
  if (typeof rawValue === "string") {
    try {
      parsed = JSON.parse(rawValue);
    } catch {
      return [];
    }
  }

  if (!Array.isArray(parsed)) return [];

  const normalized = parsed
    .map((item) => {
      const label = String(item?.label || "").trim();
      if (!label) return null;

      const typeCandidate = String(item?.type || "radio").trim().toLowerCase();
      const type = ALLOWED_CUSTOM_FIELD_TYPES.has(typeCandidate) ? typeCandidate : "radio";
      const required = Boolean(item?.required);

      const rawOptions = Array.isArray(item?.options) ? item.options : [];
      const options = rawOptions
        .map((option) => {
          if (option && typeof option === "object" && !Array.isArray(option)) {
            const label = String(option.label || "").trim();
            if (!label) return null;
            return {
              label,
              priceAdjustment: toSafeNumber(option.priceAdjustment, 0),
            };
          }

          const label = String(option || "").trim();
          if (!label) return null;
          return {
            label,
            priceAdjustment: 0,
          };
        })
        .filter(Boolean);

      if ((type === "radio" || type === "checkbox") && options.length === 0) {
        return null;
      }

      return {
        label,
        type,
        required,
        options,
      };
    })
    .filter(Boolean);

  return normalized;
};

const parseDetails = (rawValue) => {
  if (rawValue === undefined) return undefined;

  let parsed = rawValue;
  if (typeof rawValue === "string") {
    try {
      parsed = JSON.parse(rawValue);
    } catch {
      return [];
    }
  }

  if (!Array.isArray(parsed)) return [];

  return parsed
    .map((item) => ({
      key: normalizeText(item?.key || ""),
      value: normalizeText(item?.value || ""),
    }))
    .filter((item) => item.key && item.value);
};

const getFirstNonEmptyFromRows = (rows = [], keys = []) => {
  for (const row of rows) {
    const value = getFirstNonEmptyValue(row, keys);
    if (value) return value;
  }
  return "";
};

const buildDetailsFromRows = (rows = []) => {
  const headers = Object.keys(rows[0] || {});
  return headers
    .filter((header) => header.startsWith("product_attribute_"))
    .map((header) => {
      const value = getFirstNonEmptyFromRows(rows, [header]);
      return {
        key: cleanLabel(header, "product_attribute_"),
        value: normalizeText(value),
      };
    })
    .filter((item) => item.key && item.value);
};

const buildCustomFieldsFromRows = (rows = []) => {
  const headers = Object.keys(rows[0] || {});
  const variationFields = headers
    .filter((header) => header.startsWith("product_variation_option_"))
    .map((header) => {
      const uniqueMap = new Map();
      rows.forEach((row) => {
        splitOptionTokens(row[header]).forEach((rawOption) => {
          const parsed = parseOptionLine(rawOption);
          if (!parsed) return;
          const key = parsed.label.toLowerCase();
          if (!uniqueMap.has(key)) {
            uniqueMap.set(key, parsed);
            return;
          }
          const existing = uniqueMap.get(key);
          if (existing.priceAdjustment === 0 && parsed.priceAdjustment !== 0) {
            uniqueMap.set(key, parsed);
          }
        });
      });

      const options = Array.from(uniqueMap.values()).map((option) => ({
        label: option.label,
        priceAdjustment: toSafeNumber(option.priceAdjustment, 0),
      }));

      return {
        label: cleanLabel(header, "product_variation_option_"),
        type: "radio",
        required: true,
        options,
      };
    })
    .filter((field) => field.label && field.options.length > 0);

  const optionNameKey = headers.find((header) => header === "product_option_name");
  const optionValueKey = headers.find((header) => header === "product_option_value");
  const genericOptionFields = [];

  if (optionNameKey && optionValueKey) {
    const grouped = new Map();
    rows.forEach((row) => {
      const label = normalizeText(row[optionNameKey]);
      if (!label) return;
      const mapKey = label.toLowerCase();
      if (!grouped.has(mapKey)) grouped.set(mapKey, { label: label.toUpperCase(), options: new Map() });
      splitOptionTokens(row[optionValueKey]).forEach((rawValue) => {
        const parsed = parseOptionLine(rawValue);
        if (!parsed) return;
        const optionKey = parsed.label.toLowerCase();
        if (!grouped.get(mapKey).options.has(optionKey)) {
          grouped.get(mapKey).options.set(optionKey, parsed);
          return;
        }
        const existing = grouped.get(mapKey).options.get(optionKey);
        if (existing.priceAdjustment === 0 && parsed.priceAdjustment !== 0) {
          grouped.get(mapKey).options.set(optionKey, parsed);
        }
      });
    });

    grouped.forEach((item) => {
      const options = Array.from(item.options.values()).map((opt) => ({
        label: opt.label,
        priceAdjustment: toSafeNumber(opt.priceAdjustment, 0),
      }));
      if (options.length > 0) {
        genericOptionFields.push({
          label: item.label,
          type: "radio",
          required: true,
          options,
        });
      }
    });
  }

  const merged = new Map();
  [...variationFields, ...genericOptionFields].forEach((field) => {
    const key = normalizeText(field.label).toLowerCase();
    if (!key) return;
    if (!merged.has(key)) {
      merged.set(key, {
        ...field,
        options: [...field.options],
      });
      return;
    }
    const existing = merged.get(key);
    const optionMap = new Map(existing.options.map((opt) => [normalizeText(opt.label).toLowerCase(), opt]));
    field.options.forEach((option) => {
      const optionKey = normalizeText(option.label).toLowerCase();
      if (!optionMap.has(optionKey)) optionMap.set(optionKey, option);
    });
    existing.options = Array.from(optionMap.values());
  });

  return Array.from(merged.values()).filter((field) => field.options.length > 0);
};

const ensureCategoriesExist = async (categoryNames = [], userId) => {
  const normalizedNames = Array.from(
    new Set(categoryNames.map((name) => normalizeText(name)).filter(Boolean))
  );
  if (normalizedNames.length === 0) return;

  for (const name of normalizedNames) {
    const exists = await Category.findOne({
      name: { $regex: `^${escapeRegex(name)}$`, $options: "i" },
    }).select("_id");

    if (exists) continue;

    const baseSlug = toSlug(name) || "category";
    let slug = baseSlug;
    let idx = 1;
    while (await Category.exists({ slug })) {
      slug = `${baseSlug}-${idx}`;
      idx += 1;
    }

    await Category.create({
      name,
      slug,
      createdBy: userId,
    });
  }
};

const cleanupUnusedCategoriesByNames = async (categoryNames = []) => {
  const normalizedNames = Array.from(
    new Set(categoryNames.map((name) => normalizeText(name)).filter(Boolean))
  );
  if (normalizedNames.length === 0) return 0;

  const activeProductCategories = await Product.distinct("category");
  const activeCategorySet = new Set(
    activeProductCategories.map((name) => normalizeText(name).toLowerCase())
  );

  const removableNames = normalizedNames.filter(
    (name) => !activeCategorySet.has(name.toLowerCase())
  );

  if (removableNames.length === 0) return 0;

  const results = await Promise.all(
    removableNames.map((name) =>
      Category.deleteMany({
        name: { $regex: `^${escapeRegex(name)}$`, $options: "i" },
      })
    )
  );

  return results.reduce((sum, result) => sum + (result?.deletedCount || 0), 0);
};

const cleanupAllUnusedCategories = async () => {
  const allCategoryNames = await Category.distinct("name");
  return cleanupUnusedCategoriesByNames(allCategoryNames);
};

const buildProductFilters = ({ keyword, category, minPriceRaw, maxPriceRaw, includeHidden }) => {
  const filters = {};
  const andConditions = [];

  const searchTerm = normalizeText(keyword);
  if (searchTerm) {
    const regex = { $regex: searchTerm, $options: "i" };
    andConditions.push({
      $or: [
        { name: regex },
        { searchIndex: regex },
        { searchTags: regex },
        { sku: regex },
      ],
    });
  }

  const categoryTerm = normalizeText(category);
  if (categoryTerm) {
    const regex = { $regex: `^${escapeRegex(categoryTerm)}$`, $options: "i" };
    andConditions.push({ $or: [{ category: regex }, { categoryPath: regex }] });
  }

  const minPrice = Number(minPriceRaw);
  const maxPrice = Number(maxPriceRaw);
  if (Number.isFinite(minPrice) || Number.isFinite(maxPrice)) {
    const priceFilter = {};
    if (Number.isFinite(minPrice)) priceFilter.$gte = minPrice;
    if (Number.isFinite(maxPrice)) priceFilter.$lte = maxPrice;
    andConditions.push({ price: priceFilter });
  }

  if (!includeHidden) {
    filters.status = { $regex: "^active$", $options: "i" };
  }

  if (andConditions.length) {
    filters.$and = andConditions;
  }

  return filters;
};

// @desc    Fetch all products from DB (With Search & Pagination)
export const getProducts = async (req, res) => {
  try {
    const keyword = String(req.query.keyword || req.query.q || "").trim();
    const category = String(req.query.category || "").trim();
    const filters = buildProductFilters({
      keyword,
      category,
      minPriceRaw: req.query.minPrice,
      maxPriceRaw: req.query.maxPrice,
      includeHidden: false,
    });

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 8;
    const skip = (page - 1) * limit;
    const randomize = ["1", "true", "yes"].includes(String(req.query.random || "").toLowerCase());

    const count = await Product.countDocuments(filters);
    let products = [];

    if (randomize) {
      products = await Product.aggregate([
        { $match: filters },
        { $addFields: { __rand: { $rand: {} } } },
        { $sort: { __rand: 1 } },
        { $skip: skip },
        { $limit: limit },
        { $project: { __rand: 0 } },
      ]);
    } else {
      products = await Product.find(filters)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
    }

    res.status(200).json({
      success: true,
      products,
      page,
      totalPages: Math.ceil(count / limit) || 1,
      totalProducts: count,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Fetch all products for Admin (includes hidden)
export const getProductsAdmin = async (req, res) => {
  try {
    const keyword = String(req.query.keyword || req.query.q || "").trim();
    const category = String(req.query.category || "").trim();
    const filters = buildProductFilters({
      keyword,
      category,
      minPriceRaw: req.query.minPrice,
      maxPriceRaw: req.query.maxPrice,
      includeHidden: true,
    });

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const count = await Product.countDocuments(filters);
    const products = await Product.find(filters)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      products,
      page,
      totalPages: Math.ceil(count / limit) || 1,
      totalProducts: count,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single product by ID
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    res.status(200).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create Product (Admin Only)
export const createProduct = async (req, res) => {
  try {
    const { name, description, price, gstRate, shippingCharge, category, stock, brand, sku } = req.body;
    const image = req.file ? req.file.path : "";
    const customFields = parseCustomFields(req.body.customFields) || [];
    const details = parseDetails(req.body.details) || [];

    if (!name) {
      return res.status(400).json({ 
        success: false, 
        message: "Please provide product name" 
      });
    }

    const product = await Product.create({
      name,
      description: description || name,
      price: Number(price) || 0,
      sellingPrice: Number(price) || 0,
      category: category || "Uncategorized",
      stock: Number(stock) || 0,
      gstRate: Math.max(0, Math.min(100, toSafeNumber(gstRate, 0))),
      shippingCharge: Math.max(0, toSafeNumber(shippingCharge, 0)),
      brand: brand || "",
      sku: normalizeText(sku) || undefined,
      image: image || DEFAULT_PRODUCT_IMAGE,
      user: req.user._id,
      customFields,
      details,
      searchIndex: buildSearchIndex(name, normalizeText(sku) || "", []),
    });

    res.status(201).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update Product
// @route   PUT /api/products/:id
export const updateProduct = async (req, res) => {
  try {
    const { name, description, price, gstRate, shippingCharge, category, stock, brand, sku } = req.body;
    const parsedCustomFields = parseCustomFields(req.body.customFields);
    const parsedDetails = parseDetails(req.body.details);
    
    // 1. Check if product exists
    let product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // 2. Handle Image update
    const image = req.file ? req.file.path : product.image;

    // 3. Prepare Update Object with strict Number conversion
    const nextName = name || product.name;
    const nextSku = sku !== undefined ? normalizeText(sku) || undefined : product.sku;

    const updatedData = {
      name: nextName,
      description: description || product.description,
      price: price ? Number(price) : product.price,
      sellingPrice: price ? Number(price) : product.sellingPrice ?? product.price,
      category: category || product.category,
      brand: brand || product.brand,
      sku: nextSku,
      stock: stock !== undefined ? Math.max(0, Number(stock)) : product.stock,
      gstRate:
        gstRate !== undefined
          ? Math.max(0, Math.min(100, toSafeNumber(gstRate, product.gstRate || 0)))
          : product.gstRate || 0,
      shippingCharge:
        shippingCharge !== undefined
          ? Math.max(0, toSafeNumber(shippingCharge, product.shippingCharge || 0))
          : product.shippingCharge || 0,
      image: image,
      customFields: parsedCustomFields !== undefined ? parsedCustomFields : product.customFields,
      details: parsedDetails !== undefined ? parsedDetails : product.details,
      searchIndex: buildSearchIndex(nextName, nextSku || "", product.searchTags || []),
    };

    // 4. Update in Database
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: updatedData }, 
      { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, product: updatedProduct });
  } catch (error) {
    console.error("Update Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update Product Status (Admin Only)
export const updateProductStatus = async (req, res) => {
  try {
    const statusInput = req.body?.status;
    const isActive = req.body?.isActive;
    let nextStatus = "";

    if (typeof isActive === "boolean") {
      nextStatus = isActive ? "Active" : "Hidden";
    } else if (statusInput !== undefined) {
      nextStatus = normalizeStatus(statusInput);
    }

    if (!nextStatus) {
      return res.status(400).json({ success: false, message: "Status or isActive is required" });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { status: nextStatus },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.status(200).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete Product
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    await product.deleteOne();
    res.status(200).json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Fetch distinct product categories for filters
export const getProductCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .select("name");
    const cleaned = categories.map((item) => item.name);
    res.status(200).json({ success: true, categories: cleaned });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Export products as CSV (Admin Only)
export const exportProductsCsv = async (req, res) => {
  try {
    const products = await Product.find({})
      .sort({ createdAt: -1 })
      .select(
        "productId sku name categories categoryPath mrp sellingPrice stock status searchTags images heightFt widthFt totalHoles holeSize materialType sheetThickness ledCompatible inputVoltage outputVoltage powerWatt connectivity icNumber ledPerMeter controllerType warranty colorRedAdd colorGreenAdd colorBlueAdd hole9mmAdd hole12mmAdd materialTezTechAdd materialSunriseAdd power12WAdd power24WAdd remoteAdd waterproofAdd"
      );

    const header = [
      "Product_ID",
      "SKU",
      "Product_Name",
      "Category_1",
      "Category_2",
      "Category_3",
      "Category_4",
      "Category_5",
      "MRP",
      "Selling_Price",
      "Stock",
      "Status",
      "Search_Tags",
      "Image_1",
      "Image_2",
      "Image_3",
      "Image_4",
      "Image_5",
      "Image_6",
      "Height_ft",
      "Width_ft",
      "Total_Holes",
      "Hole_Size",
      "Material_Type",
      "Sheet_Thickness",
      "LED_Compatible",
      "Input_Voltage",
      "Output_Voltage",
      "Power_Watt",
      "Connectivity",
      "IC_Number",
      "LED_Per_Meter",
      "Controller_Type",
      "Warranty",
      "Color_Red_Add",
      "Color_Green_Add",
      "Color_Blue_Add",
      "Hole_9mm_Add",
      "Hole_12mm_Add",
      "Material_TezTech_Add",
      "Material_Sunrise_Add",
      "Power_12W_Add",
      "Power_24W_Add",
      "Remote_Add",
      "Waterproof_Add",
    ];

    const rows = products.map((product) => {
      const categories = Array.isArray(product.categories) ? product.categories : [];
      const images = Array.isArray(product.images) ? product.images : [];
      const searchTags = Array.isArray(product.searchTags) ? product.searchTags.join(",") : "";

      const base = [
        product.productId || "",
        product.sku || "",
        product.name || "",
        categories[0] || "",
        categories[1] || "",
        categories[2] || "",
        categories[3] || "",
        categories[4] || "",
        product.mrp ?? 0,
        product.sellingPrice ?? product.price ?? 0,
        product.stock ?? 0,
        product.status || "Active",
        searchTags,
        images[0] || "",
        images[1] || "",
        images[2] || "",
        images[3] || "",
        images[4] || "",
        images[5] || "",
        product.heightFt || "",
        product.widthFt || "",
        product.totalHoles || "",
        product.holeSize || "",
        product.materialType || "",
        product.sheetThickness || "",
        product.ledCompatible || "",
        product.inputVoltage || "",
        product.outputVoltage || "",
        product.powerWatt || "",
        product.connectivity || "",
        product.icNumber || "",
        product.ledPerMeter || "",
        product.controllerType || "",
        product.warranty || "",
        product.colorRedAdd ?? "",
        product.colorGreenAdd ?? "",
        product.colorBlueAdd ?? "",
        product.hole9mmAdd ?? "",
        product.hole12mmAdd ?? "",
        product.materialTezTechAdd ?? "",
        product.materialSunriseAdd ?? "",
        product.power12WAdd ?? "",
        product.power24WAdd ?? "",
        product.remoteAdd ?? "",
        product.waterproofAdd ?? "",
      ];

      return base.map(csvEscape).join(",");
    });

    const csv = [header.join(","), ...rows].join("\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="products-export.csv"`);
    res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Import products from CSV (Admin Only)
export const importProductsCsv = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ success: false, message: "CSV file is required" });
    }

    const csvText = req.file.buffer.toString("utf8").replace(/^\uFEFF/, "").trim();
    if (!csvText) {
      return res.status(400).json({ success: false, message: "CSV file is empty" });
    }

    const rows = parseCsvContent(csvText);
    if (rows.length < 2) {
      return res.status(400).json({ success: false, message: "CSV must include header and at least one row" });
    }

    const headers = rows[0].map(normalizeCsvKey);
    if (!headers.includes("sku")) {
      return res.status(400).json({ success: false, message: "CSV must include SKU column" });
    }
    if (!headers.includes("product_name")) {
      return res.status(400).json({ success: false, message: "CSV must include Product_Name column" });
    }

    const rowErrors = [];
    let skippedRows = 0;
    const preparedProducts = [];
    const touchedCategoryNames = new Set();

    for (let i = 1; i < rows.length; i += 1) {
      const rowNumber = i + 1;
      const cells = rows[i];
      const rowObj = {};

      headers.forEach((header, index) => {
        rowObj[header] = (cells[index] || "").trim();
      });

      const hasAnyValue = Object.values(rowObj).some((value) => String(value || "").trim() !== "");
      if (!hasAnyValue) {
        skippedRows += 1;
        continue;
      }

      const sku = normalizeText(rowObj.sku);
      if (!sku) {
        rowErrors.push({ row: rowNumber, message: "Missing SKU" });
        continue;
      }

      const name = normalizeText(rowObj.product_name) || sku;
      const categories = [
        rowObj.category_1,
        rowObj.category_2,
        rowObj.category_3,
        rowObj.category_4,
        rowObj.category_5,
      ]
        .map((value) => normalizeText(value))
        .filter(Boolean);
      const categoryPath = buildCategoryPath(categories);
      const category = categories[0] || "Uncategorized";
      touchedCategoryNames.add(category);

      const searchTags = parseSearchTags(rowObj.search_tags);
      const searchIndex = buildSearchIndex(name, sku, searchTags);

      const mrp = Math.max(0, toSafeNumber(rowObj.mrp, 0));
      const sellingPrice = Math.max(0, toSafeNumber(rowObj.selling_price, 0));
      const stock = Math.max(0, Math.floor(toSafeNumber(rowObj.stock, 0)));

      const images = [
        rowObj.image_1,
        rowObj.image_2,
        rowObj.image_3,
        rowObj.image_4,
        rowObj.image_5,
        rowObj.image_6,
      ]
        .map((value) => String(value || "").trim())
        .filter(Boolean);

      const specs = {
        heightFt: rowObj.height_ft,
        widthFt: rowObj.width_ft,
        totalHoles: rowObj.total_holes,
        holeSize: rowObj.hole_size,
        materialType: rowObj.material_type,
        sheetThickness: rowObj.sheet_thickness,
        ledCompatible: rowObj.led_compatible,
        inputVoltage: rowObj.input_voltage,
        outputVoltage: rowObj.output_voltage,
        powerWatt: rowObj.power_watt,
        connectivity: rowObj.connectivity,
        icNumber: rowObj.ic_number,
        ledPerMeter: rowObj.led_per_meter,
        controllerType: rowObj.controller_type,
        warranty: rowObj.warranty,
      };

      const variation = {
        colorRedAdd: toOptionalNumber(rowObj.color_red_add),
        colorGreenAdd: toOptionalNumber(rowObj.color_green_add),
        colorBlueAdd: toOptionalNumber(rowObj.color_blue_add),
        hole9mmAdd: toOptionalNumber(rowObj.hole_9mm_add),
        hole12mmAdd: toOptionalNumber(rowObj.hole_12mm_add),
        materialTezTechAdd: toOptionalNumber(rowObj.material_teztech_add),
        materialSunriseAdd: toOptionalNumber(rowObj.material_sunrise_add),
        power12WAdd: toOptionalNumber(rowObj.power_12w_add),
        power24WAdd: toOptionalNumber(rowObj.power_24w_add),
        remoteAdd: toOptionalNumber(rowObj.remote_add),
        waterproofAdd: toOptionalNumber(rowObj.waterproof_add),
      };

      const customFields = buildCatalogCustomFields(variation);
      const details = buildCatalogDetails(specs);

      preparedProducts.push({
        user: req.user._id,
        productId: normalizeText(rowObj.product_id),
        sku,
        name,
        description: name,
        brand: "",
        category,
        categoryPath,
        categories,
        mrp,
        sellingPrice,
        price: sellingPrice,
        stock,
        status: normalizeStatus(rowObj.status),
        searchTags,
        searchIndex,
        images,
        image: images[0] || DEFAULT_PRODUCT_IMAGE,
        heightFt: normalizeText(specs.heightFt),
        widthFt: normalizeText(specs.widthFt),
        totalHoles: normalizeText(specs.totalHoles),
        holeSize: normalizeText(specs.holeSize),
        materialType: normalizeText(specs.materialType),
        sheetThickness: normalizeText(specs.sheetThickness),
        ledCompatible: normalizeText(specs.ledCompatible),
        inputVoltage: normalizeText(specs.inputVoltage),
        outputVoltage: normalizeText(specs.outputVoltage),
        powerWatt: normalizeText(specs.powerWatt),
        connectivity: normalizeText(specs.connectivity),
        icNumber: normalizeText(specs.icNumber),
        ledPerMeter: normalizeText(specs.ledPerMeter),
        controllerType: normalizeText(specs.controllerType),
        warranty: normalizeText(specs.warranty),
        colorRedAdd: variation.colorRedAdd,
        colorGreenAdd: variation.colorGreenAdd,
        colorBlueAdd: variation.colorBlueAdd,
        hole9mmAdd: variation.hole9mmAdd,
        hole12mmAdd: variation.hole12mmAdd,
        materialTezTechAdd: variation.materialTezTechAdd,
        materialSunriseAdd: variation.materialSunriseAdd,
        power12WAdd: variation.power12WAdd,
        power24WAdd: variation.power24WAdd,
        remoteAdd: variation.remoteAdd,
        waterproofAdd: variation.waterproofAdd,
        customFields,
        details,
        gstRate: 0,
        shippingCharge: 0,
      });
    }

    await ensureCategoriesExist(Array.from(touchedCategoryNames), req.user._id);

    let insertedCount = 0;
    let updatedCount = 0;
    let insertedProductIds = [];

    if (preparedProducts.length > 0) {
      const now = new Date();
      const bulkOps = preparedProducts.map((product) => {
        const { user, ...payload } = product;
        return {
          updateOne: {
            filter: { sku: product.sku },
            update: {
              $set: { ...payload, updatedAt: now },
              $setOnInsert: { user, createdAt: now },
            },
            upsert: true,
          },
        };
      });

      const bulkResult = await Product.bulkWrite(bulkOps, { ordered: false });
      insertedCount = bulkResult?.upsertedCount || 0;
      updatedCount = bulkResult?.modifiedCount || 0;

      const rawUpserted = bulkResult?.upsertedIds || [];
      if (Array.isArray(rawUpserted)) {
        insertedProductIds = rawUpserted.map((item) => item?._id).filter(Boolean);
      } else {
        insertedProductIds = Object.values(rawUpserted).map((item) => item?._id).filter(Boolean);
      }
    }

    const summaryParts = [
      `Processed ${preparedProducts.length} products`,
      insertedCount ? `${insertedCount} new` : null,
      updatedCount ? `${updatedCount} updated` : null,
      rowErrors.length ? `${rowErrors.length} row errors` : null,
      skippedRows ? `${skippedRows} rows skipped` : null,
    ].filter(Boolean);
    const message = summaryParts.join(", ");

    const importJob = await ProductImportJob.create({
      createdBy: req.user._id,
      fileName: req.file.originalname || "catalog-import.csv",
      totalRows: rows.length - 1,
      importedCount: insertedCount,
      failedCount: rowErrors.length,
      createdProductIds: insertedProductIds,
      touchedCategoryNames: Array.from(touchedCategoryNames),
      errors: rowErrors.slice(0, 200),
    });

    return res.status(200).json({
      success: true,
      message,
      importJobId: importJob._id,
      importedCount: insertedCount,
      updatedCount,
      failedCount: rowErrors.length,
      errors: rowErrors.slice(0, 50),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "CSV import failed" });
  } finally {
    await cleanupUploadedCsv(req.file);
  }
};

// @desc    List product CSV import jobs (Admin Only)
export const getProductImportHistory = async (req, res) => {
  try {
    const status = String(req.query.status || "all").trim().toLowerCase();
    const search = String(req.query.search || "").trim();
    const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 200);

    const query = {};
    if (status === "active" || status === "rolled_back") {
      query.status = status;
    }
    if (search) {
      query.fileName = { $regex: search, $options: "i" };
    }

    const jobs = await ProductImportJob.find(query)
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .limit(limit);

    const trackedProductIds = await ProductImportJob.distinct("createdProductIds");
    const untrackedCount = await Product.countDocuments({
      _id: { $nin: trackedProductIds },
    });

    if (untrackedCount > 0) {
      const matchesStatus = status === "all" || status === "active";
      const matchesSearch = !search || "legacy/untracked-products".includes(search.toLowerCase());
      if (matchesStatus && matchesSearch) {
        jobs.unshift({
          _id: LEGACY_IMPORT_JOB_ID,
          fileName: "Legacy/Untracked Products",
          totalRows: untrackedCount,
          importedCount: untrackedCount,
          failedCount: 0,
          status: "active",
          createdAt: new Date(0),
          createdBy: null,
          errors: [],
        });
      }
    }

    res.status(200).json({ success: true, jobs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch import history" });
  }
};

// @desc    CSV import management overview stats (Admin Only)
export const getProductImportOverview = async (req, res) => {
  try {
    const [totalJobs, activeJobs, rolledBackJobs, aggregate, trackedProductIds] = await Promise.all([
      ProductImportJob.countDocuments({}),
      ProductImportJob.countDocuments({ status: "active" }),
      ProductImportJob.countDocuments({ status: "rolled_back" }),
      ProductImportJob.aggregate([
        {
          $group: {
            _id: null,
            totalRows: { $sum: "$totalRows" },
            totalImported: { $sum: "$importedCount" },
            totalFailed: { $sum: "$failedCount" },
          },
        },
      ]),
      ProductImportJob.distinct("createdProductIds"),
    ]);

    const stats = aggregate[0] || { totalRows: 0, totalImported: 0, totalFailed: 0 };
    const untrackedProducts = await Product.countDocuments({ _id: { $nin: trackedProductIds } });

    res.status(200).json({
      success: true,
      overview: {
        totalJobs,
        activeJobs,
        rolledBackJobs,
        totalRows: stats.totalRows || 0,
        totalImported: stats.totalImported || 0,
        totalFailed: stats.totalFailed || 0,
        untrackedProducts,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch import overview" });
  }
};

// @desc    Rollback a CSV import job (Admin Only)
export const rollbackProductImport = async (req, res) => {
  try {
    const { jobId } = req.params;

    if (jobId === LEGACY_IMPORT_JOB_ID) {
      const trackedProductIds = await ProductImportJob.distinct("createdProductIds");
      const deleteResult = await Product.deleteMany({ _id: { $nin: trackedProductIds } });
      const removedCategories = await cleanupAllUnusedCategories();
      return res.status(200).json({
        success: true,
        message: "Legacy/untracked products deleted successfully",
        deletedCount: deleteResult.deletedCount || 0,
        removedCategories,
      });
    }

    const job = await ProductImportJob.findById(jobId);

    if (!job) {
      return res.status(404).json({ success: false, message: "Import job not found" });
    }

    if (job.status === "rolled_back") {
      return res.status(400).json({ success: false, message: "This import has already been rolled back" });
    }

    if (!job.createdProductIds || job.createdProductIds.length === 0) {
      job.status = "rolled_back";
      job.rolledBackAt = new Date();
      await job.save();
      const removedCategories =
        Array.isArray(job.touchedCategoryNames) && job.touchedCategoryNames.length > 0
          ? await cleanupUnusedCategoriesByNames(job.touchedCategoryNames)
          : await cleanupAllUnusedCategories();
      return res.status(200).json({
        success: true,
        message: "Import marked as rolled back (no products were created in this job)",
        deletedCount: 0,
        removedCategories,
      });
    }

    const deleteResult = await Product.deleteMany({ _id: { $in: job.createdProductIds } });
    job.status = "rolled_back";
    job.rolledBackAt = new Date();
    await job.save();
    const removedCategories =
      Array.isArray(job.touchedCategoryNames) && job.touchedCategoryNames.length > 0
        ? await cleanupUnusedCategoriesByNames(job.touchedCategoryNames)
        : await cleanupAllUnusedCategories();

    return res.status(200).json({
      success: true,
      message: "Imported products deleted successfully",
      deletedCount: deleteResult.deletedCount || 0,
      removedCategories,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Rollback failed" });
  }
};

// @desc    Delete import history record (Admin Only)
export const deleteProductImportRecord = async (req, res) => {
  try {
    const { jobId } = req.params;

    if (jobId === LEGACY_IMPORT_JOB_ID) {
      return res.status(400).json({
        success: false,
        message: "Legacy/untracked entry cannot be removed as a record",
      });
    }

    const job = await ProductImportJob.findById(jobId);

    if (!job) {
      return res.status(404).json({ success: false, message: "Import job not found" });
    }

    if (job.status !== "rolled_back" && job.importedCount > 0) {
      return res.status(400).json({
        success: false,
        message: "Rollback this import before deleting history record",
      });
    }

    if (Array.isArray(job.touchedCategoryNames) && job.touchedCategoryNames.length > 0) {
      await cleanupUnusedCategoriesByNames(job.touchedCategoryNames);
    } else {
      await cleanupAllUnusedCategories();
    }
    await ProductImportJob.deleteOne({ _id: jobId });
    return res.status(200).json({ success: true, message: "Import history record removed" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Failed to remove import record" });
  }
};
