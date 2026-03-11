import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast"; // 🔥 Removed { Toaster } from here
import {
  FaPlus,
  FaTrash,
  FaEdit,
  FaCloudUploadAlt,
  FaTimes,
  FaSearch,
  FaFileImport,
  FaSpinner, // Loader icon
} from "react-icons/fa";

// 🌍 Use Environment Variable for API URL (Fallback to localhost for dev)
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const createFieldId = () => `cf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const createDetailId = () => `dt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const createEmptyCustomField = () => ({
  tempId: createFieldId(),
  label: "",
  type: "radio",
  required: false,
  optionsText: "",
});

const createEmptyDetail = () => ({
  tempId: createDetailId(),
  key: "",
  value: "",
});

const parseOptionLine = (rawOption = "") => {
  const [rawLabel, rawAdjustment] = String(rawOption).split("|");
  const label = String(rawLabel || "").trim();
  if (!label) return null;

  const adjustment = Number(rawAdjustment);
  return {
    label,
    priceAdjustment: Number.isFinite(adjustment) ? adjustment : 0,
  };
};

const optionToEditorText = (option) => {
  if (!option) return "";
  if (typeof option === "object" && !Array.isArray(option)) {
    const label = String(option.label || "").trim();
    if (!label) return "";
    const adjustment = Number(option.priceAdjustment);
    if (!Number.isFinite(adjustment) || adjustment === 0) return label;
    return `${label}|${adjustment}`;
  }
  return String(option).trim();
};

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(""); // 🔥 Debounce added
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  
  const [isFetching, setIsFetching] = useState(true); // 🔥 Initial Load state
  const [loading, setLoading] = useState(false); // Form submit state
  
  const [categories, setCategories] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    gstRate: 0,
    shippingCharge: 0,
    category: "",
    brand: "",
    stock: 0,
    imageFile: null,
    previewImage: null, // 🔥 Image preview state
    customFields: [],
    details: [],
  });

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const getAuthConfig = () => ({
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  const getFormConfig = () => ({
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
      "Content-Type": "multipart/form-data",
    },
  });

  // 🔥 Handle Auth Expiration
  const handleAuthError = useCallback((error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      toast.error("Session expired. Please login again.");
      localStorage.removeItem("token");
      navigate("/login");
    } else {
      toast.error(error.response?.data?.message || "Something went wrong!");
    }
  }, [navigate]);

  const fetchProducts = useCallback(async () => {
    try {
      setIsFetching(true);
      const params = {};
      if (categoryFilter) params.category = categoryFilter;
      const res = await axios.get(`${API_BASE_URL}/products`, { params });
      if (res.data.success) setProducts(res.data.products || []);
    } catch (error) {
      handleAuthError(error);
    } finally {
      setIsFetching(false);
    }
  }, [categoryFilter, handleAuthError]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/categories/admin`, getAuthConfig());
      if (res.data.success) {
        setCategories(res.data.categories || []);
      }
    } catch (error) {
      console.error("Category fetch error:", error);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts, fetchCategories]);

  // 🔥 Debounce logic for Search (Performance boost)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const openCreateForm = () => {
    setIsEditing(false);
    setCurrentId(null);
    setFormData({
      name: "",
      description: "",
      price: "",
      gstRate: 0,
      shippingCharge: 0,
      category: "",
      brand: "",
      stock: 0,
      imageFile: null,
      previewImage: null,
      customFields: [],
      details: [],
    });
    setShowForm(true);
  };

  const handleEditClick = (product) => {
    setIsEditing(true);
    setCurrentId(product._id);
    setFormData({
      name: product.name || "",
      description: product.description || "",
      price: product.price || "",
      gstRate: product.gstRate ?? 0,
      shippingCharge: product.shippingCharge ?? 0,
      category: product.category || "",
      brand: product.brand || "",
      stock: product.stock ?? 0,
      imageFile: null,
      previewImage: product.image || null, // 🔥 Load existing image for preview
      customFields: (product.customFields || []).map((field) => ({
        tempId: field._id || createFieldId(),
        label: field.label || "",
        type: field.type || "radio",
        required: Boolean(field.required),
        optionsText: (field.options || []).map(optionToEditorText).filter(Boolean).join("\n"),
      })),
      details: (product.details || []).map((item) => ({
        tempId: createDetailId(),
        key: item.key || "",
        value: item.value || "",
      })),
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setIsEditing(false);
    setCurrentId(null);
  };

  const addCustomField = () => {
    setFormData((prev) => ({
      ...prev,
      customFields: [...prev.customFields, createEmptyCustomField()],
    }));
  };

  const addDetailField = () => {
    setFormData((prev) => ({
      ...prev,
      details: [...prev.details, createEmptyDetail()],
    }));
  };

  const removeCustomField = (index) => {
    setFormData((prev) => ({
      ...prev,
      customFields: prev.customFields.filter((_, i) => i !== index),
    }));
  };

  const removeDetailField = (index) => {
    setFormData((prev) => ({
      ...prev,
      details: prev.details.filter((_, i) => i !== index),
    }));
  };

  const updateCustomField = (index, key, value) => {
    setFormData((prev) => ({
      ...prev,
      customFields: prev.customFields.map((field, i) =>
        i === index ? { ...field, [key]: value } : field
      ),
    }));
  };

  const updateDetailField = (index, key, value) => {
    setFormData((prev) => ({
      ...prev,
      details: prev.details.map((item, i) => (i === index ? { ...item, [key]: value } : item)),
    }));
  };

  // 🔥 Handle Image Change for Preview
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({
        ...formData,
        imageFile: file,
        previewImage: URL.createObjectURL(file), // Generate temp URL
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const data = new FormData();
    data.append("name", formData.name);
    data.append("description", formData.description);
    data.append("price", formData.price);
    data.append("gstRate", String(formData.gstRate ?? 0));
    data.append("shippingCharge", String(formData.shippingCharge ?? 0));
    data.append("category", formData.category);
    data.append("brand", formData.brand);
    data.append("stock", String(formData.stock));
    if (formData.imageFile) data.append("image", formData.imageFile);

    const normalizedCustomFields = formData.customFields
      .map((field) => {
        const label = field.label.trim();
        if (!label) return null;

        const type = field.type === "checkbox" || field.type === "text" ? field.type : "radio";
        const options = field.optionsText
          .split(/\r?\n|,/)
          .map((option) => parseOptionLine(option))
          .filter(Boolean);

        if ((type === "radio" || type === "checkbox") && options.length === 0) {
          return null;
        }

        return {
          label,
          type,
          required: Boolean(field.required),
          options,
        };
      })
      .filter(Boolean);
      
    data.append("customFields", JSON.stringify(normalizedCustomFields));

    const normalizedDetails = (formData.details || [])
      .map((item) => {
        const key = String(item.key || "").trim();
        const value = String(item.value || "").trim();
        if (!key || !value) return null;
        return { key, value };
      })
      .filter(Boolean);
    data.append("details", JSON.stringify(normalizedDetails));

    try {
      if (isEditing) {
        await axios.put(`${API_BASE_URL}/products/${currentId}`, data, getFormConfig());
        toast.success("Product updated successfully!"); // 🔥
      } else {
        await axios.post(`${API_BASE_URL}/products`, data, getFormConfig());
        toast.success("Product added successfully!"); // 🔥
      }
      closeForm();
      fetchProducts();
    } catch (error) {
      handleAuthError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/products/${id}`, getAuthConfig());
      toast.success("Product deleted!");
      fetchProducts();
    } catch (error) {
      handleAuthError(error);
    }
  };

  // 🔥 Filtering using Debounced Search Term
  const filteredProducts = products.filter(
    (p) =>
      p.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      p.brand?.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans">
      {/* 🔥 Removed the <Toaster /> from here! */}

      <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
            <p className="text-sm text-gray-600 mt-1">Manage your product catalog and open CSV tools from here.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={openCreateForm}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white transition bg-blue-600 rounded-xl hover:bg-blue-700 active:scale-95"
            >
              <FaPlus /> Add Product
            </button>
            <button
              onClick={() => navigate("/admin/products/csv-management")}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-indigo-700 transition bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100 active:scale-95"
            >
              <FaFileImport /> CSV Management
            </button>
          </div>
        </div>

        <div className="mt-5 relative max-w-xl">
          <FaSearch className="absolute text-gray-400 left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by product name or brand"
            className="w-full py-2.5 pl-10 pr-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm"
          />
        </div>
        
        <div className="mt-3 max-w-xs">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-hidden bg-white border border-gray-200 rounded-2xl shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Product Catalog</h2>
            <p className="text-sm text-gray-500">Showing {filteredProducts.length} products</p>
          </div>
        </div>

        <div className="overflow-x-auto min-h-[300px]">
          {isFetching ? (
            // 🔥 Skeleton Loading State
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <FaSpinner className="text-4xl animate-spin mb-3 text-blue-500" />
              <p>Loading products...</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs tracking-wide">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold">Image</th>
                  <th className="px-6 py-3 text-left font-semibold">Product</th>
                  <th className="px-6 py-3 text-left font-semibold hidden md:table-cell">Brand</th>
                  <th className="px-6 py-3 text-left font-semibold hidden lg:table-cell">Category</th>
                  <th className="px-6 py-3 text-left font-semibold">Price</th>
                  <th className="px-6 py-3 text-left font-semibold">Stock</th>
                  <th className="px-6 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-3">
                      <div className="w-12 h-12 border border-gray-200 rounded-lg bg-white overflow-hidden flex items-center justify-center">
                        <img
                          src={p.image || "https://placehold.co/100x100/f3f4f6/a1a1aa?text=No+Img"}
                          alt={p.name}
                          className="w-full h-full object-contain mix-blend-multiply"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <p className="font-semibold text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-500 line-clamp-1 max-w-xs">{p.description}</p>
                    </td>
                    <td className="px-6 py-3 hidden md:table-cell text-gray-600">{p.brand}</td>
                    <td className="px-6 py-3 hidden lg:table-cell text-gray-600">
                      <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md text-xs font-medium">{p.category}</span>
                    </td>
                    <td className="px-6 py-3 font-semibold text-gray-800">₹{p.price?.toLocaleString("en-IN")}</td>
                    <td className="px-6 py-3">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                          p.stock < 10 ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="inline-flex gap-2">
                        <button
                          onClick={() => handleEditClick(p)}
                          className="p-2.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition shadow-sm"
                          title="Edit"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(p._id)}
                          className="p-2.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition shadow-sm"
                          title="Delete"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {!isFetching && filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-6 py-16 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <FaSearch className="text-4xl text-gray-300 mb-3" />
                        <p className="text-lg font-medium text-gray-700">No products found</p>
                        <p className="text-sm">Try adjusting your search or filters.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start md:items-center justify-center p-2 sm:p-4 overflow-y-auto transition-opacity">
          <div className="w-full max-w-4xl bg-white rounded-xl sm:rounded-2xl border border-gray-200 shadow-2xl max-h-[95vh] flex flex-col transform transition-all">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-md z-10 rounded-t-2xl">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{isEditing ? "Edit Product" : "Add New Product"}</h3>
                <p className="text-sm text-gray-500">Fill in the details below to save.</p>
              </div>
              <button onClick={closeForm} className="p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition">
                <FaTimes size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6 overflow-y-auto bg-gray-50/30">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Product Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Enter product name"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Brand <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    required
                    placeholder="e.g. Nike, Apple"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Category <span className="text-red-500">*</span></label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition shadow-sm bg-white"
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Price (₹) <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                      min="0"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition shadow-sm"
                    />
                  </div>
                  <div className="w-1/3">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">GST (%)</label>
                    <input
                      type="number"
                      min="0" max="100" step="0.01"
                      value={formData.gstRate}
                      onChange={(e) => setFormData({ ...formData, gstRate: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition shadow-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Shipping Charge (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.shippingCharge}
                    onChange={(e) => setFormData({ ...formData, shippingCharge: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Stock <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    required min="0"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition shadow-sm"
                  />
                </div>

                {/* 🔥 Image Upload with Preview Feature */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Product Image</label>
                  <div className="flex items-center gap-3">
                    {formData.previewImage && (
                      <div className="w-12 h-12 shrink-0 border border-gray-200 rounded-lg overflow-hidden bg-white">
                        <img src={formData.previewImage} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <label className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition group shadow-sm">
                      <FaCloudUploadAlt className="text-gray-400 group-hover:text-blue-500 text-xl transition" />
                      <span className="text-sm font-medium text-gray-600 truncate">
                        {formData.imageFile ? formData.imageFile.name : "Click to upload image"}
                      </span>
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  placeholder="Describe your product here..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition shadow-sm resize-none"
                />
              </div>

              <div className="space-y-5 p-6 bg-white border border-gray-200 rounded-2xl shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
                  <div>
                    <h4 className="text-lg font-bold text-gray-900">Custom Variants & Fields</h4>
                    <p className="text-sm text-gray-500">Size, Color, Material (Adds options to product page)</p>
                  </div>
                  <button
                    type="button"
                    onClick={addCustomField}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition shadow-sm"
                  >
                    <FaPlus size={12} /> Add Field
                  </button>
                </div>

                {formData.customFields.length === 0 ? (
                  <div className="p-6 text-sm text-center text-gray-500 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                    No custom fields added. Click "Add Field" to create variations.
                  </div>
                ) : (
                  formData.customFields.map((field, index) => {
                    const previewOptions = (field.optionsText || "")
                      .split(/\r?\n|,/)
                      .map((opt) => opt.trim())
                      .filter(Boolean);

                    return (
                      <div
                        key={field.tempId || `field-${index}`}
                        className="relative overflow-hidden border border-slate-200 bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-sm"
                      >
                        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50/80">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-sm font-bold flex items-center justify-center">
                              {index + 1}
                            </div>
                            <p className="text-sm font-semibold text-slate-800">
                              {field.label?.trim() || `Field ${index + 1}`}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeCustomField(index)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition"
                          >
                            <FaTrash /> Remove
                          </button>
                        </div>

                        <div className="p-4 sm:p-5 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                            <div className="md:col-span-6">
                              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Field Label</label>
                              <input
                                type="text"
                                value={field.label}
                                onChange={(e) => updateCustomField(index, "label", e.target.value)}
                                placeholder="e.g. Size, Warranty, Material"
                                className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                              />
                            </div>

                            <div className="md:col-span-4">
                              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Input Type</label>
                              <select
                                value={field.type}
                                onChange={(e) => updateCustomField(index, "type", e.target.value)}
                                className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                              >
                                <option value="radio">Radio Buttons</option>
                                <option value="checkbox">Checkboxes</option>
                                <option value="text">Text Input</option>
                              </select>
                            </div>

                            <div className="md:col-span-2 flex items-end">
                              <label className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 border border-slate-200 rounded-xl cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={field.required}
                                  onChange={(e) => updateCustomField(index, "required", e.target.checked)}
                                  className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500 accent-blue-600"
                                />
                                Required
                              </label>
                            </div>
                          </div>

                          {(field.type === "radio" || field.type === "checkbox") && (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">
                                  Options
                                </label>
                                <span className="text-xs text-slate-500">
                                  Format: `Option|100` or `Option|-50`
                                </span>
                              </div>
                              <textarea
                                rows="5"
                                value={field.optionsText}
                                onChange={(e) => updateCustomField(index, "optionsText", e.target.value)}
                                placeholder={"Small|0\nMedium|150\nLarge|300\nNo Warranty|-50"}
                                className="w-full px-4 py-3 text-sm border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-mono bg-white"
                              />

                              {previewOptions.length > 0 && (
                                <div className="flex flex-wrap gap-2 pt-1">
                                  {previewOptions.map((option, optionIndex) => (
                                    <span
                                      key={`${field.tempId || index}-${option}-${optionIndex}`}
                                      className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-full"
                                    >
                                      {option}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="space-y-5 p-6 bg-white border border-gray-200 rounded-2xl shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
                  <div>
                    <h4 className="text-lg font-bold text-gray-900">Product Details</h4>
                    <p className="text-sm text-gray-500">Key/value specs shown on product detail page.</p>
                  </div>
                  <button
                    type="button"
                    onClick={addDetailField}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition shadow-sm"
                  >
                    <FaPlus size={12} /> Add Detail
                  </button>
                </div>

                {formData.details.length === 0 ? (
                  <div className="p-6 text-sm text-center text-gray-500 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                    No details added. Click "Add Detail" to create specs.
                  </div>
                ) : (
                  formData.details.map((item, index) => (
                    <div
                      key={item.tempId || `detail-${index}`}
                      className="flex flex-col gap-3 md:flex-row md:items-center"
                    >
                      <input
                        type="text"
                        value={item.key}
                        onChange={(e) => updateDetailField(index, "key", e.target.value)}
                        placeholder="Key (e.g. Length, Material)"
                        className="w-full md:w-1/3 px-4 py-2.5 text-sm border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                      <input
                        type="text"
                        value={item.value}
                        onChange={(e) => updateDetailField(index, "value", e.target.value)}
                        placeholder="Value"
                        className="w-full md:flex-1 px-4 py-2.5 text-sm border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => removeDetailField(index)}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition"
                      >
                        <FaTrash /> Remove
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 sticky bottom-0 bg-white/90 backdrop-blur-sm pb-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="w-full sm:w-auto px-6 py-2.5 text-sm font-bold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:bg-blue-400 transition shadow-md active:scale-95"
                >
                  {loading && <FaSpinner className="animate-spin" />}
                  {loading ? "Saving..." : isEditing ? "Update Product" : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
