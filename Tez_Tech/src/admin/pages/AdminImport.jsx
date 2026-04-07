import React, { useState } from "react";
import axios from "axios";

const AdminImport = () => {
  const [file, setFile] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [mapping, setMapping] = useState({});
  const [loading, setLoading] = useState(false);

  // 🔥 STEP 1: Preview CSV
  const handlePreview = async (e) => {
    const file = e.target.files[0];
    setFile(file);

    const form = new FormData();
    form.append("file", file);

    const res = await axios.post("/api/products/import/csv/preview", form);

    setHeaders(res.data.headers);
    setMapping(res.data.suggestedMapping);
  };

  // 🔥 STEP 2: Import
  const handleImport = async () => {
    setLoading(true);

    const form = new FormData();
    form.append("file", file);
    form.append("mapping", JSON.stringify(mapping));

    const res = await axios.post("/api/products/import/csv", form);

    alert(res.data.message);
    setLoading(false);
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>CSV Import</h2>

      <input type="file" onChange={handlePreview} />

      {/* 🔥 Mapping UI */}
      {headers.map((h) => (
        <div key={h} style={{ marginTop: 10 }}>
          <span>{h}</span>

          <select
            value={mapping[h] || ""}
            onChange={(e) =>
              setMapping((prev) => ({
                ...prev,
                [h]: e.target.value,
              }))
            }
          >
            <option value="">Ignore</option>
            <option value="sku">SKU</option>
            <option value="name">Name</option>
            <option value="price">Price</option>
            <option value="stock">Stock</option>
            <option value="color">Color</option>
            <option value="size">Size</option>
            <option value="design">Design</option>
          </select>
        </div>
      ))}

      <button onClick={handleImport} disabled={loading}>
        {loading ? "Importing..." : "Import CSV"}
      </button>
    </div>
  );
};

export default AdminImport;