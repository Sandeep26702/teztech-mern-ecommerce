// ==========================
// 🔥 CSV AUTO MAPPING ENGINE
// ==========================

// normalize string (remove spaces, case insensitive)
export const normalize = (str = "") => {
  return str.toLowerCase().replace(/[\s_\-]/g, "").trim();
};

// 🔥 synonym dictionary (expand anytime)
const synonyms = {
  sku: ["sku", "code", "itemcode", "productcode", "id"],
  name: ["name", "productname", "title", "itemname"],
  price: ["price", "mrp", "amount", "sellingprice"],
  stock: ["stock", "qty", "quantity", "inventory"],
  color: ["color", "colour"],
  size: ["size", "dimension"],
  category: ["category", "cat", "group"],
};

// 🔥 simple similarity score (AI-like)
const similarityScore = (a, b) => {
  const A = new Set(a);
  const B = new Set(b);

  const intersection = [...A].filter((x) => B.has(x)).length;
  return intersection / Math.max(A.size, B.size, 1);
};

// ==========================
// 🔥 AUTO MAP FUNCTION
// ==========================
export const autoMapHeaders = (headers = []) => {
  const mapping = {};

  headers.forEach((header) => {
    const normHeader = normalize(header);

    let bestMatch = {
      field: "",
      score: 0,
    };

    // compare with all synonyms
    for (const key in synonyms) {
      for (const word of synonyms[key]) {
        const score = similarityScore(normHeader, normalize(word));

        if (score > bestMatch.score) {
          bestMatch = { field: key, score };
        }
      }
    }

    // threshold (adjustable)
    if (bestMatch.score > 0.5) {
      mapping[header] = bestMatch.field;
    } else {
      mapping[header] = ""; // ignore
    }
  });

  return mapping;
};

// ==========================
// 🔥 APPLY MAPPING
// ==========================
export const applyMapping = (rowObj, mapping) => {
  const result = {};

  for (const csvKey in mapping) {
    const systemKey = mapping[csvKey];

    if (systemKey && rowObj[csvKey] !== undefined) {
      result[systemKey] = rowObj[csvKey];
    }
  }

  return result;
};