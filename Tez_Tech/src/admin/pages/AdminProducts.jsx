import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { FaSearch, FaFileImport, FaSyncAlt, FaExternalLinkAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = "https://sonani-backend.onrender.com/api";

const normalizeText = (value = "") => String(value || "").trim().toLowerCase();

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/products/admin`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setProducts(res.data.products || []);
      }
    } catch (error) {
      console.error("Admin products fetch error:", error);
      alert("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredProducts = useMemo(() => {
    const q = normalizeText(search);
    if (!q) return products;
    return products.filter((product) => {
      const text = [
        product?.name,
        product?.sku,
        Array.isArray(product?.searchTags) ? product.searchTags.join(" ") : "",
      ]
        .map((value) => normalizeText(value))
        .join(" ");
      return text.includes(q);
    });
  }, [products, search]);

  const handleStatusToggle = async (product) => {
    const nextStatus = normalizeText(product?.status) === "active" ? "Hidden" : "Active";
    try {
      setUpdatingId(product._id);
      const res = await axios.patch(
        `${API_BASE_URL}/products/${product._id}/status`,
        { status: nextStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setProducts((prev) =>
          prev.map((item) => (item._id === product._id ? { ...item, status: nextStatus } : item))
        );
      }
    } catch (error) {
      console.error("Status update failed:", error);
      alert("Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="mx-auto space-y-6 font-sans max-w-7xl">
      {/* Header Section */}
      <div className="p-6 bg-white border border-gray-200 shadow-sm rounded-2xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Product List</h1>
            <p className="mt-1 text-sm text-gray-600">
              View catalog, toggle Active/Hidden, and manage availability.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={loadProducts}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-indigo-700 transition-colors border border-indigo-200 bg-indigo-50 rounded-xl hover:bg-indigo-100"
            >
              <FaSyncAlt /> Refresh
            </button>
            <button
              onClick={() => navigate("/admin/products/csv-management")}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white transition-colors shadow-sm bg-emerald-600 rounded-xl hover:bg-emerald-700"
            >
              <FaFileImport /> Upload CSV Catalog
            </button>
          </div>
        </div>

        <div className="relative max-w-xl mt-6">
          <FaSearch className="absolute text-gray-400 -translate-y-1/2 left-4 top-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, SKU, or tags..."
            className="w-full py-2.5 pl-11 pr-4 text-sm border border-gray-300 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition shadow-sm bg-gray-50/50"
          />
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/30">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Catalog</h2>
            <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase mt-0.5">Showing {filteredProducts.length} products</p>
          </div>
        </div>

        <div className="overflow-x-auto min-h-[240px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <div className="w-10 h-10 mb-3 border-4 rounded-full border-emerald-500 border-t-transparent animate-spin" />
              <p className="font-medium text-gray-500">Loading products...</p>
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs tracking-wider text-gray-500 uppercase border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-6 py-4 font-bold">Image</th>
                  <th className="px-6 py-4 font-bold">Product Details</th>
                  <th className="px-6 py-4 font-bold">SKU</th>
                  <th className="px-6 py-4 font-bold">Selling Price</th>
                  <th className="px-6 py-4 font-bold">Stock</th>
                  <th className="px-6 py-4 font-bold">Visibility</th>
                  <th className="px-6 py-4 font-bold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((product) => {
                  const isActive = normalizeText(product.status) === "active";
                  const imageUrl =
                    product?.images?.[0] ||
                    product?.image ||
                    "https://placehold.co/100x100/f3f4f6/a1a1aa?text=No+Img";
                  const sellingPrice = product?.sellingPrice ?? product?.price ?? 0;
                  const productId = product._id || product.id; // Safe ID check

                  return (
                    <tr 
                      key={productId} 
                      className="transition-colors hover:bg-blue-50/30"
                    >
                      <td className="px-6 py-3">
                        <div className="flex items-center justify-center w-12 h-12 overflow-hidden bg-white border border-gray-200 rounded-lg shadow-sm">
                          <img src={imageUrl} alt={product.name} className="object-contain w-full h-full p-1 mix-blend-multiply" />
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <p className="font-bold text-gray-900 line-clamp-1">{product.name}</p>
                        <p className="max-w-xs text-xs font-medium text-gray-500 line-clamp-1 mt-0.5">
                          {product.categoryPath || product.category?.name || product.category || "Uncategorized"}
                        </p>
                      </td>
                      <td className="px-6 py-3">
                        <span className="px-2 py-1 text-xs font-bold text-gray-600 bg-gray-100 border border-gray-200 rounded-md whitespace-nowrap">
                          {product.sku || product.baseSku || "--"}
                        </span>
                      </td>
                      <td className="px-6 py-3 font-black text-gray-800">
                        ₹{Number(sellingPrice).toLocaleString("en-IN")}
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-wide ${
                            Number(product.stock) === 0
                              ? "bg-red-50 text-red-600 border border-red-200"
                              : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                          }`}
                        >
                          {Number(product.stock) === 0 ? "Out of Stock" : `${product.stock} in stock`}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <button
                          onClick={() => handleStatusToggle(product)}
                          disabled={updatingId === productId}
                          className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                            isActive
                              ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100 focus:ring-green-500"
                              : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200 focus:ring-gray-400"
                          }`}
                        >
                          <span
                            className={`inline-flex w-2 h-2 rounded-full ${
                              isActive ? "bg-green-500" : "bg-gray-400"
                            }`}
                          />
                          {updatingId === productId ? "..." : isActive ? "Active" : "Hidden"}
                        </button>
                      </td>
                      <td className="px-6 py-3 text-center">
                        {/* 🟢 NEW: Dedicated View Button */}
                        <button
                          onClick={() => navigate(`/product/${productId}`)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:text-blue-700 transition-colors whitespace-nowrap"
                          title="View Product Details"
                        >
                          <FaExternalLinkAlt size={10} /> View
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {!loading && filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <FaSearch className="mb-3 text-4xl text-gray-300" />
                        <p className="text-base font-bold text-gray-900">No products found.</p>
                        <p className="mt-1 text-sm text-gray-500">Try adjusting your search criteria.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminProducts;