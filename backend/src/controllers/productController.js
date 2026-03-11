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
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
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

// @desc    Fetch all products from DB (With Search & Pagination)
export const getProducts = async (req, res) => {
  try {
    const keyword = String(req.query.keyword || "").trim();
    const category = String(req.query.category || "").trim();
    const minPriceRaw = req.query.minPrice;
    const maxPriceRaw = req.query.maxPrice;

    const filters = {};
    if (keyword) {
      filters.name = { $regex: keyword, $options: "i" };
    }
    if (category) {
      filters.category = { $regex: `^${escapeRegex(category)}$`, $options: "i" };
    }

    const minPrice = Number(minPriceRaw);
    const maxPrice = Number(maxPriceRaw);
    if (Number.isFinite(minPrice) || Number.isFinite(maxPrice)) {
      filters.price = {};
      if (Number.isFinite(minPrice)) filters.price.$gte = minPrice;
      if (Number.isFinite(maxPrice)) filters.price.$lte = maxPrice;
    }

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

    // Frontend yahi format expect kar raha hai
    res.status(200).json({ 
      success: true, 
      products,
      page,
      totalPages: Math.ceil(count / limit) || 1, 
      totalProducts: count 
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

    if (!name || !description || !price || !brand) {
      return res.status(400).json({ 
        success: false, 
        message: "Please provide all required fields (Name, Price, Brand, Description)" 
      });
    }

    const product = await Product.create({
      name,
      description,
      price: Number(price),
      category,
      stock: Number(stock) || 0, 
      gstRate: Math.max(0, Math.min(100, toSafeNumber(gstRate, 0))),
      shippingCharge: Math.max(0, toSafeNumber(shippingCharge, 0)),
      brand,
      sku: normalizeText(sku),
      image,
      user: req.user._id,
      customFields,
      details,
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
    const updatedData = {
      name: name || product.name,
      description: description || product.description,
      price: price ? Number(price) : product.price,
      category: category || product.category,
      brand: brand || product.brand,
      sku: sku !== undefined ? normalizeText(sku) : product.sku || "",
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
      .select("name description price shippingCharge category brand stock image createdAt updatedAt gstRate sku customFields details");

    const detailKeys = new Map();
    const variationKeys = new Map();

    products.forEach((product) => {
      (product.details || []).forEach((item) => {
        const key = normalizeCsvKey(item?.key || "");
        if (!key) return;
        detailKeys.set(key, `product_attribute_${key}`);
      });
      (product.customFields || []).forEach((field) => {
        const key = normalizeCsvKey(field?.label || "");
        if (!key) return;
        variationKeys.set(key, `product_variation_option_${key}`);
      });
    });

    const detailHeaders = Array.from(detailKeys.values()).sort();
    const variationHeaders = Array.from(variationKeys.values()).sort();

    const header = [
      "name",
      "description",
      "brand",
      "category",
      "price",
      "gst_rate",
      "shippingCharge",
      "stock",
      "image",
      "sku",
      "custom_fields",
      "details",
      "createdAt",
      "updatedAt",
      ...detailHeaders,
      ...variationHeaders,
    ];

    const rows = products.map((product) =>
      (() => {
        const detailMap = new Map();
        (product.details || []).forEach((item) => {
          const key = normalizeCsvKey(item?.key || "");
          if (!key) return;
          detailMap.set(`product_attribute_${key}`, item?.value || "");
        });

        const variationMap = new Map();
        (product.customFields || []).forEach((field) => {
          const key = normalizeCsvKey(field?.label || "");
          if (!key) return;
          const headerKey = `product_variation_option_${key}`;
          const options = Array.isArray(field.options)
            ? field.options
                .map((opt) => {
                  const label = String(opt?.label || "").trim();
                  if (!label) return null;
                  const adj = Number(opt?.priceAdjustment || 0);
                  return adj ? `${label}|${adj}` : label;
                })
                .filter(Boolean)
            : [];
          variationMap.set(headerKey, options.join(";"));
        });

        const base = [
          product.name,
          product.description,
          product.brand,
          product.category,
          product.price,
          product.gstRate || 0,
          product.shippingCharge || 0,
          product.stock,
          product.image,
          product.sku || "",
          JSON.stringify(product.customFields || []),
          JSON.stringify(product.details || []),
          product.createdAt?.toISOString?.() || "",
          product.updatedAt?.toISOString?.() || "",
        ];

        const detailValues = detailHeaders.map((key) => detailMap.get(key) || "");
        const variationValues = variationHeaders.map((key) => variationMap.get(key) || "");

        return [...base, ...detailValues, ...variationValues].map(csvEscape).join(",");
      })()
    );

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
    const fieldAliases = {
      type: ["type"],
      name: ["name", "product_name", "title"],
      description: ["description", "product_description", "body_html"],
      brand: ["brand", "product_brand", "vendor"],
      category: ["category", "product_category_1", "category_path"],
      price: ["price", "product_price", "sale_price"],
      shippingCharge: ["shipping_charge", "shippingcharge", "delivery_charge", "deliverycharge"],
      stock: ["stock", "product_quantity", "quantity", "inventory"],
      isAvailable: ["product_is_available", "is_available"],
      gstRate: ["gst_rate", "tax_rate", "product_gst_rate"],
      image: ["image", "image_url", "imageurl", "product_media_main_image_url"],
      sku: ["sku", "product_sku"],
      internalId: ["product_internal_id", "internal_id"],
      customFields: ["custom_fields", "customfields", "custom_fields_json", "customfields_json"],
      details: ["details", "product_details", "product_attributes", "attributes", "specs"],
    };

    const hasAnyNameColumn = fieldAliases.name.some((h) => headers.includes(h));
    if (!hasAnyNameColumn) {
      return res.status(400).json({
        success: false,
        message: "CSV must include product name column (name or product_name)",
      });
    }

    const groupedRows = new Map();
    const rowErrors = [];
    let skippedRows = 0;

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

      const sku = normalizeText(getFirstNonEmptyValue(rowObj, fieldAliases.sku));
      const internalId = normalizeText(getFirstNonEmptyValue(rowObj, fieldAliases.internalId));
      const rawName = normalizeText(getFirstNonEmptyValue(rowObj, fieldAliases.name));
      const rowType = getFirstNonEmptyValue(rowObj, fieldAliases.type).toLowerCase();
      const isLikelyProductLinkedRow =
        sku !== "" ||
        internalId !== "" ||
        rawName !== "" ||
        ["product", "option", "variation", "product_option"].includes(rowType);
      if (!isLikelyProductLinkedRow) {
        skippedRows += 1;
        continue;
      }
      const groupKey = sku || internalId || rawName || `row-${rowNumber}`;

      const grouped = groupedRows.get(groupKey) || [];
      grouped.push(rowObj);
      groupedRows.set(groupKey, grouped);
    }

    const preparedProducts = [];
    const touchedCategoryNames = new Set();
    for (const [groupKey, sameProductRows] of groupedRows.entries()) {
      const sku = normalizeText(getFirstNonEmptyFromRows(sameProductRows, fieldAliases.sku));
      const internalId = normalizeText(getFirstNonEmptyFromRows(sameProductRows, fieldAliases.internalId));
      const rawName = normalizeText(getFirstNonEmptyFromRows(sameProductRows, fieldAliases.name));
      const rawDescription = getFirstNonEmptyFromRows(sameProductRows, fieldAliases.description);
      const rawBrand = normalizeText(getFirstNonEmptyFromRows(sameProductRows, fieldAliases.brand));
      const rawCategory = normalizeText(getFirstNonEmptyFromRows(sameProductRows, fieldAliases.category));
      const rawPrice = getFirstNonEmptyFromRows(sameProductRows, fieldAliases.price);
      const rawShippingCharge = getFirstNonEmptyFromRows(sameProductRows, fieldAliases.shippingCharge);
      const rawStock = getFirstNonEmptyFromRows(sameProductRows, fieldAliases.stock);
      const rawGstRate = getFirstNonEmptyFromRows(sameProductRows, fieldAliases.gstRate);
      const rawIsAvailable = getFirstNonEmptyFromRows(sameProductRows, fieldAliases.isAvailable).toLowerCase();
      const rawImage = getFirstNonEmptyFromRows(sameProductRows, fieldAliases.image);
      const rawCustomFields = getFirstNonEmptyFromRows(sameProductRows, fieldAliases.customFields);
      const rawDetails = getFirstNonEmptyFromRows(sameProductRows, fieldAliases.details);

      const name = rawName || (sku ? `Product ${sku}` : `Imported Product ${groupKey}`);
      const description = stripHtml(rawDescription) || "No description provided";
      const brand = rawBrand || "Generic";
      const category = rawCategory || "Uncategorized";
      touchedCategoryNames.add(category);

      const parsedPrice = Number(rawPrice);
      const price = Number.isFinite(parsedPrice) && parsedPrice >= 0 ? parsedPrice : 0;

      const parsedShipping = Number(rawShippingCharge);
      const shippingCharge = Number.isFinite(parsedShipping) && parsedShipping >= 0 ? parsedShipping : 0;

      const parsedStock = Number(rawStock);
      const availabilityHint = ["1", "true", "yes"].includes(rawIsAvailable);
      const stock =
        Number.isFinite(parsedStock) && parsedStock >= 0
          ? Math.max(availabilityHint && parsedStock === 0 ? 1 : Math.floor(parsedStock), 0)
          : availabilityHint
          ? 1
          : 0;

      const parsedGstRate = Number(rawGstRate);
      const gstRate =
        Number.isFinite(parsedGstRate) && parsedGstRate >= 0
          ? Math.min(parsedGstRate, 100)
          : 18;

      const image = rawImage || DEFAULT_PRODUCT_IMAGE;
      const parsedCustomFields = parseCustomFields(rawCustomFields);
      const parsedDetails = parseDetails(rawDetails);
      const customFieldsFromRows = buildCustomFieldsFromRows(sameProductRows);
      const detailsFromRows = buildDetailsFromRows(sameProductRows);

      const customFields =
        Array.isArray(parsedCustomFields) && parsedCustomFields.length > 0
          ? (() => {
              const merged = new Map();
              parsedCustomFields.forEach((field) => {
                const key = normalizeText(field.label).toLowerCase();
                if (!key) return;
                merged.set(key, { ...field, options: [...(field.options || [])] });
              });
              customFieldsFromRows.forEach((field) => {
                const key = normalizeText(field.label).toLowerCase();
                if (!key) return;
                if (!merged.has(key)) {
                  merged.set(key, { ...field, options: [...(field.options || [])] });
                  return;
                }
                const existing = merged.get(key);
                const optionMap = new Map(
                  (existing.options || []).map((opt) => [normalizeText(opt.label).toLowerCase(), opt])
                );
                (field.options || []).forEach((opt) => {
                  const optKey = normalizeText(opt.label).toLowerCase();
                  if (!optionMap.has(optKey)) optionMap.set(optKey, opt);
                });
                existing.options = Array.from(optionMap.values());
              });
              return Array.from(merged.values()).filter((field) => (field.options || []).length > 0);
            })()
          : customFieldsFromRows;

      const details =
        Array.isArray(parsedDetails) && parsedDetails.length > 0
          ? (() => {
              const merged = new Map();
              parsedDetails.forEach((item) => {
                const key = normalizeText(item.key).toLowerCase();
                if (!key) return;
                merged.set(key, { key: item.key, value: item.value });
              });
              detailsFromRows.forEach((item) => {
                const key = normalizeText(item.key).toLowerCase();
                if (!key || merged.has(key)) return;
                merged.set(key, { key: item.key, value: item.value });
              });
              return Array.from(merged.values());
            })()
          : detailsFromRows;

      preparedProducts.push({
        user: req.user._id,
        name,
        sku: sku || internalId,
        description,
        brand,
        category,
        price,
        gstRate,
        shippingCharge,
        stock,
        image,
        customFields,
        details,
      });
    }

    await ensureCategoriesExist(Array.from(touchedCategoryNames), req.user._id);

    let insertedCount = 0;
    let insertedProductIds = [];
    if (preparedProducts.length > 0) {
      const inserted = await Product.insertMany(preparedProducts, { ordered: false });
      insertedCount = inserted.length;
      insertedProductIds = inserted.map((item) => item._id);
    }

    const summaryParts = [
      `Imported ${insertedCount} products`,
      rowErrors.length ? `${rowErrors.length} row errors` : null,
      skippedRows ? `${skippedRows} rows skipped` : null,
    ].filter(Boolean);
    const message = summaryParts.join(", ");

    const importJob = await ProductImportJob.create({
      createdBy: req.user._id,
      fileName: req.file.originalname || "products-import.csv",
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
      failedCount: rowErrors.length,
      errors: rowErrors.slice(0, 50),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "CSV import failed" });
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
