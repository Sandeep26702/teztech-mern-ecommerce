import { useState, useEffect } from "react";
import { FaGift, FaCheck, FaSearch } from "react-icons/fa";
import { toast } from "react-hot-toast";
import api from "../../utils/api";

const AdminPacking = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      // Fetch orders. We filter on frontend or send specific query.
      const res = await api.get("/admin/orders");
      if (res.data.success) {
        // Filter orders that are ready for packing (productionStatus complete, packingStatus awaiting)
        const packingQueue = (res.data.orders || []).filter(
          (o) => o.productionStatus === "Completed" && o.packingStatus === "Awaiting Packing"
        );
        setOrders(packingQueue);
      }
    } catch (err) {
      toast.error("Failed to load packing orders queue");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPacked = async (orderId) => {
    try {
      const res = await api.put(`/orders/admin/pack/${orderId}`);
      if (res.data.success) {
        toast.success("Order marked as packed! Sent to Dispatch queue.");
        setOrders((prev) => prev.filter((o) => o._id !== orderId));
      }
    } catch (err) {
      toast.error("Failed to update packing status");
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
            <FaGift className="text-blue-600" /> Packing Queue
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            List of laser-completed custom orders awaiting final quality inspection and box packing.
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
        <div className="py-16 text-center text-slate-400">Loading packing queue...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="py-16 text-center text-slate-400 border border-dashed rounded-2xl border-slate-200">
          No orders waiting in the packing queue.
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
                  <span className="px-2 py-0.5 text-[9px] font-bold bg-green-50 text-green-700 border border-green-200 rounded-full uppercase">
                    Laser Done
                  </span>
                </div>

                <div className="mt-3 text-xs text-slate-700 space-y-2">
                  <p><span className="text-slate-400 font-bold block">Customer:</span> <span className="font-semibold text-slate-800">{order.shippingInfo?.fullName}</span></p>
                  <div>
                    <span className="text-slate-400 font-bold block">Box Items Checklist:</span>
                    <ul className="mt-1 bg-slate-50 p-2.5 rounded border border-slate-100 space-y-1">
                      {order.items?.map((item, idx) => (
                        <li key={idx} className="font-semibold text-slate-800 flex justify-between">
                          <span>✓ {item.name} {item.size ? `(${item.size})` : ""}</span>
                          <span className="text-blue-650 font-extrabold">Qty: {item.quantity}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleMarkPacked(order._id)}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-sm"
              >
                <FaCheck /> Mark Box Packed & Ready
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPacking;
