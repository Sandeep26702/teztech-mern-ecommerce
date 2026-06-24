import { useState, useEffect } from "react";
import { 
  FaCommentAlt, 
  FaStar, 
  FaExclamationCircle, 
  FaCheckCircle, 
  FaPhoneAlt, 
  FaWhatsapp, 
  FaCopy, 
  FaSearch, 
  FaTrophy, 
  FaHourglassHalf, 
  FaFolderOpen, 
  FaRupeeSign, 
  FaThumbsUp, 
  FaThumbsDown, 
  FaTimes,
  FaArrowRight
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import api from "../../utils/api";

const AdminFeedback = () => {
  const { user } = useAuth();
  const userRole = user?.role?.toLowerCase() || "";

  const [activeTab, setActiveTab] = useState("call-queue");
  const [loading, setLoading] = useState(true);
  
  // Data lists
  const [allOrders, setAllOrders] = useState([]);
  const [callQueue, setCallQueue] = useState([]);
  const [feedbackTickets, setFeedbackTickets] = useState([]);
  const [metrics, setMetrics] = useState({
    csatScore: 5.0,
    pendingCalls: 0,
    openIssues: 0,
    upsellRevenue: 0
  });

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");

  // Record Feedback Modal State
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState("");
  const [status, setStatus] = useState("Satisfied");
  const [cuttingPerfect, setCuttingPerfect] = useState(true);
  const [packingIntact, setPackingIntact] = useState(true);
  const [upsellOffered, setUpsellOffered] = useState(false);
  const [upsellProduct, setUpsellProduct] = useState("Waterproof HDPE Leftover Sheets");
  const [upsellStatus, setUpsellStatus] = useState("No Offer");
  const [upsellRevenue, setUpsellRevenue] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Resolve Complaint Modal State
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [salesUpsellOffered, setSalesUpsellOffered] = useState(false);
  const [salesUpsellProduct, setSalesUpsellProduct] = useState("Waterproof HDPE Leftover Sheets");
  const [salesUpsellStatus, setSalesUpsellStatus] = useState("No Offer");
  const [salesUpsellRevenue, setSalesUpsellRevenue] = useState(0);
  const [salesCuttingPerfect, setSalesCuttingPerfect] = useState(true);
  const [salesPackingIntact, setSalesPackingIntact] = useState(true);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchMetrics(),
        fetchCallQueue(),
        fetchFeedbackTickets(),
        fetchAllOrders()
      ]);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
      toast.error("Failed to refresh dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const fetchMetrics = async () => {
    const res = await api.get("/feedbacks/metrics");
    if (res.data.success) {
      setMetrics(res.data.metrics);
    }
  };

  const fetchCallQueue = async () => {
    const res = await api.get("/feedbacks/call-queue");
    if (res.data.success) {
      setCallQueue(res.data.queue || []);
    }
  };

  const fetchFeedbackTickets = async () => {
    const res = await api.get("/feedbacks");
    if (res.data.success) {
      setFeedbackTickets(res.data.feedbacks || []);
    }
  };

  const fetchAllOrders = async () => {
    const res = await api.get("/orders/admin/all");
    if (res.data.success) {
      setAllOrders(res.data.orders || []);
    }
  };

  const formatWhatsAppNumber = (phone) => {
    if (!phone) return "";
    let cleaned = phone.toString().replace(/\D/g, "");
    if (cleaned.length === 10) {
      return "91" + cleaned;
    }
    return cleaned;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Phone number copied!");
  };

  const handleRecordFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!comments.trim()) {
      toast.error("Feedback comments are required!");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        orderId: selectedOrder._id,
        rating,
        comments,
        status: rating < 4 ? "Issue Reported" : status,
        cuttingPerfect,
        packingIntact,
        upsellOffered,
        upsellProduct: upsellOffered ? upsellProduct : "",
        upsellStatus: upsellOffered ? upsellStatus : "No Offer",
        upsellRevenue: upsellOffered ? Number(upsellRevenue) : 0,
      };

      const res = await api.post("/feedbacks", payload);
      if (res.data.success) {
        toast.success("Feedback call successfully logged!");
        setSelectedOrder(null);
        resetFeedbackForm();
        await fetchAllData();
      }
    } catch (err) {
      console.error(err);
      toast.error("Error saving client feedback");
    } finally {
      setSubmitting(false);
    }
  };

  const resetFeedbackForm = () => {
    setRating(5);
    setComments("");
    setStatus("Satisfied");
    setCuttingPerfect(true);
    setPackingIntact(true);
    setUpsellOffered(false);
    setUpsellProduct("Waterproof HDPE Leftover Sheets");
    setUpsellStatus("No Offer");
    setUpsellRevenue(0);
  };

  const handleResolveTicketSubmit = async (e) => {
    e.preventDefault();
    if (!resolutionNotes.trim()) {
      toast.error("Resolution actions are required!");
      return;
    }
    setResolving(true);
    try {
      const payload = {
        status: "Resolved",
        resolutionNotes,
        upsellOffered: salesUpsellOffered,
        upsellProduct: salesUpsellOffered ? salesUpsellProduct : "",
        upsellStatus: salesUpsellOffered ? salesUpsellStatus : "No Offer",
        upsellRevenue: salesUpsellOffered ? Number(salesUpsellRevenue) : 0,
        cuttingPerfect: salesCuttingPerfect,
        packingIntact: salesPackingIntact,
      };

      const res = await api.put(`/feedbacks/${selectedTicket._id}/resolve`, payload);
      if (res.data.success) {
        toast.success("Issue marked as Resolved in CRM!");
        setSelectedTicket(null);
        setResolutionNotes("");
        setSalesUpsellOffered(false);
        setSalesUpsellProduct("Waterproof HDPE Leftover Sheets");
        setSalesUpsellStatus("No Offer");
        setSalesUpsellRevenue(0);
        await fetchAllData();
      }
    } catch (err) {
      console.error(err);
      toast.error("Error resolving feedback ticket");
    } finally {
      setResolving(false);
    }
  };

  const getElapsedDays = (dateStr) => {
    if (!dateStr) return "N/A";
    const diffTime = Math.abs(new Date() - new Date(dateStr));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 0 ? "Today" : `${diffDays} days ago`;
  };

  // Filter lists based on search
  const filteredCallQueue = callQueue.filter(
    (order) =>
      order.orderCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.shippingInfo?.fullName || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeAlertTickets = feedbackTickets.filter((t) => t.status === "Issue Reported");
  const filteredAlertTickets = activeAlertTickets.filter(
    (ticket) =>
      (ticket.order?.orderCode || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ticket.order?.shippingInfo?.fullName || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredHistory = feedbackTickets.filter(
    (ticket) =>
      (ticket.order?.orderCode || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ticket.order?.shippingInfo?.fullName || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Manual search list (all orders excluding those already logged)
  const searchedManualOrders = searchTerm.trim().length > 1
    ? allOrders.filter(
        (order) =>
          !feedbackTickets.some((ticket) => ticket.order?._id === order._id) &&
          (order.orderCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (order.shippingInfo?.fullName || "").toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : [];

  // Script text generator
  const getUpsellScriptText = (custName, orderCode, prodName) => {
    return `Hi ${custName || "Valued Customer"}, thank you so much for your awesome feedback! As a valued partner, did you know we have special pricing on our leftover ${prodName || "HDPE sheets/tags"} from a corporate order? Since they are ready to dispatch, we can offer them at a 30% discount. Would you be interested?`;
  };

  const googleReviewTemplateText = (custName, orderCode) => {
    return `Hi ${custName || "Valued Customer"}, thank you so much for your 5-star rating on order ${orderCode || ""}! Could you please take 10 seconds to share your experience on our Google page? It helps our small business a lot: https://g.page/r/your-review-handle/review`;
  };

  return (
    <div className="space-y-6">
      {/* Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: CSAT */}
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-650 text-white rounded-2xl p-5 shadow-md flex items-center justify-between relative overflow-hidden">
          <div className="z-10">
            <p className="text-xs text-indigo-100 font-bold uppercase tracking-wider">CSAT Score (This Month)</p>
            <p className="text-3xl font-extrabold mt-2 flex items-baseline gap-1.5">
              {metrics.csatScore} <span className="text-sm font-semibold text-indigo-150">/ 5.0</span>
            </p>
            <div className="flex text-amber-300 text-xs mt-2 gap-0.5">
              {Array.from({ length: Math.round(metrics.csatScore) }).map((_, i) => (
                <FaStar key={i} />
              ))}
            </div>
          </div>
          <FaTrophy className="absolute right-4 bottom-4 text-7xl text-indigo-400/20 pointer-events-none" />
        </div>

        {/* Metric 2: Pending calls */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex items-center justify-between relative overflow-hidden">
          <div className="z-10">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Pending Follow-ups</p>
            <p className="text-3xl font-extrabold mt-2 text-slate-800">
              {metrics.pendingCalls}
            </p>
            <span className="inline-block mt-2 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
              Shipped &gt;= 3 days ago
            </span>
          </div>
          <FaHourglassHalf className="absolute right-4 bottom-4 text-7xl text-slate-100 pointer-events-none" />
        </div>

        {/* Metric 3: Open Issue complaints */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex items-center justify-between relative overflow-hidden">
          <div className="z-10">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Open Disputes / Issues</p>
            <p className="text-3xl font-extrabold mt-2 text-red-650">
              {metrics.openIssues}
            </p>
            <span className="inline-block mt-2 text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100 animate-pulse">
              Needs CRM resolution
            </span>
          </div>
          <FaExclamationCircle className="absolute right-4 bottom-4 text-7xl text-red-50/50 pointer-events-none" />
        </div>

        {/* Metric 4: Upsell Revenue */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-2xl p-5 shadow-md flex items-center justify-between relative overflow-hidden">
          <div className="z-10">
            <p className="text-xs text-emerald-100 font-bold uppercase tracking-wider">Upsell Revenue Generated</p>
            <p className="text-3xl font-extrabold mt-2 flex items-center">
              <FaRupeeSign className="text-2xl" /> {metrics.upsellRevenue.toLocaleString("en-IN")}
            </p>
            <span className="inline-block mt-2 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-450/40 text-emerald-50 border border-emerald-400">
              Total from leftovers
            </span>
          </div>
          <FaRupeeSign className="absolute right-4 bottom-4 text-7xl text-emerald-400/20 pointer-events-none" />
        </div>
      </div>

      {/* Main Panel Content Card */}
      <div className="p-6 bg-white border border-slate-100 shadow-sm rounded-2xl">
        {/* Header Section */}
        <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <FaCommentAlt className="text-indigo-650" /> Customer Post-Sales Feedback CRM
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Assure cutting & packing quality compliance, track client complaints, and pitch custom stock upsells.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <FaSearch className="text-slate-400 text-xs" />
            </span>
            <input
              type="text"
              placeholder="Search by order code or client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/25 bg-slate-50/50"
            />
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap gap-2 pb-4 mb-6 border-b border-slate-100">
          <button
            onClick={() => setActiveTab("call-queue")}
            className={`px-4 py-2 text-xs font-bold rounded-xl border transition cursor-pointer flex items-center gap-2 ${
              activeTab === "call-queue"
                ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                : "bg-white border-slate-200 text-slate-650 hover:border-indigo-200 hover:text-indigo-600"
            }`}
          >
            📞 Smart Call Queue
            <span className={`px-2 py-0.5 text-[10px] rounded-full ${
              activeTab === "call-queue" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
            }`}>
              {callQueue.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("complaints")}
            className={`px-4 py-2 text-xs font-bold rounded-xl border transition cursor-pointer flex items-center gap-2 ${
              activeTab === "complaints"
                ? "bg-red-650 border-red-650 text-white shadow-sm animate-pulse"
                : "bg-white border-slate-200 text-slate-650 hover:border-red-200 hover:text-red-600"
            }`}
          >
            🚨 Action Required: Complaints
            <span className={`px-2 py-0.5 text-[10px] rounded-full ${
              activeTab === "complaints" ? "bg-white/20 text-white" : "bg-red-50 text-red-600"
            }`}>
              {activeAlertTickets.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 text-xs font-bold rounded-xl border transition cursor-pointer flex items-center gap-2 ${
              activeTab === "history"
                ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                : "bg-white border-slate-200 text-slate-650 hover:border-indigo-200 hover:text-indigo-600"
            }`}
          >
            📋 Logs History
            <span className={`px-2 py-0.5 text-[10px] rounded-full ${
              activeTab === "history" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
            }`}>
              {feedbackTickets.length}
            </span>
          </button>
        </div>

        {/* Tab Contents */}
        {loading ? (
          <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-semibold mt-1">Retrieving latest CRM information...</p>
          </div>
        ) : activeTab === "call-queue" ? (
          <div>
            {/* Manual searched orders if searching */}
            {searchTerm.trim().length > 1 && searchedManualOrders.length > 0 && (
              <div className="mb-6 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                <h4 className="text-xs font-bold text-slate-550 mb-3 uppercase tracking-wide">Manual Search Results (Ready to Log)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {searchedManualOrders.map((order) => (
                    <div key={order._id} className="p-4 bg-white border border-slate-250 rounded-xl flex items-center justify-between shadow-sm">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-indigo-750 uppercase">{order.orderCode}</p>
                        <p className="text-xs font-bold text-slate-800">{order.shippingInfo?.fullName}</p>
                        <p className="text-[10px] text-slate-450">Shipped: {getElapsedDays(order.shippedAt)}</p>
                      </div>
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="py-1.5 px-3 bg-indigo-650 text-white rounded-lg text-xs font-bold hover:bg-indigo-750 transition"
                      >
                        Log Feedback
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Smart 3-Day Call Queue */}
            {filteredCallQueue.length === 0 ? (
              <div className="py-16 text-center text-slate-400 border border-dashed rounded-2xl border-slate-200">
                <p className="text-sm font-semibold">No orders matching the 3-Day follow-up rule found.</p>
                <p className="text-xs text-slate-500 mt-1">Type in the search bar above to manually find any order to record feedback.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredCallQueue.map((order) => (
                  <div
                    key={order._id}
                    className="p-5 border border-slate-100 bg-white hover:shadow-md hover:border-indigo-100 transition duration-300 rounded-2xl flex flex-col justify-between space-y-4"
                  >
                    <div>
                      {/* Badge / Code */}
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <span className="text-xs font-bold text-indigo-750 uppercase tracking-wide">
                          {order.orderCode}
                        </span>
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-150 px-2 py-0.5 rounded-full font-bold uppercase">
                          Shipped {getElapsedDays(order.shippedAt)}
                        </span>
                      </div>

                      {/* Client info */}
                      <div className="mt-4 space-y-3">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Client Representative</p>
                          <p className="text-sm font-bold text-slate-800">{order.shippingInfo?.fullName}</p>
                        </div>

                        {/* Phone action group */}
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Contact Details</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-xs text-slate-700 font-semibold">{order.shippingInfo?.phone}</span>
                            <button
                              onClick={() => copyToClipboard(order.shippingInfo?.phone)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 bg-slate-50 rounded-lg border border-slate-100 hover:border-indigo-100 transition cursor-pointer"
                              title="Copy Phone Number"
                            >
                              <FaCopy className="text-[10px]" />
                            </button>
                            <a
                              href={`tel:${order.shippingInfo?.phone}`}
                              className="p-1.5 text-indigo-600 hover:text-white bg-indigo-50 hover:bg-indigo-600 rounded-lg border border-indigo-100 transition cursor-pointer"
                              title="Call Representative"
                            >
                              <FaPhoneAlt className="text-[10px]" />
                            </a>
                            <a
                              href={`https://wa.me/${formatWhatsAppNumber(order.shippingInfo?.phone)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 text-emerald-600 hover:text-white bg-emerald-50 hover:bg-emerald-600 rounded-lg border border-emerald-100 transition cursor-pointer"
                              title="Chat on WhatsApp"
                            >
                              <FaWhatsapp className="text-[10px]" />
                            </a>
                          </div>
                        </div>

                        {/* Products order details */}
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Delivered Products</p>
                          <p className="text-xs text-slate-700 font-bold mt-0.5 line-clamp-2">
                            {order.items?.map((item) => `${item.name} (${item.qty} pcs)`).join(", ")}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Action button */}
                    <button
                      onClick={() => {
                        setSelectedOrder(order);
                        resetFeedbackForm();
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-3 bg-gradient-to-r from-indigo-600 to-indigo-750 text-white font-bold rounded-xl text-xs hover:from-indigo-750 hover:to-indigo-850 hover:shadow-md transition cursor-pointer"
                    >
                      📞 Start Callback Interview
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : activeTab === "complaints" ? (
          <div>
            {filteredAlertTickets.length === 0 ? (
              <div className="py-16 text-center text-slate-400 border border-dashed rounded-2xl border-slate-200">
                <p className="text-sm font-semibold">No complaints currently flagged for resolution.</p>
                <p className="text-xs text-slate-500 mt-1">Excellent job! All client feedback ratings are at 4.0 or above.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredAlertTickets.map((ticket) => (
                  <div
                    key={ticket._id}
                    className="p-5 border border-red-100 bg-red-50/10 shadow-sm rounded-2xl flex flex-col justify-between space-y-4 hover:border-red-300 transition duration-300"
                  >
                    <div>
                      {/* Flag Header */}
                      <div className="flex justify-between items-start border-b border-red-100 pb-3">
                        <div>
                          <span className="text-xs font-extrabold text-red-650 uppercase tracking-wide flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-red-650 animate-ping"></span>
                            🚨 Active Complaint Alert
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">Order: {ticket.order?.orderCode}</span>
                        </div>
                        <div className="flex text-amber-500 text-xs mt-1 gap-0.5 bg-white px-2 py-1 rounded-lg border border-slate-100 shadow-sm">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <FaStar key={i} className={i < ticket.rating ? "text-amber-500" : "text-slate-200"} />
                          ))}
                        </div>
                      </div>

                      {/* Complaint detail list */}
                      <div className="mt-4 space-y-3">
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Customer</p>
                            <p className="font-bold text-slate-800">{ticket.order?.shippingInfo?.fullName}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Contact</p>
                            <p className="font-semibold text-slate-700">{ticket.order?.shippingInfo?.phone}</p>
                          </div>
                        </div>

                        {/* Audited Status */}
                        <div className="grid grid-cols-2 gap-2 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                          <div className="flex items-center gap-1.5">
                            {ticket.cuttingPerfect ? (
                              <span className="text-emerald-600 bg-emerald-50 p-1 rounded-full"><FaCheckCircle className="text-[10px]" /></span>
                            ) : (
                              <span className="text-red-600 bg-red-50 p-1 rounded-full"><FaTimes className="text-[10px]" /></span>
                            )}
                            <span className="text-[11px] font-bold text-slate-650">Cutting Quality: {ticket.cuttingPerfect ? "Pass" : "Fail"}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {ticket.packingIntact ? (
                              <span className="text-emerald-600 bg-emerald-50 p-1 rounded-full"><FaCheckCircle className="text-[10px]" /></span>
                            ) : (
                              <span className="text-red-600 bg-red-50 p-1 rounded-full"><FaTimes className="text-[10px]" /></span>
                            )}
                            <span className="text-[11px] font-bold text-slate-650">Packing Quality: {ticket.packingIntact ? "Pass" : "Fail"}</span>
                          </div>
                        </div>

                        {/* Customer message */}
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-1">Customer Feedback Remarks</p>
                          <div className="italic text-slate-800 bg-white p-3 rounded-xl border border-slate-150 block text-xs leading-relaxed">
                            "{ticket.comments || "No comments written"}"
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <button
                      onClick={() => {
                        setSelectedTicket(ticket);
                        setSalesUpsellOffered(ticket.upsellOffered);
                        setSalesUpsellProduct(ticket.upsellProduct || "Waterproof HDPE Leftover Sheets");
                        setSalesUpsellStatus(ticket.upsellStatus);
                        setSalesUpsellRevenue(ticket.upsellRevenue || 0);
                        setSalesCuttingPerfect(ticket.cuttingPerfect);
                        setSalesPackingIntact(ticket.packingIntact);
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-3 bg-red-650 text-white font-bold rounded-xl text-xs hover:bg-red-750 transition cursor-pointer shadow-sm"
                    >
                      🔧 Resolve CRM Ticket / Log Action
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* History logs list */
          <div>
            {filteredHistory.length === 0 ? (
              <div className="py-16 text-center text-slate-400">No logs match the current query.</div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-150">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-xs tracking-wider text-slate-500 uppercase border-b border-slate-150 bg-slate-50">
                      <th className="p-4 font-bold">Order</th>
                      <th className="p-4 font-bold">Client Name</th>
                      <th className="p-4 font-bold">Rating</th>
                      <th className="p-4 font-bold">QC Status</th>
                      <th className="p-4 font-bold">Upsell Status</th>
                      <th className="p-4 font-bold">Ticket Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
                    {filteredHistory.map((t) => (
                      <tr key={t._id} className="hover:bg-slate-50/50 transition">
                        <td className="p-4 font-bold text-slate-800">{t.order?.orderCode || "N/A"}</td>
                        <td className="p-4 font-semibold text-slate-750">{t.order?.shippingInfo?.fullName || "Offline/User"}</td>
                        <td className="p-4">
                          <span className="flex text-amber-500 text-xs gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <FaStar key={i} className={i < t.rating ? "text-amber-500" : "text-slate-200"} />
                            ))}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              t.cuttingPerfect ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-700 border border-red-100"
                            }`}>
                              Cut: {t.cuttingPerfect ? "OK" : "Issue"}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              t.packingIntact ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-700 border border-red-100"
                            }`}>
                              Pack: {t.packingIntact ? "OK" : "Issue"}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          {t.upsellOffered ? (
                            <div className="space-y-1">
                              <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold rounded text-[10px] inline-block">
                                {t.upsellProduct || "Leftovers"}
                              </span>
                              <span className="block text-[10px] text-slate-400 font-bold">
                                Outcome: <strong className="text-slate-650">{t.upsellStatus}</strong> 
                                {t.upsellRevenue > 0 && ` (₹${t.upsellRevenue})`}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">No offer logged</span>
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
            )}
          </div>
        )}
      </div>

      {/* Record Call Feedback Dialog/Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-y-auto max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                  📞 Log Post-Sales Interview
                </h3>
                <p className="text-[10px] text-slate-450 font-bold mt-0.5">Order: {selectedOrder.orderCode} • Client: {selectedOrder.shippingInfo?.fullName}</p>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)} 
                className="p-1.5 text-slate-400 hover:text-slate-600 bg-white border border-slate-150 rounded-xl transition cursor-pointer"
              >
                <FaTimes />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleRecordFeedbackSubmit} className="p-6 space-y-5">
              
              {/* Star rating selection */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">Overall Experience Rating *</label>
                <div className="flex gap-2.5 text-3xl">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => {
                        setRating(star);
                        // Default change upsell Offered to true if 4 or 5 star rating
                        if (star >= 4) {
                          setUpsellOffered(true);
                          setUpsellStatus("Interested");
                        } else {
                          setUpsellOffered(false);
                          setUpsellStatus("No Offer");
                        }
                      }}
                      className={`cursor-pointer transition duration-150 hover:scale-110 ${
                        star <= rating ? "text-amber-500" : "text-slate-200 hover:text-amber-400"
                      }`}
                    >
                      <FaStar />
                    </button>
                  ))}
                </div>
              </div>

              {/* Quality inspection checkers */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Cutting Alignment/Size</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setCuttingPerfect(true)}
                      className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                        cuttingPerfect
                          ? "bg-emerald-50 border-emerald-250 text-emerald-700"
                          : "bg-white border-slate-200 text-slate-650 hover:bg-slate-50"
                      }`}
                    >
                      <FaThumbsUp className="text-[10px]" /> Perfect
                    </button>
                    <button
                      type="button"
                      onClick={() => setCuttingPerfect(false)}
                      className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                        !cuttingPerfect
                          ? "bg-red-50 border-red-250 text-red-750"
                          : "bg-white border-slate-200 text-slate-650 hover:bg-slate-50"
                      }`}
                    >
                      <FaThumbsDown className="text-[10px]" /> Imperfect
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Packing Seal/Tag Damage</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPackingIntact(true)}
                      className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                        packingIntact
                          ? "bg-emerald-50 border-emerald-250 text-emerald-700"
                          : "bg-white border-slate-200 text-slate-650 hover:bg-slate-50"
                      }`}
                    >
                      <FaThumbsUp className="text-[10px]" /> Intact / Good
                    </button>
                    <button
                      type="button"
                      onClick={() => setPackingIntact(false)}
                      className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                        !packingIntact
                          ? "bg-red-50 border-red-250 text-red-750"
                          : "bg-white border-slate-200 text-slate-650 hover:bg-slate-50"
                      }`}
                    >
                      <FaThumbsDown className="text-[10px]" /> Damaged / Wet
                    </button>
                  </div>
                </div>
              </div>

              {/* Red Flag warning banner if rating <= 3 */}
              {rating <= 3 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 text-red-800 text-xs">
                  <FaExclamationCircle className="text-xl shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold uppercase tracking-wider text-[10px]">Red Flag Alert Escalation</p>
                    <p className="leading-relaxed font-semibold">
                      This customer callback will automatically trigger alerts on both the <strong>Sales Complaint Panel</strong> and <strong>Purchase/Quality Dashboard</strong>.
                    </p>
                  </div>
                </div>
              )}

              {/* Google Reviews automation if rating === 5 */}
              {rating === 5 && (
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 border border-indigo-150 rounded-xl p-4 space-y-3">
                  <div className="flex gap-2.5 items-start">
                    <FaCheckCircle className="text-indigo-600 text-lg shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-indigo-850">Google Reviews WhatsApp Automation</p>
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed font-semibold">
                        This client rated us 5 stars! Request a Google Review via WhatsApp in one click.
                      </p>
                    </div>
                  </div>
                  
                  <a
                    href={getWhatsAppUrl(selectedOrder.shippingInfo?.phone, selectedOrder.shippingInfo?.fullName, selectedOrder.orderCode)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm w-full cursor-pointer"
                  >
                    <FaWhatsapp className="text-sm" /> Send Google Review Prompt via WhatsApp
                  </a>
                </div>
              )}

              {/* Upsell helper engine if rating >= 4 */}
              {rating >= 4 && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="upsellOffered"
                      checked={upsellOffered}
                      onChange={(e) => setUpsellOffered(e.target.checked)}
                      className="w-4 h-4 text-indigo-650 focus:ring-indigo-500 border-slate-350 rounded cursor-pointer"
                    />
                    <label htmlFor="upsellOffered" className="text-xs font-bold text-slate-800 cursor-pointer">
                      💡 Upsell Stock Leftovers / Scrap Tag Sheets?
                    </label>
                  </div>

                  {upsellOffered && (
                    <div className="space-y-3.5 border-t border-slate-200 pt-3">
                      
                      {/* Live pitch preview */}
                      <div className="p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                        <p className="text-[9px] font-extrabold text-indigo-700 uppercase tracking-wider mb-1">Interactive Call Script Pitch</p>
                        <p className="text-[11px] text-slate-650 leading-relaxed italic">
                          "{getUpsellScriptText(selectedOrder.shippingInfo?.fullName, selectedOrder.orderCode, upsellProduct)}"
                        </p>
                      </div>

                      {/* Product input */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">Product Offered</label>
                        <input
                          type="text"
                          required={upsellOffered}
                          placeholder="e.g. Waterproof HDPE sheets"
                          value={upsellProduct}
                          onChange={(e) => setUpsellProduct(e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>

                      {/* Outcome & Revenue details */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">Outcome Status</label>
                          <select
                            value={upsellStatus}
                            onChange={(e) => setUpsellStatus(e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          >
                            <option value="Interested">Interested (Creates Lead)</option>
                            <option value="Call Later">Call Later</option>
                            <option value="Not Interested">Not Interested</option>
                            <option value="No Offer">No Offer</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">Est. Value (₹)</label>
                          <input
                            type="number"
                            min="0"
                            placeholder="e.g. 15000"
                            value={upsellRevenue}
                            onChange={(e) => setUpsellRevenue(e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                      </div>

                      {/* Success disclaimer message */}
                      {upsellStatus === "Interested" && (
                        <div className="text-[10px] text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-150 flex items-center gap-1.5">
                          <FaCheckCircle className="shrink-0" />
                          <span>Choosing <strong>Interested</strong> will auto-insert a new Lead in the Sales Queue!</span>
                        </div>
                      )}

                    </div>
                  )}
                </div>
              )}

              {/* Feedbacks comments text box */}
              <div>
                <label className="block text-[11px] font-bold text-slate-550 uppercase tracking-wide mb-1">Interview Conversation Notes *</label>
                <textarea
                  rows="3"
                  required
                  placeholder="Record client comments or notes during the call..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 text-xs"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2.5 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-650 transition cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-indigo-650 hover:bg-indigo-750 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {submitting ? "Saving Log..." : "Submit Logged Feedback"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolve CRM Alert Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 mx-4">
            
            {/* Modal Header */}
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-850">
                  🔧 Resolve Complaint CRM Ticket
                </h3>
                <p className="text-[10px] text-slate-450 font-bold mt-0.5">Customer: {selectedTicket.order?.shippingInfo?.fullName}</p>
              </div>
              <button 
                onClick={() => setSelectedTicket(null)} 
                className="p-1.5 text-slate-400 hover:text-slate-650 bg-white border border-slate-150 rounded-xl transition cursor-pointer"
              >
                <FaTimes />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleResolveTicketSubmit} className="p-6 space-y-4">
              
              {/* Summary details */}
              <div className="p-3 bg-red-50/30 border border-red-100 rounded-xl text-xs text-slate-700 space-y-1.5">
                <p><strong>Complaint Code:</strong> {selectedTicket.order?.orderCode}</p>
                <p className="flex items-center gap-1">
                  <strong>CSAT Rating Given:</strong>
                  <span className="flex text-amber-500 gap-0.5">
                    {Array.from({ length: selectedTicket.rating }).map((_, i) => (
                      <FaStar key={i} />
                    ))}
                  </span>
                </p>
                <p className="italic bg-white p-2 rounded border border-slate-200 mt-1">
                  "{selectedTicket.comments || "No comments written"}"
                </p>
              </div>

              {/* Action logs */}
              <div>
                <label className="block text-xs font-bold text-slate-550 mb-1">CRM Resolution Action Taken *</label>
                <textarea
                  rows="3"
                  required
                  placeholder="Details of solution (e.g. Free replacement sheets sent, billing dispute settled, leftover products offered)."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-850 text-xs"
                />
              </div>

              {/* Quality flags adjustments */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="salesCuttingPerfect"
                    checked={salesCuttingPerfect}
                    onChange={(e) => setSalesCuttingPerfect(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded cursor-pointer"
                  />
                  <label htmlFor="salesCuttingPerfect" className="text-xs font-bold text-slate-750 cursor-pointer">
                    Cutting issue resolved
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="salesPackingIntact"
                    checked={salesPackingIntact}
                    onChange={(e) => setSalesPackingIntact(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded cursor-pointer"
                  />
                  <label htmlFor="salesPackingIntact" className="text-xs font-bold text-slate-750 cursor-pointer">
                    Packing issue resolved
                  </label>
                </div>
              </div>

              {/* Pitch leftovers inside Resolution modal */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="salesUpsellOffered"
                    checked={salesUpsellOffered}
                    onChange={(e) => setSalesUpsellOffered(e.target.checked)}
                    className="w-4 h-4 text-indigo-650 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
                  />
                  <label htmlFor="salesUpsellOffered" className="text-xs font-bold text-slate-750 cursor-pointer">
                    Pitch Stock Leftovers / Scrap?
                  </label>
                </div>
                {salesUpsellOffered && (
                  <div className="grid grid-cols-1 gap-2 border-t border-slate-200 pt-2 space-y-2">
                    <input
                      type="text"
                      placeholder="Product Details (e.g. Leftover PP tags)"
                      value={salesUpsellProduct}
                      onChange={(e) => setSalesUpsellProduct(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={salesUpsellStatus}
                        onChange={(e) => setSalesUpsellStatus(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                      >
                        <option value="Interested">Interested (Creates Lead)</option>
                        <option value="Call Later">Call Later</option>
                        <option value="Not Interested">Not Interested</option>
                        <option value="No Offer">No Offer</option>
                      </select>
                      <input
                        type="number"
                        placeholder="Upsell Value (₹)"
                        value={salesUpsellRevenue}
                        onChange={(e) => setSalesUpsellRevenue(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-bold text-slate-600 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resolving}
                  className="px-5 py-2 bg-emerald-650 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {resolving ? "Resolving CRM..." : "Resolve & Close Alert"}
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
