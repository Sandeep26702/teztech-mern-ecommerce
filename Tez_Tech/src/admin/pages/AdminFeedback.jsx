import { useState, useEffect } from "react";
import { FaCommentAlt, FaStar, FaExclamationCircle, FaCheckCircle, FaExchangeAlt } from "react-icons/fa";
import { toast } from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import api from "../../utils/api";

const AdminFeedback = () => {
  const { user } = useAuth();
  const userRole = user?.role?.toLowerCase() || "";

  const [activeTab, setActiveTab] = useState(
    ["feedback tracking", "marketing"].includes(userRole) ? "record" : "sales-alerts"
  );
  
  const [deliveredOrders, setDeliveredOrders] = useState([]);
  const [feedbackTickets, setFeedbackTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Record Feedback Modal (Feedback Team)
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState("");
  const [status, setStatus] = useState("Satisfied");
  const [upsellOffered, setUpsellOffered] = useState(false);
  const [upsellProduct, setUpsellProduct] = useState("");
  const [upsellStatus, setUpsellStatus] = useState("No Offer");
  const [submitting, setSubmitting] = useState(false);

  // Resolve Ticket Modal (Sales Team)
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [salesUpsellOffered, setSalesUpsellOffered] = useState(false);
  const [salesUpsellProduct, setSalesUpsellProduct] = useState("");
  const [salesUpsellStatus, setSalesUpsellStatus] = useState("No Offer");
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    fetchDeliveredOrders();
    fetchFeedbackTickets();
  }, []);

  const fetchDeliveredOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/orders");
      if (res.data.success) {
        // Filter orders that are Delivered
        const delivered = (res.data.orders || []).filter((o) => o.orderStatus === "Delivered");
        setDeliveredOrders(delivered);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFeedbackTickets = async () => {
    try {
      const res = await api.get("/feedbacks");
      if (res.data.success) {
        setFeedbackTickets(res.data.feedbacks || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRecordFeedback = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post("/feedbacks", {
        orderId: selectedOrder._id,
        rating,
        comments,
        status: Number(rating) < 4 ? "Issue Reported" : status,
        upsellOffered,
        upsellProduct,
        upsellStatus,
      });
      if (res.data.success) {
        toast.success("Client feedback recorded successfully!");
        setSelectedOrder(null);
        setRating(5);
        setComments("");
        setStatus("Satisfied");
        setUpsellOffered(false);
        setUpsellProduct("");
        setUpsellStatus("No Offer");
        fetchDeliveredOrders();
        fetchFeedbackTickets();
      }
    } catch (err) {
      toast.error("Failed to save client feedback");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolveTicket = async (e) => {
    e.preventDefault();
    if (!resolutionNotes.trim()) {
      toast.error("Resolution notes are required!");
      return;
    }
    setResolving(true);
    try {
      const res = await api.put(`/feedbacks/${selectedTicket._id}/resolve`, {
        status: "Resolved",
        resolutionNotes,
        upsellOffered: salesUpsellOffered,
        upsellProduct: salesUpsellProduct,
        upsellStatus: salesUpsellStatus,
      });
      if (res.data.success) {
        toast.success("Feedback issue marked as resolved!");
        setSelectedTicket(null);
        setResolutionNotes("");
        setSalesUpsellOffered(false);
        setSalesUpsellProduct("");
        setSalesUpsellStatus("No Offer");
        fetchFeedbackTickets();
      }
    } catch (err) {
      toast.error("Failed to resolve ticket");
    } finally {
      setResolving(false);
    }
  };

  // Filter delivered orders that do NOT have a logged feedback ticket yet
  const pendingFeedbackOrders = deliveredOrders.filter(
    (order) => !feedbackTickets.some((ticket) => ticket.order?._id === order._id)
  );

  // Filter tickets for sales attention
  const activeAlertTickets = feedbackTickets.filter((t) => t.status === "Issue Reported");

  return (
    <div className="p-6 bg-white border border-slate-100 shadow-sm rounded-2xl">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FaCommentAlt className="text-blue-600" /> Post-Sales Feedback & Upselling
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Log quality ratings, resolve customer issues, and upsell leftovers (waterproof/non-tearable sheets).
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 pb-4 mb-6 border-b border-slate-100">
        <button
          onClick={() => setActiveTab("record")}
          className={`px-4 py-2 text-sm font-semibold rounded-xl border transition cursor-pointer ${
            activeTab === "record"
              ? "bg-blue-600 border-blue-600 text-white shadow-sm"
              : "bg-white border-slate-200 text-slate-650 hover:border-blue-200 hover:text-blue-600"
          }`}
        >
          📞 Call queue (Delivered Orders)
          <span className="ml-2 px-2 py-0.5 text-xs bg-slate-100 text-slate-650 rounded-full">
            {pendingFeedbackOrders.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("sales-alerts")}
          className={`px-4 py-2 text-sm font-semibold rounded-xl border transition cursor-pointer ${
            activeTab === "sales-alerts"
              ? "bg-blue-600 border-blue-600 text-white shadow-sm"
              : "bg-white border-slate-200 text-slate-650 hover:border-blue-200 hover:text-blue-600"
          }`}
        >
          🚨 Action Required: Feedback Tickets
          <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">
            {activeAlertTickets.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("all-history")}
          className={`px-4 py-2 text-sm font-semibold rounded-xl border transition cursor-pointer ${
            activeTab === "all-history"
              ? "bg-blue-600 border-blue-600 text-white shadow-sm"
              : "bg-white border-slate-200 text-slate-650 hover:border-blue-200 hover:text-blue-600"
          }`}
        >
          📋 History
          <span className="ml-2 px-2 py-0.5 text-xs bg-slate-100 text-slate-650 rounded-full">
            {feedbackTickets.length}
          </span>
        </button>
      </div>

      {/* Content tabs */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">Loading feedback lists...</div>
      ) : activeTab === "record" ? (
        // RECORD FEEDBACK QUEUE
        pendingFeedbackOrders.length === 0 ? (
          <div className="py-16 text-center text-slate-400 border border-dashed rounded-2xl border-slate-200">
            No recently delivered orders awaiting feedback call.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pendingFeedbackOrders.map((order) => (
              <div
                key={order._id}
                className="p-5 border border-slate-100 bg-white shadow-sm rounded-2xl flex flex-col justify-between space-y-4 hover:border-blue-100 transition"
              >
                <div>
                  <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                    <span className="text-xs font-bold text-blue-650 uppercase tracking-wide">
                      {order.orderCode}
                    </span>
                    <span className="text-[10px] text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full font-bold uppercase">
                      Delivered
                    </span>
                  </div>
                  <div className="mt-3 space-y-1.5 text-xs text-slate-700">
                    <p><span className="text-slate-400 font-bold block">Customer Details:</span> <span className="font-semibold text-slate-800 text-sm">{order.shippingInfo?.fullName}</span></p>
                    <p><span className="text-slate-400 font-bold block">Phone Number:</span> <span className="font-semibold text-slate-850">{order.shippingInfo?.phone}</span></p>
                    <p><span className="text-slate-400 font-bold block">Order Items:</span> <span className="font-semibold text-slate-800">{order.items?.map((i) => i.name).join(", ")}</span></p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedOrder(order)}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-sm"
                >
                  📞 Log Call & Feedback
                </button>
              </div>
            ))}
          </div>
        )
      ) : activeTab === "sales-alerts" ? (
        // SALES ALERTS QUEUE
        activeAlertTickets.length === 0 ? (
          <div className="py-16 text-center text-slate-400 border border-dashed rounded-2xl border-slate-200">
            No active feedback issues reported. Good job!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeAlertTickets.map((ticket) => (
              <div
                key={ticket._id}
                className="p-5 border border-red-100 bg-red-50/20 shadow-sm rounded-2xl flex flex-col justify-between space-y-4 hover:border-red-350 transition"
              >
                <div>
                  <div className="flex justify-between items-start border-b border-red-100 pb-3">
                    <span className="text-xs font-bold text-red-700 uppercase tracking-wide">
                      ⚠️ ISSUE REPORTED
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold">
                      Order: {ticket.order?.orderCode}
                    </span>
                  </div>
                  <div className="mt-3 space-y-2 text-xs text-slate-700">
                    <p><span className="text-slate-450 font-bold block">Client Name:</span> <span className="font-bold text-slate-900">{ticket.order?.shippingInfo?.fullName}</span></p>
                    <p>
                      <span className="text-slate-450 font-bold block">Issue Description:</span>
                      <span className="italic text-slate-800 bg-white p-2.5 rounded border border-slate-200 block mt-1">
                        "{ticket.comments || "No comment details logged"}"
                      </span>
                    </p>
                    <p className="flex items-center gap-1">
                      <span className="text-slate-450 font-bold">Rating Given:</span>
                      <span className="flex text-amber-500 font-semibold gap-0.5">
                        {Array.from({ length: ticket.rating }).map((_, i) => (
                          <FaStar key={i} />
                        ))}
                      </span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedTicket(ticket);
                    setSalesUpsellOffered(ticket.upsellOffered);
                    setSalesUpsellProduct(ticket.upsellProduct);
                    setSalesUpsellStatus(ticket.upsellStatus);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-sm"
                >
                  🔧 Resolve Complaint / Log Upsell
                </button>
              </div>
            ))}
          </div>
        )
      ) : (
        // HISTORY LIST
        feedbackTickets.length === 0 ? (
          <div className="py-16 text-center text-slate-400">No feedback history logged.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-xs tracking-wider text-slate-500 uppercase border-b border-slate-200 bg-slate-50">
                  <th className="p-4 font-semibold">Order</th>
                  <th className="p-4 font-semibold">Rating</th>
                  <th className="p-4 font-semibold">Comments</th>
                  <th className="p-4 font-semibold">Upselling Status</th>
                  <th className="p-4 font-semibold">Ticket Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
                {feedbackTickets.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-50/50 transition">
                    <td className="p-4 font-bold text-slate-800">{t.order?.orderCode || "N/A"}</td>
                    <td className="p-4">
                      <span className="flex text-amber-500">
                        {Array.from({ length: t.rating }).map((_, i) => (
                          <FaStar key={i} />
                        ))}
                      </span>
                    </td>
                    <td className="p-4 max-w-xs truncate" title={t.comments}>
                      {t.comments || <span className="text-slate-400 italic">No notes</span>}
                    </td>
                    <td className="p-4">
                      {t.upsellOffered ? (
                        <div>
                          <span className="px-1.5 py-0.5 bg-indigo-50 border border-indigo-150 text-indigo-750 font-bold rounded">
                            Offered: {t.upsellProduct || "Leftovers"}
                          </span>
                          <span className="block text-[10px] text-slate-400 mt-1 font-semibold">Result: {t.upsellStatus}</span>
                        </div>
                      ) : (
                        <span className="text-slate-450 italic">No Offer</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-0.5 text-[9px] font-bold border rounded-full uppercase ${
                          t.status === "Satisfied"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : t.status === "Resolved"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-red-50 text-red-700 border-red-200 animate-pulse"
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Record Call Feedback Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 mx-4">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Record Feedback Call</h3>
            <p className="text-xs text-slate-400 mb-4">Order Code: {selectedOrder.orderCode}</p>
            <form onSubmit={handleRecordFeedback} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-550 mb-1">Product Quality Rating *</label>
                <div className="flex gap-2 text-xl text-slate-300">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`cursor-pointer transition-colors ${
                        star <= rating ? "text-amber-500" : "hover:text-amber-400"
                      }`}
                    >
                      <FaStar />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-550 mb-1">Feedback Remarks</label>
                <textarea
                  rows="3"
                  required
                  placeholder="How was the product? Does the client report issues?"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 text-xs"
                />
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="upsellOffered"
                    checked={upsellOffered}
                    onChange={(e) => setUpsellOffered(e.target.checked)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                  />
                  <label htmlFor="upsellOffered" className="text-xs font-bold text-slate-700 cursor-pointer">
                    Upsell Leftover Materials? (Waterproof/Non-Tearable products)
                  </label>
                </div>
                {upsellOffered && (
                  <div className="grid grid-cols-1 gap-2">
                    <input
                      type="text"
                      placeholder="Product Details (e.g. Leftover HDPE waterproofing sheets)"
                      value={upsellProduct}
                      onChange={(e) => setUpsellProduct(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                    />
                    <select
                      value={upsellStatus}
                      onChange={(e) => setUpsellStatus(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                    >
                      <option value="No Offer">No Offer</option>
                      <option value="Interested">Interested</option>
                      <option value="Not Interested">Not Interested</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedOrder(null);
                    setRating(5);
                    setComments("");
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
                  {submitting ? "Saving..." : "Log Feedback"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolve Alert Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 mx-4">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Resolve Feedback Complaint</h3>
            <p className="text-xs text-slate-400 mb-4">Customer: {selectedTicket.order?.shippingInfo?.fullName}</p>
            <form onSubmit={handleResolveTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-550 mb-1">Resolution Actions Taken *</label>
                <textarea
                  rows="3"
                  required
                  placeholder="Explain how the issue was resolved (e.g. Replacement sheet sent, discount offered, leftover products pitched)."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 text-xs"
                />
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="salesUpsellOffered"
                    checked={salesUpsellOffered}
                    onChange={(e) => setSalesUpsellOffered(e.target.checked)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                  />
                  <label htmlFor="salesUpsellOffered" className="text-xs font-bold text-slate-700 cursor-pointer">
                    Upsell Leftover Materials? (Waterproof/Non-Tearable products)
                  </label>
                </div>
                {salesUpsellOffered && (
                  <div className="grid grid-cols-1 gap-2">
                    <input
                      type="text"
                      placeholder="Product Details (e.g. Leftover PP waterproof tags)"
                      value={salesUpsellProduct}
                      onChange={(e) => setSalesUpsellProduct(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                    />
                    <select
                      value={salesUpsellStatus}
                      onChange={(e) => setSalesUpsellStatus(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                    >
                      <option value="No Offer">No Offer</option>
                      <option value="Interested">Interested</option>
                      <option value="Not Interested">Not Interested</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTicket(null);
                    setResolutionNotes("");
                  }}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-bold text-slate-600 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resolving}
                  className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {resolving ? "Resolving..." : "Mark Resolved"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFeedback;
