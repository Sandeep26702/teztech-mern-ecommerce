import fs from "fs";

const normalizeCsvKey = (k="") => k.trim().toLowerCase().replace(/\s+/g, "_");
const normalizeText = (v="") => String(v||"").trim();

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

const csvPath = "c:/Users/sande/OneDrive/Desktop/test_product.csv";
const rows = parseCsvContent(fs.readFileSync(csvPath, "utf8").replace(/^\uFEFF/, "").trim());
const headers = rows[0].map(normalizeCsvKey);
const counts = [];
for (let i=0; i<headers.length; i++) {
  const h = headers[i];
  if (!(h.startsWith("product_variation_option_") || h === "product_option_name" || h === "product_option_value" || h.startsWith("product_option_"))) continue;
  let c=0;
  for (let r=1; r<rows.length; r++) {
    if (normalizeText(rows[r][i]) !== "") c++;
  }
  counts.push({ h, c });
}
counts.sort((a,b)=>b.c-a.c);
console.log("Option-like columns with non-empty count:");
for (const item of counts.filter(x=>x.c>0).slice(0,40)) console.log(item.c, item.h);
console.log("Total non-empty option-like columns:", counts.filter(x=>x.c>0).length);
