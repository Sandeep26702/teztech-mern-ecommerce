import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { 
  FaEdit, 
  FaFileInvoiceDollar, 
  FaPlus, 
  FaSearch, 
  FaCalendarAlt, 
  FaUserShield, 
  FaGlobe,
  FaUserTag,
  FaComments
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import api from "../../utils/api";
import CreateManualQuotationModal from "../components/CreateManualQuotationModal.jsx";
import ClientNotesModal from "../components/ClientNotesModal.jsx";

const STATUS_TABS = [
  { key: "action", label: "Action Needed", statuses: ["Pending"] },
  { key: "awaiting", label: "Awaiting Client", statuses: ["Responded", "Offered", "Updated"] },
  { key: "accepted", label: "Accepted", statuses: ["Accepted"] },
  { key: "rejected", label: "Rejected", statuses: ["Rejected"] },
  { key: "all", label: "All Quotes", statuses: null },
];

const toSafeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatINR = (value) => {
  const safeValue = Math.max(0, toSafeNumber(value, 0));
  return `₹ ${safeValue.toLocaleString("en-IN")}`;
};

const getAuthorColor = (name) => {
  const colors = [
    "text-teal-600",
    "text-blue-600",
    "text-purple-600",
    "text-orange-600",
    "text-pink-600",
    "text-indigo-600",
    "text-rose-600"
  ];
  if (!name) return "text-blue-600";
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

const getQuoteTotal = (quote) => {
  if (quote?.designs) {
    return toSafeNumber(quote?.offeredPrice, 0);
  }
  const finalTotal = toSafeNumber(quote?.finalTotal, 0);
  if (finalTotal > 0) return finalTotal;
  const items = Array.isArray(quote?.requestedItems) ? quote.requestedItems : [];
  return items.reduce((sum, item) => {
    const qty = Math.max(0, toSafeNumber(item?.quantity, 0));
    const price = toSafeNumber(
      item?.offeredPrice,
      toSafeNumber(item?.originalPrice, toSafeNumber(item?.basePrice, 0))
    );
    return sum + qty * price;
  }, 0);
};

const QuotesTable = () => {
  const [quotes, setQuotes] = useState([]);
  const [customQuotes, setCustomQuotes] = useState([]);
  const [quoteType, setQuoteType] = useState("product"); // "product" or "custom"
  const [loading, setLoading] = useState(true);
  const [showManualModal, setShowManualModal] = useState(false);
  const [activeTab, setActiveTab] = useState("action");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  // Custom Quote response modal states
  const [showRespondModal, setShowRespondModal] = useState(false);
  const [selectedCustomQuote, setSelectedCustomQuote] = useState(null);
  const [offeredPrice, setOfferedPrice] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [submittingResponse, setSubmittingResponse] = useState(false);
  const [showClientNotes, setShowClientNotes] = useState(false);

  // CRM & Sales team states
  const [salesTeam, setSalesTeam] = useState([]);
  const [newCustomComment, setNewCustomComment] = useState("");
  const [isCustomCommentPublic, setIsCustomCommentPublic] = useState(false);
  const [addingComment, setAddingComment] = useState(false);

  // Fetch sales team users on mount
  useEffect(() => {
    const fetchSalesTeam = async () => {
      try {
        const res = await api.get("/admin/users");
        if (res.data.success) {
          const team = (res.data.users || []).filter(u => u.role === "admin" || u.role === "subadmin");
          setSalesTeam(team);
        }
      } catch (error) {
        console.error("Error fetching sales team:", error);
      }
    };
    fetchSalesTeam();
  }, []);

  const handleAssignCustomQuote = async (userId) => {
    if (!selectedCustomQuote) return;
    try {
      const res = await api.put(`/custom-quote/assign/${selectedCustomQuote._id}`, { assignedTo: userId });
      if (res.data.success) {
        toast.success("Quote assigned successfully!");
        const updated = res.data.quote;
        setSelectedCustomQuote(updated);
        setCustomQuotes(prev => prev.map(q => q._id === updated._id ? updated : q));
      }
    } catch (error) {
      console.error("Failed to assign custom quote:", error);
      toast.error("Failed to assign custom quote.");
    }
  };

  const handleAddCustomComment = async (e) => {
    e.preventDefault();
    if (!selectedCustomQuote || !newCustomComment.trim()) return;
    setAddingComment(true);
    try {
      const res = await api.post(`/custom-quote/comment/${selectedCustomQuote._id}`, { remarks: newCustomComment, isPublic: true });
      if (res.data.success) {
        toast.success("Message sent!");
        const updated = res.data.quote;
        setSelectedCustomQuote(updated);
        setCustomQuotes(prev => prev.map(q => q._id === updated._id ? updated : q));
        setNewCustomComment("");
      }
    } catch (error) {
      console.error("Failed to add comment:", error);
      toast.error("Failed to add comment.");
    } finally {
      setAddingComment(false);
    }
  };

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      const response = await api.get("/quote/all");
      setQuotes(response.data.quotes || []);
    } catch (error) {
      console.error("Error fetching quotes:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomQuotes = async () => {
    try {
      setLoading(true);
      const response = await api.get("/custom-quote/all");
      setCustomQuotes(response.data.quotes || []);
    } catch (error) {
      console.error("Error fetching custom quotes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (quoteType === "product") {
      fetchQuotes();
    } else {
      fetchCustomQuotes();
    }
  }, [quoteType]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "Pending": return "bg-yellow-100 text-yellow-800";
      case "Responded": return "bg-blue-100 text-blue-800";
      case "Offered": return "bg-blue-100 text-blue-800";
      case "Updated": return "bg-indigo-100 text-indigo-800";
      case "Accepted": return "bg-green-100 text-green-800";
      case "Rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const activeQuotesList = quoteType === "product" ? quotes : customQuotes;

  const filteredQuotes = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const startDate = dateRange.start ? new Date(`${dateRange.start}T00:00:00`) : null;
    const endDate = dateRange.end ? new Date(`${dateRange.end}T23:59:59.999`) : null;

    return activeQuotesList.filter((quote) => {
      const quoteNumber = String(quote?.quoteNumber || "").toLowerCase();
      const clientName = String(quote?.userDetails?.name || "").toLowerCase();

      const matchesSearch = !term || quoteNumber.includes(term) || clientName.includes(term);

      if (!matchesSearch) return false;

      if (!startDate && !endDate) return true;
      const createdAt = quote?.createdAt ? new Date(quote.createdAt) : null;
      if (!createdAt || Number.isNaN(createdAt.getTime())) return false;
      if (startDate && createdAt < startDate) return false;
      if (endDate && createdAt > endDate) return false;
      return true;
    });
  }, [activeQuotesList, searchTerm, dateRange.start, dateRange.end]);

  const tabbedQuotes = useMemo(() => {
    const tab = STATUS_TABS.find((entry) => entry.key === activeTab) || STATUS_TABS[0];
    if (!tab.statuses) return filteredQuotes;
    return filteredQuotes.filter((quote) => tab.statuses.includes(quote?.status));
  }, [filteredQuotes, activeTab]);

  const buildStats = (statuses) => {
    const pool = filteredQuotes.filter((quote) => statuses.includes(quote?.status));
    const count = pool.length;
    const amount = pool.reduce((sum, quote) => sum + getQuoteTotal(quote), 0);
    return { count, amount };
  };

  const actionStats = buildStats(["Pending"]);
  const awaitingStats = buildStats(["Responded", "Offered", "Updated"]);
  const wonStats = buildStats(["Accepted"]);

  const tabCounts = STATUS_TABS.reduce((acc, tab) => {
    if (!tab.statuses) {
      acc[tab.key] = filteredQuotes.length;
      return acc;
    }
    acc[tab.key] = filteredQuotes.filter((quote) => tab.statuses.includes(quote?.status)).length;
    return acc;
  }, {});

  return (
    <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
      <div className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-800">
            <FaFileInvoiceDollar className="text-blue-600" /> Sales Pipeline
          </h2>
          <p className="mt-1 text-sm text-gray-500">Track quote health, follow-ups, and conversions.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative">
            <FaSearch className="absolute text-gray-400 -translate-y-1/2 left-3 top-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by client or Quote ID"
              className="w-full py-2.5 pl-10 pr-4 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
          <div className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-xl">
            <FaCalendarAlt className="text-gray-400" />
            <input
              type="date"
              value={dateRange.start}
              onChange={(event) => setDateRange((prev) => ({ ...prev, start: event.target.value }))}
              className="text-sm text-gray-600 bg-transparent focus:outline-none"
            />
            <span className="text-gray-400">-</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(event) => setDateRange((prev) => ({ ...prev, end: event.target.value }))}
              className="text-sm text-gray-600 bg-transparent focus:outline-none"
            />
          </div>
          {quoteType === "product" && (
            <button 
              onClick={() => setShowManualModal(true)}
              className="flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white shadow-lg bg-emerald-600 rounded-xl hover:bg-emerald-700 cursor-pointer"
            >
              <FaPlus /> Create Manual Quotation
            </button>
          )}
        </div>
      </div>

      {/* Quote Type Switcher Tabs */}
      <div className="flex gap-6 mb-6 border-b border-gray-150 pb-2">
        <button
          onClick={() => {
            setQuoteType("product");
            setActiveTab("action");
          }}
          className={`pb-2 text-base font-bold transition-all border-b-2 cursor-pointer ${
            quoteType === "product"
              ? "text-blue-600 border-blue-600"
              : "text-gray-400 border-transparent hover:text-gray-600"
          }`}
        >
          📦 Standard Product Quotations
        </button>
        <button
          onClick={() => {
            setQuoteType("custom");
            setActiveTab("action");
          }}
          className={`pb-2 text-base font-bold transition-all border-b-2 cursor-pointer ${
            quoteType === "custom"
              ? "text-blue-600 border-blue-600"
              : "text-gray-400 border-transparent hover:text-gray-600"
          }`}
        >
          🎨 Custom Design Quotations
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-3">
        <div className="p-4 border border-amber-100 bg-amber-50 rounded-2xl">
          <p className="text-xs font-semibold tracking-wide text-amber-700 uppercase">Action Needed</p>
          <div className="flex items-end justify-between mt-4">
            <div>
              <p className="text-2xl font-bold text-amber-900">{actionStats.count}</p>
              <p className="text-xs text-amber-700">Pending quotes</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-amber-900">{formatINR(actionStats.amount)}</p>
              <p className="text-[11px] text-amber-700">Total pending value</p>
            </div>
          </div>
        </div>
        <div className="p-4 border border-blue-100 bg-blue-50 rounded-2xl">
          <p className="text-xs font-semibold tracking-wide text-blue-700 uppercase">Awaiting Client</p>
          <div className="flex items-end justify-between mt-4">
            <div>
              <p className="text-2xl font-bold text-blue-900">{awaitingStats.count}</p>
              <p className="text-xs text-blue-700">Responded / Offered</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-blue-900">{formatINR(awaitingStats.amount)}</p>
              <p className="text-[11px] text-blue-700">Total awaiting value</p>
            </div>
          </div>
        </div>
        <div className="p-4 border border-emerald-100 bg-emerald-50 rounded-2xl">
          <p className="text-xs font-semibold tracking-wide text-emerald-700 uppercase">Deals Won</p>
          <div className="flex items-end justify-between mt-4">
            <div>
              <p className="text-2xl font-bold text-emerald-900">{wonStats.count}</p>
              <p className="text-xs text-emerald-700">Accepted quotes</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-emerald-900">{formatINR(wonStats.amount)}</p>
              <p className="text-[11px] text-emerald-700">Total won value</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pb-4 mb-4 border-b border-gray-100">
        {STATUS_TABS.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border transition cursor-pointer ${
                isActive
                  ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                  : "bg-white border-gray-200 text-gray-600 hover:border-blue-200 hover:text-blue-600"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-2 py-0.5 text-xs rounded-full ${
                  isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
                }`}
              >
                {tabCounts[tab.key] || 0}
              </span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <p className="py-10 text-center text-gray-500">Loading quotes...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-sm tracking-wider text-gray-600 uppercase border-b border-gray-200 bg-gray-50">
                <th className="p-4 font-semibold">Quote ID & Creation</th>
                <th className="p-4 font-semibold">Source</th>
                <th className="p-4 font-semibold">Client Info</th>
                <th className="p-4 font-semibold">Amount / Details</th>
                <th className="p-4 font-semibold text-left">Status & Action</th>
              </tr>
            </thead>
            <tbody className="text-gray-700 divide-y divide-gray-100">
              {tabbedQuotes.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">
                    No quotes match the selected filters.
                  </td>
                </tr>
              ) : (
                tabbedQuotes.map((quote) => {
                  const quoteNumber = quote?.quoteNumber ? `#${quote.quoteNumber}` : `#${quote?._id || "—"}`;
                  const version = quoteType === "product" ? `V${toSafeNumber(quote?.version, 1)}` : "Custom Design";
                  const isManual = quoteType === "product" ? Boolean(quote?.isManual) : false;
                  const createdAt = quote?.createdAt ? new Date(quote.createdAt).toLocaleDateString() : "—";
                  const total = quoteType === "product"
                    ? formatINR(getQuoteTotal(quote))
                    : quote.status === "Pending" ? "Pending Quote" : formatINR(quote.offeredPrice);

                  const handleActionClick = (e) => {
                    if (quoteType === "custom") {
                      e.preventDefault();
                      setSelectedCustomQuote(quote);
                      setOfferedPrice(quote.offeredPrice || "");
                      setAdminNotes(quote.adminNotes || "");
                      setShowRespondModal(true);
                    }
                  };

                  return (
                    <tr 
                      key={quote._id} 
                      onClick={(e) => {
                        if (quoteType === "custom") {
                          handleActionClick(e);
                        }
                      }}
                      className="transition-colors hover:bg-gray-50 cursor-pointer"
                    >
                      <td className="p-4">
                        {quoteType === "product" ? (
                          <Link
                            to={`/admin/quotes/${quote._id}`}
                            className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 rounded-lg"
                            title="Open quote details"
                          >
                            <p className="font-semibold text-gray-900">{`${quoteNumber} - ${version}`}</p>
                            <p className="text-xs text-gray-500">Created {createdAt}</p>
                          </Link>
                        ) : (
                          <div>
                            <p className="font-semibold text-gray-900">{quoteNumber}</p>
                            <p className="text-xs text-gray-500">Created {createdAt}</p>
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-sm">
                          <span
                            className={`flex items-center justify-center w-8 h-8 rounded-lg ${
                              isManual ? "bg-emerald-100 text-emerald-700" : "bg-indigo-100 text-indigo-700"
                            }`}
                            title={isManual ? "Created by Admin" : "Requested by Client/Web"}
                          >
                            {isManual ? <FaUserShield /> : <FaGlobe />}
                          </span>
                          <div>
                            <p className="font-semibold text-gray-800">{isManual ? "Admin" : "Client/Web"}</p>
                            <p className="text-xs text-gray-500">{isManual ? "Manual entry" : "Online request"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-semibold text-gray-900">{quote?.userDetails?.name || "—"}</p>
                          <p className="text-xs text-gray-500">{quote?.userDetails?.company || "No company"}</p>
                          {quote?.assignedTo && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 mt-2 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-md">
                              👤 {quote.assignedTo.name || "Assigned"}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="text-base font-semibold text-gray-900">{total}</p>
                          <p className="text-xs text-gray-500">
                            {quoteType === "product"
                              ? `${quote?.requestedItems?.length || 0} items`
                              : `${quote?.designs?.length || 0} design(s)`}
                          </p>
                        </div>
                      </td>
                      <td className="p-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusBadge(quote.status)}`}>
                            {quote.status}
                          </span>
                          {quoteType === "product" ? (
                            <Link 
                              to={`/admin/quotes/${quote._id}`}
                              className="inline-flex items-center justify-center p-2 text-blue-600 transition-colors rounded-lg bg-blue-50 hover:bg-blue-600 hover:text-white"
                              title="View & Respond"
                            >
                              <FaEdit />
                            </Link>
                          ) : (
                            <button
                              onClick={handleActionClick}
                              className="inline-flex items-center justify-center p-2 text-blue-600 transition-colors rounded-lg bg-blue-50 hover:bg-blue-600 hover:text-white cursor-pointer"
                              title="Offer Custom Price"
                            >
                              <FaEdit />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
      <CreateManualQuotationModal isOpen={showManualModal} onClose={() => setShowManualModal(false)} />

      {/* 🎨 CUSTOM QUOTE RESPOND DIALOG MODAL */}
      {showRespondModal && selectedCustomQuote && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white overflow-hidden w-screen h-screen">
          <div className="w-full h-full flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 flex-shrink-0 z-10 shadow-sm">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <span>Custom Quotation Request:</span>
                  <span className="text-blue-600 font-extrabold">{selectedCustomQuote.quoteNumber}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Submitted by <span className="font-semibold text-slate-705">{selectedCustomQuote.userDetails.name}</span> on {new Date(selectedCustomQuote.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowClientNotes(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-250 text-amber-800 font-bold text-xs rounded-xl shadow-sm cursor-pointer transition-all active:scale-95 z-20"
                >
                  📝 Client CRM Notes
                </button>
                <button 
                  onClick={() => setShowRespondModal(false)}
                  className="text-gray-400 hover:text-gray-650 p-2 hover:bg-gray-100 rounded-full cursor-pointer text-lg font-bold transition flex items-center justify-center w-8 h-8"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body: Two-Column Split Layout */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden h-full">
              
              {/* LEFT COLUMN: Client Details & Design Specifications */}
              <div className="w-full md:w-[65%] lg:w-[70%] p-6 overflow-y-auto border-r border-slate-200 space-y-6 bg-slate-50">
                
                {/* Client Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Client Contacts</p>
                    <p className="font-semibold text-slate-800 mt-1">{selectedCustomQuote.userDetails.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Mobile: {selectedCustomQuote.userDetails.phone}</p>
                    {selectedCustomQuote.userDetails.company && (
                      <p className="text-xs text-slate-500">Company: {selectedCustomQuote.userDetails.company}</p>
                    )}
                  </div>
                  <div className="border-t sm:border-t-0 sm:border-l border-slate-100 pt-4 sm:pt-0 sm:pl-4">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Delivery Address</p>
                    <p className="text-xs text-slate-650 mt-1 whitespace-pre-wrap leading-relaxed">{selectedCustomQuote.userDetails.address}</p>
                  </div>
                </div>

                {/* Response & Offer Price Form Panel */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-4 shadow-sm">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Respond & Offer Price</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-1">
                      <label className="block text-xs font-bold text-slate-500 mb-1">Offered Price (₹) *</label>
                      <input
                        type="number"
                        min="0"
                        required
                        placeholder="e.g. 12000"
                        value={offeredPrice}
                        onChange={(e) => setOfferedPrice(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 font-semibold"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-500 mb-1">Response Notes for Client</label>
                      <input
                        type="text"
                        placeholder="e.g. Premium quality materials included."
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      disabled={submittingResponse || !offeredPrice}
                      onClick={async () => {
                        try {
                          setSubmittingResponse(true);
                          const res = await api.put(`/custom-quote/respond/${selectedCustomQuote._id}`, {
                            offeredPrice: Number(offeredPrice),
                            adminNotes
                          });
                          if (res.data && res.data.success) {
                            toast.success("Offer successfully sent to user!");
                            setShowRespondModal(false);
                            fetchCustomQuotes();
                          }
                        } catch (error) {
                          console.error("Error responding to custom quote:", error);
                          toast.error("Failed to submit response.");
                        } finally {
                          setSubmittingResponse(false);
                        }
                      }}
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition disabled:opacity-50 cursor-pointer shadow-sm text-center"
                    >
                      {submittingResponse ? "Submitting..." : "Send Price Offer"}
                    </button>
                  </div>
                </div>

                {/* Designs Specification List */}
                <div className="space-y-4">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Design Specifications ({selectedCustomQuote.designs?.length})</p>
                  {selectedCustomQuote.designs?.map((design, idx) => (
                    <div key={idx} className="p-4 border border-slate-200 rounded-xl space-y-4 bg-white shadow-sm">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-slate-800 text-sm">Design #{idx + 1}: {design.designName}</h4>
                        <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold uppercase">
                          {design.ledType} LED
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                        <div>
                          <span className="text-slate-400 block font-medium">Dimensions</span>
                          <span className="font-bold text-slate-800">{design.length} x {design.width} ft</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-medium">Color description</span>
                          <span className="font-bold text-slate-800">{design.sheetColor}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-medium">Thickness</span>
                          <span className="font-bold text-slate-800">{design.thickness} mm</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-medium">Required Date</span>
                          <span className="font-bold text-slate-800">
                            {new Date(design.requiredDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {design.specialInstructions && (
                        <div className="text-xs bg-amber-50/50 p-2.5 rounded border border-amber-200/40 text-amber-900">
                          <span className="font-bold block mb-1">Special Instructions:</span>
                          <p className="italic">{design.specialInstructions}</p>
                        </div>
                      )}

                      {design.referenceUrl && (
                        <div className="text-xs border-t border-slate-100 pt-3">
                          <span className="text-slate-400 block font-medium mb-1.5">Reference Drawing/File</span>
                          <a 
                            href={design.referenceUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-bold mb-2 transition"
                          >
                            View Uploaded File in New Tab ↗
                          </a>
                          <div className="max-w-full h-40 border border-slate-200 rounded-lg overflow-hidden bg-slate-950 flex items-center justify-center">
                            {design.referenceUrl.endsWith(".mp4") || design.referenceUrl.includes("video") ? (
                              <video src={design.referenceUrl} className="object-contain w-full h-full" controls />
                            ) : (
                              <img src={design.referenceUrl} alt="Reference Preview" className="object-contain w-full h-full" />
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* RIGHT COLUMN: Dedicated CRM Conversation Log (WhatsApp Chat Style) */}
              <div className="w-full md:w-[35%] lg:w-[30%] flex flex-col bg-[#efeae2] overflow-hidden h-full border-l border-slate-200 flex-shrink-0">
                
                {/* Chat Header */}
                <div className="px-6 py-3 bg-[#f0f2f5] border-b border-slate-200 flex items-center justify-between flex-shrink-0 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-650 text-white flex items-center justify-center font-bold text-sm shadow-sm bg-gradient-to-tr from-blue-600 to-indigo-600">
                      {selectedCustomQuote.userDetails.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{selectedCustomQuote.userDetails.name} Discussion</h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <label className="text-[11px] font-semibold text-slate-500">Assigned To:</label>
                        <select
                          value={selectedCustomQuote.assignedTo?._id || selectedCustomQuote.assignedTo || ""}
                          onChange={(e) => handleAssignCustomQuote(e.target.value)}
                          className="px-2 py-0.5 border border-slate-250 rounded-md text-[11px] font-medium text-slate-700 bg-white focus:outline-none"
                        >
                          <option value="">Unassigned</option>
                          {salesTeam.map((member) => (
                            <option key={member._id} value={member._id}>
                              {member.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <span className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-full uppercase ${
                    selectedCustomQuote.status === "Pending" ? "bg-amber-100 text-amber-800 border border-amber-200" :
                    selectedCustomQuote.status === "Responded" ? "bg-blue-100 text-blue-800 border border-blue-200" :
                    selectedCustomQuote.status === "Accepted" ? "bg-green-100 text-green-800 border border-green-200" :
                    "bg-red-100 text-red-800 border border-red-200"
                  }`}>
                    {selectedCustomQuote.status}
                  </span>
                </div>

                {/* WhatsApp Chat Area */}
                <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-[#efeae2]">
                  
                  {/* System Welcome log entry */}
                  <div className="flex justify-center mb-2">
                    <span className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-[10px] font-semibold text-slate-500 shadow-sm border border-slate-200/50 uppercase tracking-wider">
                      Request Created • {new Date(selectedCustomQuote.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {(!selectedCustomQuote.crmNotes || selectedCustomQuote.crmNotes.length === 0) ? (
                    <div className="flex justify-center py-12">
                      <span className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl text-xs font-medium text-slate-400 text-center shadow-sm max-w-xs">
                        No messages or log updates yet. Use the chat bar below to record interactions.
                      </span>
                    </div>
                  ) : (
                    selectedCustomQuote.crmNotes.map((note, idx) => {
                      const isClient = 
                        note.role === "client" || 
                        (note.role !== "admin" && (
                          !note.author ||
                          String(note.author).toLowerCase() === "client" ||
                          String(note.author).trim().toLowerCase() === String(selectedCustomQuote.userDetails?.name || "").trim().toLowerCase() ||
                          String(note.author).trim().toLowerCase() === String(selectedCustomQuote.user?.name || "").trim().toLowerCase()
                        ));
                      const bubbleBg = isClient 
                        ? "bg-white text-slate-800 rounded-tl-none border-slate-200 shadow-sm" 
                        : "bg-[#d9fdd3] text-slate-900 rounded-tr-none border-[#b7e9b0] shadow-sm";

                      return (
                        <div 
                          key={idx} 
                          className={`flex w-full mb-3 ${isClient ? "justify-start" : "justify-end"}`}
                        >
                          <div className={`p-3.5 rounded-2xl border text-sm max-w-[80%] relative min-w-[160px] ${bubbleBg}`}>
                            
                            {/* Sender Name */}
                            <div className="flex items-center gap-4 mb-1 justify-between text-[10px]">
                              <span className={getAuthorColor(note.author)}>{note.author || "Sales Team"}</span>
                            </div>

                            {/* Remarks */}
                            <p className="font-medium whitespace-pre-wrap break-words leading-relaxed pb-3 text-slate-800">
                              {note.remarks}
                            </p>

                            {/* Timestamp inside bubble bottom right */}
                            <span className="absolute bottom-1 right-2 text-[9px] text-slate-400 font-semibold uppercase">
                              {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* WhatsApp Style Send Input Bar */}
                <div className="p-4 bg-[#f0f2f5] border-t border-slate-200 flex-shrink-0 space-y-2">
                  <form onSubmit={handleAddCustomComment} className="flex gap-2 items-center">
                    <div className="flex-1 bg-white border border-slate-200 rounded-xl flex items-center px-3 py-1 shadow-sm">
                      <textarea
                        rows="1"
                        placeholder="Write comment or interaction note..."
                        value={newCustomComment}
                        onChange={(e) => setNewCustomComment(e.target.value)}
                        disabled={addingComment}
                        className="flex-1 px-2 py-1.5 text-sm focus:outline-none text-slate-800 resize-none min-h-[38px] max-h-[80px]"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleAddCustomComment(e);
                          }
                        }}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={addingComment || !newCustomComment.trim()}
                      className="p-3 bg-[#00a884] hover:bg-[#008f72] disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-full transition shadow-sm flex items-center justify-center cursor-pointer w-[44px] h-[44px] flex-shrink-0"
                      title="Send Message"
                    >
                      {addingComment ? (
                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 transform rotate-90">
                          <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                        </svg>
                      )}
                    </button>
                  </form>
                  <div className="flex items-center justify-between px-2 text-slate-500">
                    <span className="text-[10px] text-slate-400 italic">Press Enter to send, Shift+Enter for new line.</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
      {showClientNotes && selectedCustomQuote && (
        <ClientNotesModal
          isOpen={showClientNotes}
          onClose={() => setShowClientNotes(false)}
          clientName={selectedCustomQuote.userDetails?.name}
          clientEmail={selectedCustomQuote.user?.email || selectedCustomQuote.userDetails?.email}
          clientPhone={selectedCustomQuote.userDetails?.phone}
        />
      )}
    </div>
  );
};

export default QuotesTable;
