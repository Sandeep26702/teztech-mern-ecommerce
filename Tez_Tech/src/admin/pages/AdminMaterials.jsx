import { useState, useEffect } from "react";
import { FaCubes, FaPlus, FaExclamationTriangle, FaEdit, FaCheck } from "react-icons/fa";
import { toast } from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import api from "../../utils/api";

const AdminMaterials = () => {
  const { user } = useAuth();
  const userRole = user?.role?.toLowerCase() || "";

  const [materials, setMaterials] = useState([]);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Creation Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [stock, setStock] = useState("");
  const [minStockLimit, setMinStockLimit] = useState("5");
  const [unit, setUnit] = useState("rolls");
  const [submitting, setSubmitting] = useState(false);

  // Edit Stock Inline/Modal
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [editingStock, setEditingStock] = useState("");
  const [editingLimit, setEditingLimit] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const res = await api.get("/materials");
      if (res.data.success) {
        setMaterials(res.data.materials || []);
        setLowStockAlerts(res.data.lowStockAlerts || []);
      }
    } catch (err) {
      toast.error("Failed to load materials");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMaterial = async (e) => {
    e.preventDefault();
    if (!name || !sku) {
      toast.error("Name and SKU are required!");
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post("/materials", {
        name,
        sku,
        stock: Number(stock) || 0,
        minStockLimit: Number(minStockLimit) || 5,
        unit,
      });
      if (res.data.success) {
        toast.success("Raw material entry created successfully!");
        setName("");
        setSku("");
        setStock("");
        setMinStockLimit("5");
        setUnit("rolls");
        setShowCreateModal(false);
        fetchMaterials();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create material");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateMaterial = async (e) => {
    e.preventDefault();
    if (!editingStock || !editingLimit) {
      toast.error("Stock and alert limit are required!");
      return;
    }
    setUpdating(true);
    try {
      const res = await api.put(`/materials/${editingMaterial._id}`, {
        stock: Number(editingStock),
        minStockLimit: Number(editingLimit),
      });
      if (res.data.success) {
        toast.success("Stock level updated!");
        setEditingMaterial(null);
        fetchMaterials();
      }
    } catch (err) {
      toast.error("Failed to update stock");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="p-6 bg-white border border-slate-100 shadow-sm rounded-2xl">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FaCubes className="text-blue-600" /> Material Inventory Control
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Monitor raw sheet roll stocks (HDPE & PP) and track automatic purchasing alerts.
          </p>
        </div>
        {["admin", "subadmin", "purchase"].includes(userRole) && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition cursor-pointer shadow-md"
          >
            <FaPlus /> Add Material SKU
          </button>
        )}
      </div>

      {/* Low Stock Alert Panel */}
      {lowStockAlerts.length > 0 && (
        <div className="p-5 bg-red-50 border border-red-200 rounded-2xl mb-8 flex flex-col md:flex-row md:items-center gap-4 animate-pulse">
          <div className="flex-shrink-0 w-12 h-12 bg-red-100 border border-red-200 text-red-700 rounded-full flex items-center justify-center text-xl">
            <FaExclamationTriangle />
          </div>
          <div>
            <h4 className="font-extrabold text-red-900 text-base">LOW STOCK WARNING: Action Needed</h4>
            <p className="text-xs text-red-700 mt-1">
              The following raw materials are below their minimum threshold limit. Please place supply orders.
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {lowStockAlerts.map((item) => (
                <span
                  key={item._id}
                  className="px-2.5 py-0.5 text-xs font-bold bg-white text-red-700 border border-red-200 rounded-md shadow-sm"
                >
                  ⚠️ {item.name}: {item.stock} {item.unit} left (Min: {item.minStockLimit})
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Materials List */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">Loading inventory list...</div>
      ) : materials.length === 0 ? (
        <div className="py-16 text-center text-slate-400 border border-dashed rounded-2xl border-slate-200">
          No raw materials registered in the inventory.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-xs tracking-wider text-slate-500 uppercase border-b border-slate-200 bg-slate-50">
                <th className="p-4 font-semibold">Material Item</th>
                <th className="p-4 font-semibold">SKU Code</th>
                <th className="p-4 font-semibold">Current Stock</th>
                <th className="p-4 font-semibold">Alert Limit</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {materials.map((item) => {
                const isLow = item.stock < item.minStockLimit;
                return (
                  <tr key={item._id} className="hover:bg-slate-50/50 transition">
                    <td className="p-4">
                      <div className="font-bold text-slate-800 text-sm">{item.name}</div>
                      <div className="text-xs text-slate-400">{item.unit} based unit</div>
                    </td>
                    <td className="p-4 font-mono text-xs">{item.sku}</td>
                    <td className="p-4">
                      <span className={`font-extrabold text-sm ${isLow ? "text-red-600" : "text-green-600"}`}>
                        {item.stock} {item.unit}
                      </span>
                    </td>
                    <td className="p-4 text-xs font-semibold text-slate-500">
                      {item.minStockLimit} {item.unit}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-0.5 text-[10px] font-bold border rounded-full uppercase ${
                          isLow
                            ? "bg-red-50 text-red-700 border-red-200"
                            : "bg-green-50 text-green-700 border-green-200"
                        }`}
                      >
                        {isLow ? "Low stock" : "In stock"}
                      </span>
                    </td>
                    <td className="p-4">
                      {["admin", "subadmin", "purchase"].includes(userRole) ? (
                        <button
                          onClick={() => {
                            setEditingMaterial(item);
                            setEditingStock(String(item.stock));
                            setEditingLimit(String(item.minStockLimit));
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-lg transition-colors cursor-pointer"
                        >
                          <FaEdit /> Update Stock
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No permission</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 mx-4">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Add Raw Material SKU</h3>
            <form onSubmit={handleCreateMaterial} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-550 mb-1">Material Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1mm HDPE Sheet Roll"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-550 mb-1">SKU Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MAT-HDPE-1MM"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-550 mb-1">Measurement Unit</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none text-slate-800"
                  >
                    <option value="rolls">rolls</option>
                    <option value="sheets">sheets</option>
                    <option value="kg">kg</option>
                    <option value="meters">meters</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-550 mb-1">Initial Stock</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 10"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-550 mb-1">Alert threshold limit</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 5"
                    value={minStockLimit}
                    onChange={(e) => setMinStockLimit(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-bold text-slate-600 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {submitting ? "Saving..." : "Add SKU"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-2xl border border-slate-100 mx-4">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Update Stock: {editingMaterial.name}</h3>
            <p className="text-xs text-slate-400 mb-4">SKU: {editingMaterial.sku}</p>
            <form onSubmit={handleUpdateMaterial} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-550 mb-1">Current Stock ({editingMaterial.unit}) *</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={editingStock}
                  onChange={(e) => setEditingStock(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-550 mb-1">Minimum Alert threshold *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={editingLimit}
                  onChange={(e) => setEditingLimit(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingMaterial(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-bold text-slate-600 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {updating ? "Saving..." : "Update Details"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMaterials;
