import { useState, useEffect } from "react";
import { FaTruck, FaSearch, FaClipboard, FaPlus } from "react-icons/fa";
import { toast } from "react-hot-toast";
import api from "../../utils/api";

const AdminDispatch = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [shippingProviders, setShippingProviders] = useState([]);

  // Shipping Modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [courierPartner, setCourierPartner] = useState("");
  const [trackingId, setTrackingId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchOrders();
    fetchProviders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/orders");
      if (res.data.success) {
        // Filter orders that are packed and awaiting dispatch
        const dispatchQueue = (res.data.orders || []).filter(
          (o) => o.packingStatus === "Packed" && o.dispatchStatus === "Awaiting Dispatch"
        );
        setOrders(dispatchQueue);
      }
    } catch (err) {
      toast.error("Failed to load dispatch queue");
    } finally {
      setLoading(false);
    }
  };

  const fetchProviders = async () => {
    try {
      const res = await api.get("/shipping");
      if (res.data.success) {
        setShippingProviders(res.data.providers || []);
      }
    } catch (err) {
      console.error("Error fetching shipping providers:", err);
    }
  };

  const handleShipOrder = async (e) => {
    e.preventDefault();
    if (!courierPartner || !trackingId) {
      toast.error("Courier Partner and AWB (Tracking ID) are required!");
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.put(`/orders/admin/ship/${selectedOrder._id}`, {
        courierPartner,
        trackingId,
      });
      if (res.data.success) {
        toast.success("Order dispatched! Tracking details logged.");
        setOrders((prev) => prev.filter((o) => o._id !== selectedOrder._id));
        setSelectedOrder(null);
        setCourierPartner("");
        setTrackingId("");
        fetchOrders();
      }
    } catch (err) {
      toast.error("Failed to dispatch order");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredOrders = orders.filter(
    (o) =>
      o.orderCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.shippingInfo?.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 bg-white border border-slate-100 shadow-sm rounded-2xl">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FaTruck className="text-blue-600" /> Dispatch Queue
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Assign courier logistics and register shipment AWB tracking codes for packed boxes.
          </p>
        </div>
        <div className="relative w-full md:w-80">
          <FaSearch className="absolute text-slate-400 -translate-y-1/2 left-3 top-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by client or Order ID..."
            className="w-full py-2.5 pl-10 pr-4 text-sm border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">Loading dispatch queue...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="py-16 text-center text-slate-400 border border-dashed rounded-2xl border-slate-200">
          No orders waiting in the dispatch queue.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredOrders.map((order) => (
            <div
              key={order._id}
              className="p-5 border border-slate-100 bg-white shadow-sm rounded-2xl flex flex-col justify-between space-y-4 hover:border-blue-100 transition"
            >
              <div>
                <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wide">
                      {order.orderCode}
                    </span>
                    <span className="text-[10px] text-slate-400 ml-2">
                      ({new Date(order.createdAt).toLocaleDateString()})
                    </span>
                  </div>
                  <span className="px-2 py-0.5 text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200 rounded-full uppercase">
                    Packed
                  </span>
                </div>

                <div className="mt-3 text-xs text-slate-700 space-y-2">
                  <p><span className="text-slate-400 font-bold block">Consignee:</span> <span className="font-semibold text-slate-800">{order.shippingInfo?.fullName}</span></p>
                  <p><span className="text-slate-400 font-bold block">Destination:</span> <span className="font-semibold text-slate-800">{order.shippingInfo?.city}, {order.shippingInfo?.pincode} ({order.shippingInfo?.state})</span></p>
                  <p><span className="text-slate-400 font-bold block">Total Weight / Package:</span> <span className="font-semibold text-slate-800">{order.shippingWeightKg || 1} kg</span></p>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedOrder(order);
                  setCourierPartner(order.courierPartner || "");
                }}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-sm"
              >
                <FaTruck /> Ship Order & Assign AWB
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Dispatch Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 mx-4">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Ship Order: {selectedOrder.orderCode}</h3>
            <p className="text-xs text-slate-400 mb-4">Consignee: {selectedOrder.shippingInfo?.fullName}</p>
            <form onSubmit={handleShipOrder} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-550 mb-1">Courier Partner *</label>
                <select
                  required
                  value={courierPartner}
                  onChange={(e) => setCourierPartner(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none text-slate-800 font-medium"
                >
                  <option value="">Select courier partner</option>
                  <option value="Delhivery">Delhivery</option>
                  <option value="BlueDart">BlueDart</option>
                  <option value="DTDC">DTDC</option>
                  <option value="Trackon">Trackon</option>
                  <option value="Speed Post">Speed Post</option>
                  {shippingProviders.map((p) => (
                    <option key={p._id} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-550 mb-1">AWB / tracking ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AWB12389472"
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 font-semibold"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedOrder(null);
                    setCourierPartner("");
                    setTrackingId("");
                  }}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-bold text-slate-600 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {submitting ? "Shipping..." : "Dispatch Shipment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDispatch;
