import fs from "fs";
import path from "path";
import process from "process";
import dotenv from "dotenv";
import mongoose from "mongoose";
import Product from "../src/models/Product.js";
import Category from "../src/models/Category.js";

const DEFAULT_ENV_PATH = path.resolve(process.cwd(), ".env");
dotenv.config({ path: DEFAULT_ENV_PATH });

const normalizeCsvKey = (key = "") => key.trim().toLowerCase().replace(/\s+/g, "_");
const normalizeText = (value = "") => String(value || "").trim().replace(/\s+/g, " ");
const stripHtml = (value = "") => normalizeText(String(value || "").replace(/<[^>]*>/g, " "));
const escapeRegex = (text = "") => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const toSlug = (value = "") =>
  normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

const parseArgs = () => {
  const args = process.argv.slice(2);
  const parsed = {
    file: "",
    dryRun: false,
    force: false,
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--dry-run") {
      parsed.dryRun = true;
    } else if (arg === "--force") {
      parsed.force = true;
    } else if (arg === "--file") {
      parsed.file = args[i + 1] || "";
      i += 1;
    }
  }

  return parsed;
};

const parseCsvContent = (csvText = "") => {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i += 1) {
    const char = csvText[i];
    const next = csvText[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
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
      if (char === "\r" && next === "\n") i += 1;
      row.push(cell);
      if (row.some((item) => normalizeText(item) !== "")) {
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
    if (row.some((item) => normalizeText(item) !== "")) {
      rows.push(row.map((item) => String(item || "").trim()));
    }
  }

  return rows;
};

const getFirstNonEmptyValue = (rowObj, keys = []) => {
  for (const key of keys) {
    const value = rowObj[key];
    if (value !== undefined && value !== null && normalizeText(value) !== "") {
      return String(value).trim();
    }
  }
  return "";
};

const getFirstNonEmptyFromRows = (rows = [], keys = []) => {
  for (const row of rows) {
    const value = getFirstNonEmptyValue(row, keys);
    if (value) return value;
  }
  return "";
};

const cleanLabel = (raw = "", prefix = "") =>
  normalizeText(
    String(raw || "")
      .replace(prefix, "")
      .replace(/[{}]/g, "")
      .replace(/_/g, " ")
  ).toUpperCase();

const splitOptionValues = (rawValue = "") =>
  String(rawValue || "")
    .split(/[|\n;]+/)
    .map((value) => normalizeText(value))
    .filter(Boolean);

const buildDetailsFromRows = (rows = []) => {
  const headers = Object.keys(rows[0] || {});
  return headers
    .filter((header) => header.startsWith("product_attribute_"))
    .map((header) => ({
      key: cleanLabel(header, "product_attribute_"),
      value: normalizeText(getFirstNonEmptyFromRows(rows, [header])),
    }))
    .filter((item) => item.key && item.value);
};

const buildCustomFieldsFromRows = (rows = []) => {
  const headers = Object.keys(rows[0] || {});
  const variationFields = headers
    .filter((header) => header.startsWith("product_variation_option_"))
    .map((header) => {
      const optionsMap = new Map();
      rows.forEach((row) => {
        splitOptionValues(row[header]).forEach((option) => {
          const key = option.toLowerCase();
          if (!optionsMap.has(key)) optionsMap.set(key, option);
        });
      });

      const options = Array.from(optionsMap.values()).map((label) => ({
        label,
        priceAdjustment: 0,
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
      splitOptionValues(row[optionValueKey]).forEach((value) => {
        const optionKey = value.toLowerCase();
        if (!grouped.get(mapKey).options.has(optionKey)) {
          grouped.get(mapKey).options.set(optionKey, value);
        }
      });
    });

    grouped.forEach((item) => {
      const options = Array.from(item.options.values()).map((label) => ({
        label,
        priceAdjustment: 0,
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

const toSafeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const ensureCategoriesExist = async (categoryNames = [], fallbackUserId) => {
  if (!fallbackUserId) return 0;
  const names = Array.from(new Set(categoryNames.map((item) => normalizeText(item)).filter(Boolean)));
  let created = 0;

  for (const name of names) {
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
      createdBy: fallbackUserId,
    });
    created += 1;
  }

  return created;
};

const main = async () => {
  const { file, dryRun, force } = parseArgs();

  if (!file) {
    console.error("Usage: node scripts/migrateImportedProductsFromCsv.js --file <path> [--dry-run] [--force]");
    process.exit(1);
  }

  const resolvedFilePath = path.isAbsolute(file) ? file : path.resolve(process.cwd(), file);
  if (!fs.existsSync(resolvedFilePath)) {
    console.error(`CSV file not found: ${resolvedFilePath}`);
    process.exit(1);
  }

  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI not found. Set it in backend/.env");
    process.exit(1);
  }

  const csvText = fs.readFileSync(resolvedFilePath, "utf8").replace(/^\uFEFF/, "").trim();
  const rows = parseCsvContent(csvText);
  if (rows.length < 2) {
    console.error("CSV must include header and at least one row");
    process.exit(1);
  }

  const headers = rows[0].map(normalizeCsvKey);
  const fieldAliases = {
    type: ["type"],
    name: ["name", "product_name", "title"],
    description: ["description", "product_description", "body_html"],
    brand: ["brand", "product_brand", "vendor"],
    category: ["category", "product_category_1", "category_path"],
    sku: ["sku", "product_sku"],
    internalId: ["product_internal_id", "internal_id"],
    gstRate: ["gst_rate", "tax_rate", "product_gst_rate"],
  };

  const groupedRows = new Map();
  let skippedRows = 0;

  for (let i = 1; i < rows.length; i += 1) {
    const cells = rows[i];
    const rowObj = {};

    headers.forEach((header, index) => {
      rowObj[header] = (cells[index] || "").trim();
    });

    const hasValue = Object.values(rowObj).some((item) => normalizeText(item) !== "");
    if (!hasValue) {
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
    const groupKey = sku || internalId || rawName || `row-${i + 1}`;

    const grouped = groupedRows.get(groupKey) || [];
    grouped.push(rowObj);
    groupedRows.set(groupKey, grouped);
  }

  const productsFromCsv = [];
  for (const [, sameProductRows] of groupedRows.entries()) {
    const sku = normalizeText(getFirstNonEmptyFromRows(sameProductRows, fieldAliases.sku));
    const internalId = normalizeText(getFirstNonEmptyFromRows(sameProductRows, fieldAliases.internalId));
    const name = normalizeText(getFirstNonEmptyFromRows(sameProductRows, fieldAliases.name));
    if (!name && !sku && !internalId) continue;

    const category = normalizeText(getFirstNonEmptyFromRows(sameProductRows, fieldAliases.category));
    const gstRate = toSafeNumber(getFirstNonEmptyFromRows(sameProductRows, fieldAliases.gstRate), 18);

    productsFromCsv.push({
      name,
      sku: sku || internalId,
      category,
      gstRate: Math.max(0, Math.min(gstRate, 100)),
      details: buildDetailsFromRows(sameProductRows),
      customFields: buildCustomFieldsFromRows(sameProductRows),
      description: stripHtml(getFirstNonEmptyFromRows(sameProductRows, fieldAliases.description)),
      brand: normalizeText(getFirstNonEmptyFromRows(sameProductRows, fieldAliases.brand)),
    });
  }

  await mongoose.connect(process.env.MONGO_URI);

  const stats = {
    csvProducts: productsFromCsv.length,
    matchedGroups: 0,
    unmatchedGroups: 0,
    updatedDocs: 0,
    createdCategories: 0,
    skippedRows,
  };

  const touchedCategories = new Set();
  let fallbackUserId = null;

  for (const csvProduct of productsFromCsv) {
    const orQuery = [];
    if (csvProduct.sku) {
      orQuery.push({ sku: { $regex: `^${escapeRegex(csvProduct.sku)}$`, $options: "i" } });
    }
    if (csvProduct.name) {
      orQuery.push({ name: { $regex: `^${escapeRegex(csvProduct.name)}$`, $options: "i" } });
    }

    if (orQuery.length === 0) {
      stats.unmatchedGroups += 1;
      continue;
    }

    const docs = await Product.find({ $or: orQuery }).select(
      "_id user name sku category gstRate brand description customFields details"
    );

    if (!docs.length) {
      stats.unmatchedGroups += 1;
      continue;
    }

    stats.matchedGroups += 1;
    for (const doc of docs) {
      if (!fallbackUserId && doc.user) fallbackUserId = doc.user;

      const updates = {};
      if (csvProduct.sku && (!doc.sku || force)) updates.sku = csvProduct.sku;
      if (csvProduct.category && (!doc.category || doc.category === "Uncategorized" || force)) {
        updates.category = csvProduct.category;
      }
      if (csvProduct.brand && (!doc.brand || doc.brand === "Generic" || force)) {
        updates.brand = csvProduct.brand;
      }
      if (csvProduct.description && (!doc.description || doc.description === "No description provided" || force)) {
        updates.description = csvProduct.description;
      }
      if (
        csvProduct.details.length > 0 &&
        (!Array.isArray(doc.details) || doc.details.length === 0 || force)
      ) {
        updates.details = csvProduct.details;
      }
      if (
        csvProduct.customFields.length > 0 &&
        (!Array.isArray(doc.customFields) || doc.customFields.length === 0 || force)
      ) {
        updates.customFields = csvProduct.customFields;
      }
      if (Number.isFinite(csvProduct.gstRate) && (toSafeNumber(doc.gstRate, 0) === 0 || force)) {
        updates.gstRate = csvProduct.gstRate;
      }

      if (Object.keys(updates).length > 0) {
        if (!dryRun) {
          await Product.updateOne({ _id: doc._id }, { $set: updates });
        }
        if (updates.category) touchedCategories.add(updates.category);
        stats.updatedDocs += 1;
      }
    }
  }

  if (!dryRun && touchedCategories.size > 0) {
    stats.createdCategories = await ensureCategoriesExist(Array.from(touchedCategories), fallbackUserId);
  }

  await mongoose.disconnect();

  console.log("Migration summary:");
  console.log(`- CSV grouped products: ${stats.csvProducts}`);
  console.log(`- Matched groups: ${stats.matchedGroups}`);
  console.log(`- Unmatched groups: ${stats.unmatchedGroups}`);
  console.log(`- Updated product documents: ${stats.updatedDocs}`);
  console.log(`- Categories created: ${stats.createdCategories}`);
  console.log(`- Skipped rows: ${stats.skippedRows}`);
  console.log(`- Dry run: ${dryRun ? "yes" : "no"}`);
  console.log(`- Force mode: ${force ? "yes" : "no"}`);
};

main().catch(async (error) => {
  console.error("Migration failed:", error.message);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});
