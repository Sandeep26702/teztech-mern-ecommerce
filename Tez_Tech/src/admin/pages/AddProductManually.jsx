import { useState, useEffect } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import axios from "axios";
// 🔥 FIXED: Added FaTimes here
import { FaArrowLeft, FaPlus, FaTrash, FaCloudUploadAlt, FaSave, FaTags, FaRulerCombined, FaTimes } from "react-icons/fa";

// Pointing to live Render URL so it works on all devices
const API = "https://sonani-backend.onrender.com/api";

const AddProductManually = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [deletedImages, setDeletedImages] = useState([]);

  // ==========================================
  // 1. CORE FORM STATE (Based on CSV Columns)
  // ==========================================
  const [formData, setFormData] = useState({
    sku: "",
    name: "",
    status: "Active",
    searchTags: "",
    description: "",
    mrp: "",
    sellingPrice: "",
    gst: "",
    shippingCharge: "",
    stock: "",
    category1: "",
    category2: "",
    category3: "",
  });

  // ==========================================
  // 2. SPECIFICATIONS (Length, Width, Holes, Origin, Weight)
  // ==========================================
  const [specifications, setSpecifications] = useState([
    { key: "LENGTH_ft", value: "" },
    { key: "WIDTH_ft", value: "" },
    { key: "TOTAL_HOLES", value: "" },
    { key: "Weight", value: "" },
    { key: "Origin_MadeIn", value: "India" },
  ]);

  // ==========================================
  // 3. VARIATIONS & ADD-ONS (Material, Control Type, etc.)
  // ==========================================
  const [variations, setVariations] = useState([
    { 
      group: "MATERAL BRAND", 
      option: "TEZTECH PolySheet 1.5mm black", 
      priceOffset: "0", 
      sku: "", 
      stock: "",
      mrp: ""
    }
  ]);

  // ==========================================
  // 4. IMAGES (Max 3 as per CSV)
  // ==========================================
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  // ==========================================
  // FETCH PRODUCT FOR EDIT
  // ==========================================
  useEffect(() => {
    if (id) {
      const fetchProduct = async () => {
        try {
          const res = await axios.get(`${API}/products/${id}`);
          if (res.data.success) {
            const p = res.data.product;
            setFormData({
              sku: p.baseSku || p.sku || "",
              name: p.name || "",
              status: p.status || "Active",
              searchTags: p.searchTags ? p.searchTags.join(", ") : "",
              description: p.description || "",
              mrp: p.mrp || "",
              sellingPrice: p.price || "",
              gst: p.gstRate || "",
              shippingCharge: p.shippingCharge || "",
              stock: p.stock || "",
              category1: p.category || p.categories?.[0] || "",
              category2: p.categories?.[1] || "",
              category3: p.categories?.[2] || "",
            });

            if (p.details && p.details.length > 0) {
              setSpecifications(p.details);
            }

            if (p.attributes && p.attributes.length > 0) {
              const vars = [];
              p.attributes.forEach(attr => {
                attr.options.forEach(opt => {
                  vars.push({
                    group: attr.name,
                    option: opt.value,
                    priceOffset: opt.priceAdjustment || 0,
                    sku: opt.meta?.sku || "",
                    stock: opt.meta?.stock || "",
                    mrp: opt.meta?.mrp || ""
                  });
                });
              });
              setVariations(vars);
            }

            const existingImages = [...new Set([...(p.images || []), p.image])].filter(Boolean);
            setImagePreviews(existingImages);
          }
        } catch (error) {
          console.error("Failed to fetch product:", error);
        }
      };
      fetchProduct();
    }
  }, [id]);

  // --- Handlers ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSpecChange = (index, field, value) => {
    const newSpecs = [...specifications];
    newSpecs[index][field] = value;
    setSpecifications(newSpecs);
  };
  const addSpec = () => setSpecifications([...specifications, { key: "", value: "" }]);
  const removeSpec = (index) => setSpecifications(specifications.filter((_, i) => i !== index));

  const handleVarChange = (index, field, value) => {
    const newVars = [...variations];
    newVars[index][field] = value;
    setVariations(newVars);
  };
  const addVariation = () => setVariations([...variations, { group: "", option: "", priceOffset: "0", sku: "", stock: "", mrp: "" }]);
  const removeVariation = (index) => setVariations(variations.filter((_, i) => i !== index));

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 3 - images.length); // Max 3 images
    if (files.length === 0) return;

    setImages((prev) => [...prev, ...files]);
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeImage = (index) => {
    const preview = imagePreviews[index];
    // If it's a remote URL, mark it for deletion in Cloudinary
    if (preview.startsWith("http")) {
      setDeletedImages(prev => [...prev, preview]);
    } else {
      // It's a new local file, so we need to remove from the `images` state too
      // The images state only contains File objects (newly added), so we find its index
      // Since existing images aren't in `images`, the index in `images` array is different.
      // But a simpler way is to just filter by object URL if needed, or re-calculate.
      // Assuming images are added at the end:
      const localFilesCount = images.length;
      const remoteUrlsCount = imagePreviews.length - localFilesCount;
      if (index >= remoteUrlsCount) {
        const fileIndex = index - remoteUrlsCount;
        setImages(images.filter((_, i) => i !== fileIndex));
      }
    }
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  // --- Submit Logic ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = new FormData();
      
      // Append core fields
      Object.keys(formData).forEach((key) => {
        submitData.append(key, formData[key]);
      });

      // Filter empty specs/vars and append as JSON
      const validSpecs = specifications.filter(s => s.key && s.value);
      const validVars = variations.filter(v => v.group && v.option);
      
      submitData.append("specifications", JSON.stringify(validSpecs));
      submitData.append("variations", JSON.stringify(validVars));

      // Append files
      images.forEach((image) => {
        submitData.append("images", image);
      });

      if (deletedImages.length > 0) {
        submitData.append("deletedImages", JSON.stringify(deletedImages));
      }

      const token = localStorage.getItem("token");
      
      if (id) {
        await axios.put(`${API}/products/admin/${id}`, submitData, {
          headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${token}` },
        });
        alert("🎉 Product Updated Successfully!");
      } else {
        await axios.post(`${API}/products/admin`, submitData, {
          headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${token}` },
        });
        alert("🎉 Product Added Successfully!");
      }
      
      navigate("/admin/products");

    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "❌ Failed to add product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 font-sans bg-gray-50 md:p-10">
      <div className="mx-auto max-w-7xl">
        
        {/* HEADER */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/admin/products/csv-management" className="p-3 text-gray-500 transition-colors bg-white rounded-full shadow-sm hover:text-blue-600 hover:bg-blue-50">
              <FaArrowLeft />
            </Link>
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900">{id ? "Edit Product" : "Add Advanced Product"}</h1>
              <p className="text-gray-500">Create or edit product with variations perfectly aligned with your CSV schema.</p>
            </div>
          </div>
          
          <button onClick={handleSubmit} disabled={loading} className="flex items-center gap-2 px-6 py-3 font-bold text-white transition-transform shadow-lg bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl hover:-translate-y-1 disabled:opacity-70">
            {loading ? <span className="animate-pulse">Saving...</span> : <><FaSave /> {id ? "Update Product" : "Save Product"}</>}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          
          {/* ========================================== */}
          {/* LEFT COLUMN: Main Details & Variations */}
          {/* ========================================== */}
          <div className="space-y-8 lg:col-span-2">
            
            {/* 1. BASIC INFORMATION */}
            <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
              <h3 className="flex items-center gap-2 mb-4 text-lg font-bold text-gray-800">
                <FaTags className="text-blue-500" /> Basic Information
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="block mb-2 text-sm font-semibold text-gray-700">Product Name *</label>
                  <input type="text" name="name" required value={formData.name} onChange={handleInputChange} className="w-full px-4 py-3 border border-gray-200 outline-none bg-gray-50 rounded-xl focus:ring-2 focus:ring-blue-500" placeholder="e.g. VENKETSWARA 8X5 FEET 4569 HOLES" />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-semibold text-gray-700">SKU Code *</label>
                  <input type="text" name="sku" required value={formData.sku} onChange={handleInputChange} className="w-full px-4 py-3 border border-gray-200 outline-none bg-gray-50 rounded-xl focus:ring-2 focus:ring-blue-500" placeholder="e.g. VNK20" />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-semibold text-gray-700">Status</label>
                  <select name="status" value={formData.status} onChange={handleInputChange} className="w-full px-4 py-3 border border-gray-200 outline-none bg-gray-50 rounded-xl focus:ring-2 focus:ring-blue-500">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block mb-2 text-sm font-semibold text-gray-700">Search Tags</label>
                  <input type="text" name="searchTags" value={formData.searchTags} onChange={handleInputChange} className="w-full px-4 py-3 border border-gray-200 outline-none bg-gray-50 rounded-xl focus:ring-2 focus:ring-blue-500" placeholder="e.g. POLY SHEET, HINDU, VENKATESWARA" />
                </div>
                <div className="md:col-span-2">
                  <label className="block mb-2 text-sm font-semibold text-gray-700">Description</label>
                  <textarea name="description" rows="3" value={formData.description} onChange={handleInputChange} className="w-full px-4 py-3 border border-gray-200 outline-none bg-gray-50 rounded-xl focus:ring-2 focus:ring-blue-500" placeholder="Product details..." />
                </div>
              </div>
            </div>

            {/* 2. PRICING & STOCK */}
            <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
              <h3 className="mb-4 text-lg font-bold text-gray-800">Pricing & Inventory</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                <div>
                  <label className="block mb-2 text-sm font-semibold text-gray-700">Selling Price (₹) *</label>
                  <input type="number" name="sellingPrice" required value={formData.sellingPrice} onChange={handleInputChange} className="w-full px-4 py-3 border border-gray-200 outline-none bg-gray-50 rounded-xl" placeholder="0.00" />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-semibold text-gray-700">MRP (₹)</label>
                  <input type="number" name="mrp" value={formData.mrp} onChange={handleInputChange} className="w-full px-4 py-3 border border-gray-200 outline-none bg-gray-50 rounded-xl" placeholder="0.00" />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-semibold text-gray-700">GST (%) *</label>
                  <input type="number" name="gst" required value={formData.gst} onChange={handleInputChange} className="w-full px-4 py-3 border border-gray-200 outline-none bg-gray-50 rounded-xl" placeholder="18" />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-semibold text-gray-700">Shipping Charge (₹)</label>
                  <input type="number" name="shippingCharge" value={formData.shippingCharge} onChange={handleInputChange} className="w-full px-4 py-3 border border-gray-200 outline-none bg-gray-50 rounded-xl" placeholder="1350" />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-semibold text-gray-700">Base Stock *</label>
                  <input type="number" name="stock" required value={formData.stock} onChange={handleInputChange} className="w-full px-4 py-3 border border-gray-200 outline-none bg-gray-50 rounded-xl" placeholder="50" />
                </div>
              </div>
            </div>

            {/* 3. VARIATIONS & ADD-ONS */}
            <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Variations & Add-ons</h3>
                  <p className="text-xs text-gray-500">Add Material, Hole Sizes, Controls etc. and their extra price.</p>
                </div>
                <button type="button" onClick={addVariation} className="flex items-center gap-2 px-3 py-1.5 text-sm font-bold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100">
                  <FaPlus /> Add Option
                </button>
              </div>
              
              <div className="space-y-4">
                {variations.map((variant, index) => (
                  <div key={index} className="relative flex flex-wrap items-center gap-3 p-4 border border-gray-200 bg-gray-50 rounded-xl group">
                    <div className="flex-1 min-w-[150px]">
                      <label className="block mb-1 text-xs font-semibold text-gray-500 uppercase">Group (e.g. HOLE SIZE FOR)</label>
                      <input type="text" value={variant.group} onChange={(e) => handleVarChange(index, "group", e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none" />
                    </div>
                    <div className="flex-1 min-w-[150px]">
                      <label className="block mb-1 text-xs font-semibold text-gray-500 uppercase">Option Name</label>
                      <input type="text" placeholder="e.g. 9 mm LED" value={variant.option} onChange={(e) => handleVarChange(index, "option", e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none" />
                    </div>
                    <div className="w-24">
                      <label className="block mb-1 text-xs font-semibold text-gray-500 uppercase">Add Price (₹)</label>
                      <input type="number" placeholder="+0" value={variant.priceOffset} onChange={(e) => handleVarChange(index, "priceOffset", e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none" />
                    </div>
                    <div className="flex-1 min-w-[100px]">
                      <label className="block mb-1 text-xs font-semibold text-gray-500 uppercase">Var SKU / Code</label>
                      <input type="text" value={variant.sku} onChange={(e) => handleVarChange(index, "sku", e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none" />
                    </div>
                    <div className="w-24">
                      <label className="block mb-1 text-xs font-semibold text-gray-500 uppercase">Var MRP (₹)</label>
                      <input type="number" placeholder="0.00" value={variant.mrp} onChange={(e) => handleVarChange(index, "mrp", e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none" />
                    </div>
                    <div className="w-20">
                      <label className="block mb-1 text-xs font-semibold text-gray-500 uppercase">Stock</label>
                      <input type="number" value={variant.stock} onChange={(e) => handleVarChange(index, "stock", e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none" />
                    </div>
                    
                    <button type="button" onClick={() => removeVariation(index)} className="p-2 mt-5 text-red-500 transition-colors rounded-lg bg-red-50 hover:bg-red-500 hover:text-white">
                      <FaTrash />
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* ========================================== */}
          {/* RIGHT COLUMN: Categories, Specs, Images */}
          {/* ========================================== */}
          <div className="space-y-8 lg:col-span-1">
            
            {/* 4. CATEGORIES */}
            <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
              <h3 className="mb-4 text-lg font-bold text-gray-800">Categories</h3>
              <div className="space-y-3">
                <div>
                  <label className="block mb-1 text-xs font-semibold text-gray-600">Category 1 *</label>
                  <input type="text" name="category1" required value={formData.category1} onChange={handleInputChange} placeholder="e.g. POLY SHEET" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none" />
                </div>
                <div>
                  <label className="block mb-1 text-xs font-semibold text-gray-600">Category 2</label>
                  <input type="text" name="category2" value={formData.category2} onChange={handleInputChange} placeholder="e.g. HINDU" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none" />
                </div>
                <div>
                  <label className="block mb-1 text-xs font-semibold text-gray-600">Category 3</label>
                  <input type="text" name="category3" value={formData.category3} onChange={handleInputChange} placeholder="e.g. VENKATESWARA" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none" />
                </div>
              </div>
            </div>

            {/* 5. SPECIFICATIONS */}
            <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="flex items-center gap-2 text-lg font-bold text-gray-800">
                  <FaRulerCombined className="text-orange-500" /> Specifications
                </h3>
                <button type="button" onClick={addSpec} className="text-sm font-bold text-orange-600">
                  + Add Row
                </button>
              </div>
              <div className="space-y-2">
                {specifications.map((spec, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input type="text" placeholder="Key (e.g. LENGTH_ft)" value={spec.key} onChange={(e) => handleSpecChange(index, "key", e.target.value)} className="w-1/2 px-3 py-2 text-sm font-medium border border-gray-200 rounded-lg outline-none bg-gray-50" />
                    <input type="text" placeholder="Value" value={spec.value} onChange={(e) => handleSpecChange(index, "value", e.target.value)} className="w-1/2 px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none bg-gray-50" />
                    <button type="button" onClick={() => removeSpec(index)} className="p-2 text-gray-400 hover:text-red-500">
                      <FaTimes />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 6. IMAGES (Max 3) */}
            <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">Images</h3>
                <span className="text-xs font-bold text-gray-500">{imagePreviews.length}/3 Uploaded</span>
              </div>
              
              {imagePreviews.length < 3 && (
                <div className="relative flex flex-col items-center justify-center p-6 mb-4 border-2 border-gray-300 border-dashed cursor-pointer rounded-xl bg-gray-50 hover:bg-gray-100">
                  <input type="file" multiple accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <FaCloudUploadAlt className="mb-2 text-3xl text-gray-400" />
                  <p className="text-sm font-semibold text-gray-600">Upload Image_{imagePreviews.length + 1}</p>
                </div>
              )}

              {/* Previews */}
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {imagePreviews.map((src, index) => (
                    <div key={index} className="relative overflow-hidden border border-gray-200 rounded-lg group aspect-square">
                      <img src={src} alt={`Img ${index + 1}`} className="object-cover w-full h-full" />
                      <button type="button" onClick={() => removeImage(index)} className="absolute top-1 right-1 p-1.5 bg-white/90 text-red-600 rounded-full opacity-0 group-hover:opacity-100 shadow-sm">
                        <FaTrash className="text-xs" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductManually;