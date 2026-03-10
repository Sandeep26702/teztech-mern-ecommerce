import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { FaEdit, FaPlus, FaSyncAlt, FaTrash, FaTimes } from "react-icons/fa";

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

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sortOrder: 0,
    isActive: true,
    imageFile: null,
  });

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/categories/admin", {
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
      name: "",
      description: "",
      sortOrder: 0,
      isActive: true,
      imageFile: null,
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
    try {
      setSaving(true);
      const body = new FormData();
      body.append("name", formData.name);
      body.append("description", formData.description);
      body.append("sortOrder", String(formData.sortOrder));
      body.append("isActive", String(formData.isActive));
      if (formData.imageFile) body.append("image", formData.imageFile);

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      };

      if (editingId) {
        await axios.put(`http://localhost:5000/api/categories/${editingId}`, body, config);
        alert("Category updated");
      } else {
        await axios.post("http://localhost:5000/api/categories", body, config);
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
        await axios.delete(`http://localhost:5000/api/categories/${categoryId}?targetCategoryId=${target}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.delete(`http://localhost:5000/api/categories/${categoryId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      fetchCategories();
    } catch (error) {
      alert(error.response?.data?.message || "Delete failed");
    }
  };

  const handleBulkMove = async () => {
    if (!fromCategoryId || !toCategoryId) {
      alert("Select both source and target category");
      return;
    }
    if (fromCategoryId === toCategoryId) {
      alert("Source and target must be different");
      return;
    }
    if (!window.confirm("Move all products from source category to target category?")) return;

    try {
      const res = await axios.post(
        "http://localhost:5000/api/categories/reassign-products",
        { fromCategoryId, toCategoryId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      alert(`${res.data.message}\nMoved: ${res.data.movedCount || 0}`);
      fetchCategories();
    } catch (error) {
      alert(error.response?.data?.message || "Move failed");
    }
  };

  const handleCleanupUnused = async () => {
    if (!window.confirm("Delete all categories that have zero products?")) return;
    try {
      const res = await axios.post(
        "http://localhost:5000/api/categories/admin/cleanup-unused",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      alert(`${res.data.message}\nDeleted: ${res.data.deletedCount || 0}`);
      fetchCategories();
    } catch (error) {
      alert(error.response?.data?.message || "Cleanup failed");
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Category Management</h1>
            <p className="text-sm text-gray-600">Create, edit, activate/deactivate, reassign products and safely delete categories.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchCategories}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100"
            >
              <FaSyncAlt /> Refresh
            </button>
            <button
              onClick={handleCleanupUnused}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-amber-800 border rounded-xl bg-amber-50 border-amber-200 hover:bg-amber-100"
            >
              <FaTrash /> Cleanup Unused
            </button>
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700"
            >
              <FaPlus /> Add Category
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 bg-white border border-gray-200 rounded-2xl shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-gray-900">Bulk Product Reassignment</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <select value={fromCategoryId} onChange={(e) => setFromCategoryId(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg">
            <option value="">Source category</option>
            {categories.map((item) => (
              <option key={item._id} value={item._id}>
                {item.name}
              </option>
            ))}
          </select>
          <select value={toCategoryId} onChange={(e) => setToCategoryId(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg">
            <option value="">Target category</option>
            {categories.map((item) => (
              <option key={item._id} value={item._id}>
                {item.name}
              </option>
            ))}
          </select>
          <button onClick={handleBulkMove} className="px-3 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700">
            Move Products
          </button>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories..."
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <div className="p-6 text-sm text-gray-500 bg-white border border-gray-200 rounded-xl">Loading categories...</div>
        ) : filteredCategories.length === 0 ? (
          <div className="p-6 text-sm text-gray-500 bg-white border border-gray-200 rounded-xl">No categories found.</div>
        ) : (
          filteredCategories.map((category) => (
            <div key={category._id} className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
              <div className="flex items-start gap-3">
                <img src={category.image} alt={category.name} className="object-cover w-14 h-14 border rounded-lg" />
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{category.name}</h3>
                  <p className="text-xs text-gray-500 truncate">Slug: {category.slug}</p>
                  <p className="mt-1 text-xs text-gray-500">{category.description || "No description"}</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${category.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
                  {category.isActive ? "Active" : "Inactive"}
                </span>
                <span className="text-xs font-semibold text-gray-700">Products: {category.productCount || 0}</span>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => openEdit(category)} className="inline-flex items-center justify-center flex-1 gap-1 px-3 py-2 text-sm font-semibold text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100">
                  <FaEdit /> Edit
                </button>
                <button
                  onClick={() => handleDelete(category._id, category.productCount || 0)}
                  className="inline-flex items-center justify-center flex-1 gap-1 px-3 py-2 text-sm font-semibold text-red-700 bg-red-50 rounded-lg hover:bg-red-100"
                >
                  <FaTrash /> Delete
                </button>
              </div>
              <p className="mt-2 text-[11px] text-gray-400">Category ID: {category._id}</p>
            </div>
          ))
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-xl bg-white border border-gray-200 rounded-2xl shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">{editingId ? "Edit Category" : "Create Category"}</h3>
              <button onClick={closeForm} className="p-2 text-gray-500 rounded-lg hover:bg-gray-100">
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">Category Name</label>
                <input
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">Description</label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">Sort Order</label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData((prev) => ({ ...prev, sortOrder: Number(e.target.value) }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={String(formData.isActive)}
                    onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.value === "true" }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">Category Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormData((prev) => ({ ...prev, imageFile: e.target.files?.[0] || null }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={closeForm} className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-70">
                  {saving ? "Saving..." : editingId ? "Update Category" : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategoryManagement;


