import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { FaEdit, FaPlus, FaSyncAlt, FaTrash, FaTimes, FaFolder, FaFolderOpen, FaFileAlt } from "react-icons/fa";
import { getApiUrl } from "../../utils/api.js";

const API_URL = getApiUrl();

const AdminCategoryManagement = () => {
  const token = localStorage.getItem("token");

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [fromCategoryId, setFromCategoryId] = useState("");
  const [toCategoryId, setToCategoryId] = useState("");

  const [selectedCategoryForProducts, setSelectedCategoryForProducts] = useState(null);
  const [categoryProducts, setCategoryProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // 🔥 UPDATE: Added level and parentCategory in formData
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sortOrder: 0,
    isActive: true,
    showOnHome: false,
    level: 1, 
    parentCategory: "", 
    imageFile: null,
  });

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      // Auto-cleanup categories with 0 products on refresh/fetch
      try {
        await axios.post(`${API_URL}/categories/admin/cleanup-unused`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.error("Auto-cleanup failed:", err);
      }

      const res = await axios.get(`${API_URL}/categories/admin`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setCategories(res.data.categories || []);
      }
    } catch (error) {
      alert(error.response?.data?.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const fetchCategoryProducts = useCallback(async (categoryName) => {
    try {
      setLoadingProducts(true);
      const res = await axios.get(`${API_URL}/products/admin?category=${encodeURIComponent(categoryName)}&limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setCategoryProducts(res.data.products || []);
      }
    } catch (error) {
      alert("Failed to load products for this category");
    } finally {
      setLoadingProducts(false);
    }
  }, [token]);

  useEffect(() => {
    if (selectedCategoryForProducts) {
      fetchCategoryProducts(selectedCategoryForProducts.name);
    } else {
      setCategoryProducts([]);
    }
  }, [selectedCategoryForProducts, fetchCategoryProducts]);

  const filteredCategories = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return categories;
    return categories.filter(
      (item) =>
        item.name?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q)
    );
  }, [categories, search]);

  const openCreate = () => {
    setEditingId(null);
    setFormData({
      name: "", description: "", sortOrder: 0, isActive: true,
      showOnHome: false,
      level: 1, parentCategory: "", imageFile: null,
    });
    setShowForm(true);
  };

  const openEdit = (category) => {
    setEditingId(category._id);
    setFormData({
      name: category.name || "",
      description: category.description || "",
      sortOrder: Number(category.sortOrder || 0),
      isActive: Boolean(category.isActive),
      showOnHome: Boolean(category.showOnHome),
      level: Number(category.level || 1),
      parentCategory: category.parentCategory?._id || category.parentCategory || "",
      imageFile: null,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (formData.level > 1 && !formData.parentCategory) {
      return alert("Please select a Parent Category for Level 2 or 3.");
    }

    const homeCategoriesCount = categories.filter((c) => c.showOnHome).length;
    if (formData.showOnHome) {
      const isCurrentlyHome = editingId ? categories.find(c => c._id === editingId)?.showOnHome : false;
      if (!isCurrentlyHome && homeCategoriesCount >= 14) {
        return alert("You can select a maximum of 14 categories for the home page display.");
      }
    }

    try {
      setSaving(true);
      const body = new FormData();
      body.append("name", formData.name);
      body.append("description", formData.description);
      body.append("sortOrder", String(formData.sortOrder));
      body.append("isActive", String(formData.isActive));
      body.append("showOnHome", String(formData.showOnHome));
      
      // 🔥 Send new fields to backend
      body.append("level", String(formData.level));
      if (formData.level > 1) {
        body.append("parentCategory", formData.parentCategory);
      } else {
        body.append("parentCategory", ""); // Level 1 has no parent
      }

      if (formData.imageFile) body.append("image", formData.imageFile);

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      };

      if (editingId) {
        await axios.put(`${API_URL}/categories/${editingId}`, body, config);
        alert("Category updated");
      } else {
        await axios.post(`${API_URL}/categories`, body, config);
        alert("Category created");
      }

      closeForm();
      fetchCategories();
    } catch (error) {
      alert(error.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (categoryId, productCount) => {
    if (!window.confirm("Delete this category?")) return;
    try {
      if (productCount > 0) {
        const target = window.prompt("This category has products. Enter target category ID to move products before delete:");
        if (!target) return;
        await axios.delete(`${API_URL}/categories/${categoryId}?targetCategoryId=${target}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.delete(`${API_URL}/categories/${categoryId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      fetchCategories();
    } catch (error) {
      alert(error.response?.data?.message || "Delete failed");
    }
  };

  const handleToggleHome = async (category) => {
    const isAdding = !category.showOnHome;
    if (isAdding) {
      const homeCategoriesCount = categories.filter((c) => c.showOnHome).length;
      if (homeCategoriesCount >= 14) {
        return alert("You can select a maximum of 14 categories for the home page display.");
      }
    }

    try {
      setLoading(true);
      const res = await axios.put(
        `${API_URL}/categories/${category._id}`,
        {
          name: category.name,
          showOnHome: isAdding,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (res.data.success) {
        alert(isAdding ? "Added to home page" : "Removed from home page");
        fetchCategories();
      }
    } catch (error) {
      alert(error.response?.data?.message || "Failed to update category");
      fetchCategories();
    } finally {
      setLoading(false);
    }
  };

  const handleBulkMove = async () => { /* Same as before */ };
  const handleCleanupUnused = async () => { /* Same as before */ };

  // Helper to get parent name
  const getParentName = (parentId) => {
    if (!parentId) return "None";
    const id = typeof parentId === 'object' ? parentId._id : parentId;
    const parent = categories.find(c => c._id === id);
    return parent ? parent.name : "Unknown";
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Category Management</h1>
            <p className="text-sm text-gray-600">Build your Drill-Down (Multi-Level) category structure here.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchCategories} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100">
              <FaSyncAlt /> Refresh
            </button>
            <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-md">
              <FaPlus /> Add Category
            </button>
          </div>
        </div>
      </div>

      {/* Category List */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <div className="p-6 text-sm text-gray-500 bg-white border border-gray-200 rounded-xl col-span-full text-center font-bold">Loading categories...</div>
        ) : filteredCategories.length === 0 ? (
          <div className="p-6 text-sm text-gray-500 bg-white border border-gray-200 rounded-xl col-span-full text-center">No categories found. Create a new one!</div>
        ) : (
          filteredCategories.map((category) => (
            <div key={category._id} className={`bg-white border rounded-none shadow-sm transition-all hover:shadow-md overflow-hidden flex flex-col justify-between group ${category.level === 1 ? 'border-blue-200' : category.level === 2 ? 'border-amber-200' : 'border-gray-200'}`}>
              
              {/* Square Image Box at the Top */}
              <div 
                className="w-full aspect-square bg-slate-50 flex items-center justify-center overflow-hidden border-b border-gray-100 cursor-pointer relative"
                onClick={() => setSelectedCategoryForProducts(category)}
              >
                {category.image ? (
                  <img src={category.image} alt={category.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-300">No Image</div>
                )}
                
                {/* Level Overlay Badge */}
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white text-[10px] font-black px-2.5 py-1 rounded-lg tracking-wider uppercase">
                  Level {category.level || 1}
                </div>
                
                {/* Products Count Overlay Badge */}
                <div className="absolute top-3 right-3 bg-blue-600/90 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-lg">
                  {category.productCount || 0} Products
                </div>
              </div>
              
              {/* Details Area Below */}
              <div className="p-4 flex flex-col flex-grow">
                <div 
                  className="flex-1 cursor-pointer" 
                  onClick={() => setSelectedCategoryForProducts(category)}
                  title="Click to view products in this category"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-gray-900 truncate text-base hover:text-blue-600 transition-colors flex-1">{category.name}</h3>
                    <div className="text-gray-400 mt-0.5 flex-shrink-0">
                      {category.level === 1 ? <FaFolder className="text-blue-500" /> : category.level === 2 ? <FaFolderOpen className="text-amber-500" /> : <FaFileAlt className="text-gray-400" />}
                    </div>
                  </div>
                  
                  {category.level > 1 && (
                    <p className="text-xs font-semibold text-gray-500 mt-1 truncate">
                      Parent: <span className="text-blue-600">{getParentName(category.parentCategory)}</span>
                    </p>
                  )}
                  <p className="mt-1.5 text-xs text-gray-500 line-clamp-2 min-h-[32px]">{category.description || "No description provided."}</p>
                </div>
                
                {/* Toggles (Active Status & On Home) */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${category.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                    {category.isActive ? "Active" : "Inactive"}
                  </span>
                  
                  <button
                    type="button"
                    onClick={() => handleToggleHome(category)}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-colors ${category.showOnHome ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100" : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"}`}
                  >
                    {category.showOnHome ? "★ On Home" : "☆ Show on Home"}
                  </button>
                </div>
                
                {/* Action Buttons (Edit & Delete) */}
                <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                  <button onClick={() => openEdit(category)} className="inline-flex items-center justify-center flex-1 gap-1 px-3 py-2 text-xs font-bold text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors">
                    <FaEdit /> Edit
                  </button>
                  <button onClick={() => handleDelete(category._id, category.productCount || 0)} className="inline-flex items-center justify-center flex-1 gap-1 px-3 py-2 text-xs font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-sm">
                    <FaTrash /> Delete
                  </button>
                </div>
              </div>
              
            </div>
          ))
        )}
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-white border border-gray-200 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-xl font-black text-gray-900">{editingId ? "Edit Category" : "Create New Category"}</h3>
              <button onClick={closeForm} className="p-2 text-gray-400 bg-gray-50 rounded-full hover:bg-gray-200 hover:text-gray-900 transition-colors">
                <FaTimes />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-5">
              
              {/* 🔥 NEW: Hierarchy Section */}
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl space-y-4">
                <h4 className="text-xs font-black tracking-widest text-blue-800 uppercase mb-2">Category Structure</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1.5 text-sm font-bold text-gray-700">Level</label>
                    <select
                      value={formData.level}
                      onChange={(e) => setFormData({ ...formData, level: Number(e.target.value), parentCategory: "" })}
                      className="w-full px-4 py-2.5 text-sm font-semibold text-gray-900 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value={1}>1 - Main Category (e.g. Polysheet)</option>
                      <option value={2}>2 - Sub Category (e.g. Hindu)</option>
                      <option value={3}>3 - Item / Design (e.g. Ganesh)</option>
                    </select>
                  </div>

                  {formData.level > 1 && (
                    <div className="animate-fade-in">
                      <label className="block mb-1.5 text-sm font-bold text-gray-700">Parent Category</label>
                      <select
                        value={formData.parentCategory}
                        onChange={(e) => setFormData({ ...formData, parentCategory: e.target.value })}
                        required
                        className="w-full px-4 py-2.5 text-sm font-semibold text-gray-900 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="">-- Select Parent --</option>
                        {categories
                          .filter(c => (c.level || 1) === formData.level - 1)
                          .map(c => (
                            <option key={c._id} value={c._id}>{c.name}</option>
                          ))
                        }
                      </select>
                    </div>
                  )}
                </div>
                {formData.level > 1 && categories.filter(c => (c.level || 1) === formData.level - 1).length === 0 && (
                  <p className="text-xs font-bold text-red-500 mt-1">Warning: No valid parent categories found. Create a Level {formData.level - 1} category first.</p>
                )}
              </div>

              {/* Standard Fields */}
              <div>
                <label className="block mb-1.5 text-sm font-bold text-gray-700">Category Name</label>
                <input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required placeholder="e.g. Polysheet 1.5mm"
                  className="w-full px-4 py-2.5 text-sm font-medium border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              
              <div>
                <label className="block mb-1.5 text-sm font-bold text-gray-700">Description</label>
                <textarea
                  rows="2"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Short description..."
                  className="w-full px-4 py-2.5 text-sm font-medium border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block mb-1.5 text-sm font-bold text-gray-700">Display Order</label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 text-sm font-medium border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block mb-1.5 text-sm font-bold text-gray-700">Visibility</label>
                  <select
                    value={String(formData.isActive)}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.value === "true" })}
                    className="w-full px-4 py-2.5 text-sm font-semibold border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="true">Active (Visible to users)</option>
                    <option value="false">Inactive (Hidden)</option>
                  </select>
                </div>
              </div>

              <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between">
                <div>
                  <label className="block text-sm font-bold text-gray-700">Show on Home Page</label>
                  <span className="text-xs text-gray-500">Toggle whether this category displays on the homepage. Max 14 categories allowed.</span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.showOnHome}
                  onChange={(e) => setFormData({ ...formData, showOnHome: e.target.checked })}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-bold text-gray-700">Category Thumbnail</label>
                <span className="block text-xs text-gray-500 mb-2 font-medium">Recommended size: **Square aspect ratio (e.g., 500x500 px)** for optimal homepage filling. Max size: 1MB.</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 1024 * 1024) {
                        alert("Maximum file size allowed is 1MB.");
                        e.target.value = null;
                        return;
                      }
                      setFormData({ ...formData, imageFile: file });
                    } else {
                      setFormData({ ...formData, imageFile: null });
                    }
                  }}
                  className="w-full px-3 py-2 text-sm font-medium border border-gray-300 rounded-xl file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-gray-100">
                <button type="button" onClick={closeForm} className="px-6 py-2.5 text-sm font-bold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="px-8 py-2.5 text-sm font-black text-white bg-blue-600 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-70 disabled:shadow-none transition-all">
                  {saving ? "Saving..." : editingId ? "Update Category" : "Save Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Products List Modal */}
      {selectedCategoryForProducts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-white border border-gray-200 rounded-2xl shadow-2xl max-h-[85vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-xl font-black text-gray-900">
                  Products in "{selectedCategoryForProducts.name}"
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Total Products: {selectedCategoryForProducts.productCount || 0}
                </p>
              </div>
              <button 
                onClick={() => setSelectedCategoryForProducts(null)} 
                className="p-2 text-gray-400 bg-gray-50 rounded-full hover:bg-gray-200 hover:text-gray-900 transition-colors"
              >
                <FaTimes />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              {loadingProducts ? (
                <div className="text-center py-12 text-sm text-gray-500 font-bold animate-pulse">
                  Loading products...
                </div>
              ) : categoryProducts.length === 0 ? (
                <div className="text-center py-12 text-sm text-gray-500">
                  No products found in this category.
                </div>
              ) : (
                <div className="space-y-4">
                  {categoryProducts.map((product) => (
                    <div key={product._id} className="flex items-center gap-4 p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                      <img 
                        src={product.image || "https://placehold.co/100x100?text=Product"} 
                        alt={product.name} 
                        className="w-12 h-12 object-cover rounded-lg border bg-gray-50"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-gray-900 truncate">{product.name}</h4>
                        <p className="text-xs text-gray-500 truncate">SKU: {product.baseSku} | Stock: {product.stock}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-extrabold text-blue-600">₹{product.price}</span>
                        <p className={`text-[10px] font-bold mt-0.5 ${product.status === "Active" ? "text-emerald-600" : "text-red-500"}`}>{product.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
              <button 
                onClick={() => setSelectedCategoryForProducts(null)} 
                className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategoryManagement;