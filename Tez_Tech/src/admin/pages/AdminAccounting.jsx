import { useState, useEffect } from "react";
import { FaCalculator, FaSyncAlt, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";
import { toast } from "react-hot-toast";
import api from "../../utils/api";

const AdminAccounting = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reSyncingId, setReSyncingId] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/orders");
      if (res.data.success) {
        // Find orders that are Paid (Approved payments) and thus have a syncStatus
        const syncedList = (res.data.orders || []).filter(
          (o) => o.paymentStatus === "Paid"
        );
        setOrders(syncedList);
      }
    } catch (err) {
      toast.error("Failed to load accounting logs queue");
    } finally {
      setLoading(false);
    }
  };

  const handleReSync = async (orderId) => {
    setReSyncingId(orderId);
    try {
      // Direct updateOrderStatus to "Paid" triggers the background sync
      const res = await api.put(`/admin/orders/${orderId}/status`, { paymentStatus: "Paid" });
      if (res.data.success) {
        toast.success("Sync re-triggered! Updates will log in the background.");
        setTimeout(() => {
          fetchOrders();
          setReSyncingId(null);
        }, 800);
      }
    } catch (err) {
      toast.error("Failed to re-trigger sync");
      setReSyncingId(null);
    }
  };

  return (
    <div className="p-6 bg-white border border-slate-100 shadow-sm rounded-2xl">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FaCalculator className="text-blue-600" /> Accounting Automation Logs
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            View live synchronization events for Zoho Books ledgers and Google Sheets sales tracking data.
          </p>
        </div>
      </div>

      {/* Sync Table */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">Loading accounting logs...</div>
      ) : orders.length === 0 ? (
        <div className="py-16 text-center text-slate-400 border border-dashed rounded-2xl border-slate-200">
          No paid orders logged in the accounting database yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-xs tracking-wider text-slate-500 uppercase border-b border-slate-200 bg-slate-50">
                <th className="p-4 font-semibold">Order</th>
                <th className="p-4 font-semibold">Amount</th>
                <th className="p-4 font-semibold">Zoho Books</th>
                <th className="p-4 font-semibold">Google Sheets</th>
                <th className="p-4 font-semibold">Last Synced</th>
                <th className="p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
              {orders.map((order) => {
                const isZohoSuccess = order.syncStatus?.zoho?.toLowerCase().includes("success");
                const isSheetsSuccess = order.syncStatus?.googleSheets?.toLowerCase().includes("success");

                return (
                  <tr key={order._id} className="hover:bg-slate-50/50 transition">
                    <td className="p-4">
                      <span className="font-bold text-slate-900 text-sm block">{order.orderCode}</span>
                      <span className="text-[10px] text-slate-400">{order.shippingInfo?.fullName}</span>
                    </td>
                    <td className="p-4 font-bold text-slate-800">
                      ₹ {order.totalAmount?.toLocaleString("en-IN")}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold border rounded-full ${
                          isZohoSuccess
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-red-50 text-red-700 border-red-200"
                        }`}
                      >
                        {isZohoSuccess ? <FaCheckCircle /> : <FaExclamationCircle />}
                        {order.syncStatus?.zoho || "Not Synced"}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold border rounded-full ${
                          isSheetsSuccess
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-red-50 text-red-700 border-red-200"
                        }`}
                      >
                        {isSheetsSuccess ? <FaCheckCircle /> : <FaExclamationCircle />}
                        {order.syncStatus?.googleSheets || "Not Synced"}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 font-medium">
                      {order.syncStatus?.syncedAt
                        ? new Date(order.syncStatus.syncedAt).toLocaleString()
                        : "—"}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleReSync(order._id)}
                        disabled={reSyncingId === order._id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-650 hover:text-white rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <FaSyncAlt className={reSyncingId === order._id ? "animate-spin" : ""} />
                        Re-sync
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminAccounting;
