import fs from "fs";
import dotenv from "dotenv";
import mongoose from "mongoose";
import Product from "../src/models/Product.js";

dotenv.config({ path: ".env" });

const csvPath = "c:/Users/sande/OneDrive/Desktop/test_product.csv";

const normalizeCsvKey = (k="") => k.trim().toLowerCase().replace(/\s+/g, "_");
const normalizeText = (v="") => String(v||"").trim().replace(/\s+/g, " ");
const splitOptionValues = (raw="") => String(raw||"").split(/[|\n;]+/).map(s=>normalizeText(s)).filter(Boolean);

const parseCsvContent = (csvText="") => {
  const rows=[]; let row=[]; let cell=""; let inQuotes=false;
  for (let i=0;i<csvText.length;i++) {
    const c=csvText[i], n=csvText[i+1];
    if (c==='"') { if (inQuotes && n==='"') { cell+='"'; i++; } else inQuotes=!inQuotes; continue; }
    if (c===',' && !inQuotes) { row.push(cell); cell=''; continue; }
    if ((c==='\n'||c==='\r') && !inQuotes) { if (c==='\r'&&n==='\n') i++; row.push(cell); if (row.some(x=>String(x||"").trim()!=="")) rows.push(row.map(x=>String(x||"").trim())); row=[]; cell=''; continue; }
    cell+=c;
  }
  if (cell.length>0||row.length>0){ row.push(cell); if(row.some(x=>String(x||"").trim()!=="")) rows.push(row.map(x=>String(x||"").trim())); }
  return rows;
};

const rows = parseCsvContent(fs.readFileSync(csvPath, "utf8").replace(/^\uFEFF/, "").trim());
const headers = rows[0].map(normalizeCsvKey);
const optionNameIdx = headers.indexOf("product_option_name");
const optionValueIdx = headers.indexOf("product_option_value");
const skuIdx = headers.indexOf("product_sku");
const nameIdx = headers.indexOf("product_name");

const csvWithOptions = new Map();
for (let i=1;i<rows.length;i++) {
  const r = rows[i];
  const sku = normalizeText(r[skuIdx]);
  const name = normalizeText(r[nameIdx]);
  const key = sku || name;
  if (!key) continue;

  let hasOpt = false;
  if (optionNameIdx >= 0 && optionValueIdx >= 0) {
    hasOpt = normalizeText(r[optionNameIdx]) !== "" && splitOptionValues(r[optionValueIdx]).length > 0;
  }
  for (let h=0; h<headers.length && !hasOpt; h++) {
    if (!headers[h].startsWith("product_variation_option_")) continue;
    if (splitOptionValues(r[h]).length > 0) hasOpt = true;
  }
  if (hasOpt) csvWithOptions.set(key, { sku, name });
}

await mongoose.connect(process.env.MONGO_URI);
const sample = Array.from(csvWithOptions.values()).slice(0, 30);
let matched=0, matchedWithFields=0;
for (const item of sample) {
  const or = [];
  if (item.sku) or.push({ sku: { $regex: `^${item.sku.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" } });
  if (item.name) or.push({ name: { $regex: `^${item.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" } });
  const doc = or.length ? await Product.findOne({ $or: or }).select("name sku customFields") : null;
  if (doc) {
    matched++;
    if ((doc.customFields || []).length > 0) matchedWithFields++;
    console.log(item.sku || item.name, "=>", doc.customFields?.length || 0);
  } else {
    console.log(item.sku || item.name, "=> NO_MATCH");
  }
}
console.log("sample options products:", sample.length, "matched:", matched, "withFields:", matchedWithFields);
await mongoose.disconnect();
