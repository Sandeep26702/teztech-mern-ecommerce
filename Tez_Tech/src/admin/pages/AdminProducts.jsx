import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { FaSearch, FaFileImport, FaSyncAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

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
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-indigo-700 border border-indigo-200 bg-indigo-50 rounded-xl hover:bg-indigo-100"
            >
              <FaSyncAlt /> Refresh
            </button>
            <button
              onClick={() => navigate("/admin/products/csv-management")}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700"
            >
              <FaFileImport /> Upload CSV Catalog
            </button>
          </div>
        </div>

        <div className="relative max-w-xl mt-5">
          <FaSearch className="absolute text-gray-400 -translate-y-1/2 left-3 top-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, SKU, or tags"
            className="w-full py-2.5 pl-10 pr-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition shadow-sm"
          />
        </div>
      </div>

      <div className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Catalog</h2>
            <p className="text-sm text-gray-500">Showing {filteredProducts.length} products</p>
          </div>
        </div>

        <div className="overflow-x-auto min-h-[240px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <div className="w-10 h-10 mb-3 border-4 rounded-full border-emerald-500 border-t-transparent animate-spin" />
              <p>Loading products...</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-xs tracking-wide text-gray-600 uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-3 font-semibold text-left">Image</th>
                  <th className="px-6 py-3 font-semibold text-left">Product</th>
                  <th className="px-6 py-3 font-semibold text-left">SKU</th>
                  <th className="px-6 py-3 font-semibold text-left">Selling Price</th>
                  <th className="px-6 py-3 font-semibold text-left">Stock</th>
                  <th className="px-6 py-3 font-semibold text-left">Status</th>
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

                  return (
                    <tr 
                      key={product._id} 
                      onClick={() => navigate(`/product/${product._id}`)}
                      className="transition cursor-pointer hover:bg-gray-100"
                    >
                      <td className="px-6 py-3">
                        <div className="flex items-center justify-center w-12 h-12 overflow-hidden bg-white border border-gray-200 rounded-lg">
                          <img src={imageUrl} alt={product.name} className="object-contain w-full h-full" />
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <p className="font-semibold text-gray-900">{product.name}</p>
                        <p className="max-w-xs text-xs text-gray-500 line-clamp-1">
                          {product.categoryPath || product.category || "Uncategorized"}
                        </p>
                      </td>
                      <td className="px-6 py-3 font-mono text-gray-700">{product.sku || "--"}</td>
                      <td className="px-6 py-3 font-semibold text-gray-800">
                        Rs. {Number(sellingPrice).toLocaleString("en-IN")}
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                            Number(product.stock) === 0
                              ? "bg-red-100 text-red-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {product.stock ?? 0}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // Row click ko rokne ke liye
                            handleStatusToggle(product);
                          }}
                          disabled={updatingId === product._id}
                          className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-full border transition ${
                            isActive
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                              : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200"
                          }`}
                        >
                          <span
                            className={`inline-flex w-2 h-2 rounded-full ${
                              isActive ? "bg-emerald-500" : "bg-gray-400"
                            }`}
                          />
                          {updatingId === product._id ? "Updating..." : isActive ? "Active" : "Hidden"}
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {!loading && filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-16 text-center text-gray-500">
                      No products found.
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