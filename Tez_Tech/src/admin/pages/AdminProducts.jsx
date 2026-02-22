import { useState, useEffect } from "react";
import axios from "axios";
import { FaPlus, FaTrash, FaEdit, FaCloudUploadAlt, FaTimes, FaBox, FaSearch } from "react-icons/fa";

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    brand: "",
    stock: 0,
    imageFile: null,
  });

  const token = localStorage.getItem("token");
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/products");
      if (res.data.success) setProducts(res.data.products);
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleEditClick = (product) => {
    setIsEditing(true);
    setShowForm(true);
    setCurrentId(product._id);
    setFormData({
      name: product.name || "",
      description: product.description || "",
      price: product.price || "",
      category: product.category || "",
      brand: product.brand || "",
      stock: product.stock ?? 0,
      imageFile: null,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const data = new FormData();
    data.append("name", formData.name);
    data.append("description", formData.description);
    data.append("price", formData.price);
    data.append("category", formData.category);
    data.append("brand", formData.brand);
    data.append("stock", String(formData.stock));

    if (formData.imageFile) {
      data.append("image", formData.imageFile);
    }

    try {
      if (isEditing) {
        await axios.put(`http://localhost:5000/api/products/${currentId}`, data, config);
        alert("🎉 Product Updated Successfully!");
      } else {
        await axios.post("http://localhost:5000/api/products", data, config);
        alert("🎉 Product Added Successfully!");
      }
      resetForm();
      fetchProducts();
    } catch (error) {
      alert(error.response?.data?.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setIsEditing(false);
    setCurrentId(null);
    setFormData({ name: "", description: "", price: "", category: "", brand: "", stock: 0, imageFile: null });
  };

  const handleDelete = async (id) => {
    if (window.confirm("⚠️ Are you sure you want to delete this product?")) {
      try {
        await axios.delete(`http://localhost:5000/api/products/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchProducts();
      } catch (error) {
        alert("Delete failed");
      }
    }
  };

  const filteredProducts = products.filter(p =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.brand?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="mx-auto space-y-6 font-sans max-w-7xl">
      
      {/* 🌟 Header & Actions */}
      <div className="flex flex-col items-start justify-between gap-4 p-6 bg-white border border-gray-100 shadow-sm sm:flex-row sm:items-center rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 text-xl text-blue-600 bg-blue-50 rounded-xl">
            <FaBox />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Inventory List</h2>
            <p className="text-sm text-gray-500">Manage your products and stock</p>
          </div>
        </div>

        <div className="flex flex-col w-full gap-3 sm:flex-row sm:w-auto">
          {/* Search Bar */}
          <div className="relative">
            <FaSearch className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
            <input 
              type="text" 
              placeholder="Search products..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-2 pl-10 pr-4 text-sm transition-all border border-gray-200 sm:w-64 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>
          
          {/* Toggle Form Button */}
          <button 
            onClick={() => (isEditing ? resetForm() : setShowForm(!showForm))}
            className={`flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
              showForm 
                ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-100" 
                : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-500/30"
            }`}
          >
            {showForm ? <><FaTimes /> Cancel</> : <><FaPlus /> Add Product</>}
          </button>
        </div>
      </div>

      {/* 📝 Add/Edit Form Card */}
      {showForm && (
        <div className="p-6 bg-white border border-gray-100 shadow-lg sm:p-8 rounded-2xl animate-fade-in-down">
          <div className="pb-4 mb-6 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">{isEditing ? "Edit Product Details" : "Add New Product"}</h3>
            <p className="text-sm text-gray-500">Fill in the information below to {isEditing ? "update the" : "create a new"} product.</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-700">Product Name <span className="text-red-500">*</span></label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
              </div>
              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-700">Brand <span className="text-red-500">*</span></label>
                <input type="text" value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} required className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
              </div>
              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-700">Category <span className="text-red-500">*</span></label>
                <input type="text" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} required className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
              </div>
              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-700">Price (₹) <span className="text-red-500">*</span></label>
                <input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
              </div>
              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-700">Stock Quantity <span className="text-red-500">*</span></label>
                <input type="number" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} required className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
              </div>
              
              {/* Premium Image Upload */}
              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-700">Product Image</label>
                <div className="relative">
                  <input id="file-upload" type="file" hidden onChange={(e) => setFormData({ ...formData, imageFile: e.target.files[0] })} />
                  <label htmlFor="file-upload" className="flex items-center justify-center gap-2 w-full px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 bg-gray-50 hover:bg-gray-100 hover:border-blue-400 cursor-pointer transition-all">
                    <FaCloudUploadAlt className="text-lg text-blue-500" />
                    <span className="text-sm truncate">{formData.imageFile ? formData.imageFile.name : "Choose an image..."}</span>
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label className="block mb-2 text-sm font-semibold text-gray-700">Description <span className="text-red-500">*</span></label>
              <textarea rows="3" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required className="w-full px-4 py-3 transition-all border border-gray-200 resize-y rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
            </div>

            <div className="flex justify-end pt-2">
              <button 
                type="submit" 
                disabled={loading}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-2.5 px-8 rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? "Processing..." : (isEditing ? "Update Product" : "Save Product")}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 📊 Data Table */}
      <div className="overflow-hidden bg-white border border-gray-100 shadow-sm rounded-2xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-6 py-4 text-xs font-bold tracking-wider text-gray-500 uppercase">Image</th>
                <th className="px-6 py-4 text-xs font-bold tracking-wider text-gray-500 uppercase">Product Info</th>
                <th className="hidden px-6 py-4 text-xs font-bold tracking-wider text-gray-500 uppercase md:table-cell">Brand & Category</th>
                <th className="hidden px-6 py-4 text-xs font-bold tracking-wider text-gray-500 uppercase lg:table-cell">Description</th>
                <th className="px-6 py-4 text-xs font-bold tracking-wider text-gray-500 uppercase">Price & Stock</th>
                <th className="px-6 py-4 text-xs font-bold tracking-wider text-center text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredProducts.map((p) => (
                <tr key={p._id} className="transition-colors hover:bg-gray-50/50 group">
                  
                  {/* Image */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-center p-1 overflow-hidden bg-white border border-gray-100 rounded-lg w-14 h-14">
                      <img src={p.image || "https://placehold.co/100x100/f3f4f6/a1a1aa?text=No+Img"} className="object-contain w-full h-full mix-blend-multiply" alt={p.name} />
                    </div>
                  </td>
                  
                  {/* Name */}
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-gray-900">{p.name}</div>
                    <div className="mt-1 text-xs text-gray-500 md:hidden">{p.brand} • {p.category}</div>
                  </td>
                  
                  {/* Brand & Category (Hidden on small screens) */}
                  <td className="hidden px-6 py-4 md:table-cell">
                    <div className="flex flex-col items-start gap-1.5">
                      <span className="px-2.5 py-1 text-xs font-semibold bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100">{p.brand}</span>
                      <span className="px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-md border border-gray-200">{p.category}</span>
                    </div>
                  </td>
                  
                  {/* Description (Truncated) */}
                  <td className="hidden px-6 py-4 lg:table-cell">
                    <div className="max-w-xs text-sm text-gray-600 line-clamp-2" title={p.description}>
                      {p.description}
                    </div>
                  </td>
                  
                  {/* Price & Stock */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-extrabold text-gray-900">₹{p.price?.toLocaleString('en-IN')}</div>
                    <div className="mt-1.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                        p.stock < 10 ? "bg-red-50 text-red-600 border border-red-100" : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                      }`}>
                        {p.stock < 10 ? "Low Stock: " : "In Stock: "} {p.stock}
                      </span>
                    </div>
                  </td>
                  
                  {/* Actions */}
                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-2 transition-opacity opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                      <button onClick={() => handleEditClick(p)} className="p-2 text-blue-600 transition-colors rounded-lg bg-blue-50 hover:bg-blue-600 hover:text-white" title="Edit">
                        <FaEdit />
                      </button>
                      <button onClick={() => handleDelete(p._id)} className="p-2 text-red-600 transition-colors rounded-lg bg-red-50 hover:bg-red-600 hover:text-white" title="Delete">
                        <FaTrash />
                      </button>
                    </div>
                  </td>

                </tr>
              ))}
              
              {/* Empty State */}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-gray-100 rounded-full">
                      <FaBox className="text-2xl text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No products found</h3>
                    <p className="mt-1 text-gray-500">Try adjusting your search or add a new product.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminProducts;