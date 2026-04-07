// ==========================
// 🔥 VARIANT PARSER
// ==========================

// Format 1: separate columns (recommended)
export const parseVariantFromRow = (row) => {
  const combination = {};

  if (row.color) combination.Color = row.color;
  if (row.size) combination.Size = row.size;
  if (row.design) combination.Design = row.design;

  return {
    combination,
    price: Number(row.price || 0),
    stock: Number(row.stock || 0),
    image: row.image || "",
  };
};

// ==========================
// 🔥 STRING FORMAT SUPPORT
// Color=Red|Size=4x4
// ==========================
export const parseVariantString = (str = "") => {
  const combination = {};

  str.split("|").forEach((pair) => {
    const [key, value] = pair.split("=");

    if (key && value) {
      combination[key.trim()] = value.trim();
    }
  });

  return combination;
};