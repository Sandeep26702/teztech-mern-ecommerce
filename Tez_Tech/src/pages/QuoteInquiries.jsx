import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { toast } from "react-hot-toast";
import {
  FaHistory,
  FaCheckCircle,
  FaTimesCircle,
  FaFileInvoiceDollar,
  FaChevronRight,
  FaComments,
  FaCalendarAlt,
  FaInfoCircle,
  FaArrowLeft,
  FaPaperPlane
} from "react-icons/fa";

const renderNotesWithLinks = (text) => {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) => {
    if (part.match(urlRegex)) {
      return (
        <a 
          key={i} 
          href={part} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-blue-600 underline hover:text-blue-800 break-all font-semibold"
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

const getStatusBadge = (status) => {
  switch (status) {
    case "Pending": return "bg-amber-100 text-amber-800 border-amber-200";
    case "Responded": return "bg-blue-100 text-blue-800 border-blue-200";
    case "Offered": return "bg-blue-100 text-blue-800 border-blue-200";
    case "Updated": return "bg-indigo-100 text-indigo-800 border-indigo-200";
    case "Accepted": return "bg-green-100 text-green-800 border-green-200";
    case "Rejected": return "bg-red-100 text-red-800 border-red-200";
    default: return "bg-slate-100 text-slate-800 border-slate-200";
  }
};

const renderItemSpecs = (item) => {
  const parts = [];
  if (item?.selectedVariant) {
    const variantName = item.selectedVariant.name || Object.values(item.selectedVariant.combination || {}).join(' / ');
    parts.push({ label: 'Variant', value: variantName });
  }
  if (item?.selectedAttributes) {
    Object.entries(item.selectedAttributes).forEach(([key, val]) => {
      parts.push({ label: key, value: val.value || val.label || val });
    });
  }
  if (item?.selectedCustomFields) {
    Object.entries(item.selectedCustomFields).forEach(([key, val]) => {
      parts.push({ label: key, value: Array.isArray(val) ? val.join(', ') : val });
    });
  }
  if (parts.length === 0 && Array.isArray(item?.selectedOptions)) {
    item.selectedOptions.forEach(opt => {
       parts.push({ label: opt.fieldLabel, value: opt.value });
    });
  }

  if (parts.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {parts.map((p, i) => (
        <div key={i} className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold text-slate-700 bg-slate-200/60 rounded">
          <span className="text-slate-400 font-extrabold uppercase">{p.label}:</span>
          <span className="text-slate-800 font-black">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

const QuoteInquiries = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("product"); // "product" or "custom"
  const [productQuotes, setProductQuotes] = useState([]);
  const [customQuotes, setCustomQuotes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Discussion & Chat states
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const chatEndRef = useRef(null);

  const fetchInquiries = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [productRes, customRes] = await Promise.all([
        api.get("/quote/my-quotes"),
        api.get("/custom-quote/my-quotes")
      ]);
      
      let pQuotes = [];
      let cQuotes = [];

      if (productRes.data.success) {
        pQuotes = productRes.data.quotes || [];
        setProductQuotes(pQuotes);
      }
      if (customRes.data.success) {
        cQuotes = customRes.data.quotes || [];
        setCustomQuotes(cQuotes);
      }

      // Sync active selected quote if it's set
      if (selectedQuote) {
        const listToSearch = activeTab === "product" ? pQuotes : cQuotes;
        const found = listToSearch.find(q => q._id === selectedQuote._id);
        if (found) {
          setSelectedQuote(found);
        }
      }
    } catch (error) {
      console.error("Error fetching quote inquiries:", error);
      toast.error("Failed to fetch quote history.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchInquiries();
    }
  }, [user]);

  // Clean selected chat when switching tabs
  useEffect(() => {
    setSelectedQuote(null);
    setShowMobileChat(false);
  }, [activeTab]);

  // Autoscroll to bottom of chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedQuote?.crmNotes, showMobileChat]);

  const handleUpdateCustomStatus = async (quoteId, status) => {
    if (!window.confirm(`Are you sure you want to mark this quotation as ${status.toLowerCase()}?`)) return;

    try {
      const res = await api.patch(`/custom-quote/status/${quoteId}`, { status });
      if (res.data && res.data.success) {
        toast.success(`Quote marked as ${status.toLowerCase()}`);
        // Refresh custom quotes
        const customRes = await api.get("/custom-quote/my-quotes");
        if (customRes.data.success) {
          const updatedQuotes = customRes.data.quotes || [];
          setCustomQuotes(updatedQuotes);
          // Sync selected quote if it was the one modified
          if (selectedQuote && selectedQuote._id === quoteId) {
            const found = updatedQuotes.find(q => q._id === quoteId);
            if (found) setSelectedQuote(found);
          }
        }
      }
    } catch (error) {
      console.error("Status update error:", error);
      toast.error("Failed to update status.");
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!selectedQuote || !messageText.trim()) return;

    setIsSubmitting(true);
    try {
      const endpoint = activeTab === "product"
        ? `/quote/comment/client/${selectedQuote._id}`
        : `/custom-quote/comment/client/${selectedQuote._id}`;

      const res = await api.post(endpoint, { remarks: messageText.trim() });
      if (res.data.success) {
        const updated = res.data.quote;
        setSelectedQuote(updated);

        // Update in active lists for list view sync
        if (activeTab === "product") {
          setProductQuotes(prev => prev.map(q => q._id === updated._id ? updated : q));
        } else {
          setCustomQuotes(prev => prev.map(q => q._id === updated._id ? updated : q));
        }

        setMessageText("");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderChatBox = (isMobile = false, onCloseMobile = null) => {
    if (!selectedQuote) {
      return (
        <div className="h-full flex flex-col items-center justify-center bg-white border border-slate-200/60 rounded-2xl p-8 text-center shadow-sm">
          <div className="w-16 h-16 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mb-4 shadow-inner">
            <FaComments size={28} className="animate-pulse" />
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-1">Select a Quotation Request</h3>
          <p className="text-slate-500 text-xs max-w-xs leading-relaxed">
            Choose a quote inquiry from the left to review the technical details and chat directly with our sales team.
          </p>
        </div>
      );
    }

    const assignedName = selectedQuote.assignedTo?.name || selectedQuote.assignedTo || null;
    const chatNotes = selectedQuote.crmNotes || [];

    return (
      <div className="flex flex-col h-full bg-[#efeae2] border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {/* Chat Header */}
        <div className="px-4 py-3 bg-[#f0f2f5] border-b border-slate-250 flex items-center justify-between flex-shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-3">
            {isMobile && (
              <button
                onClick={onCloseMobile}
                className="p-2 -ml-2 text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 rounded-lg transition"
                title="Go Back"
              >
                <FaArrowLeft size={16} />
              </button>
            )}
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
              {selectedQuote.userDetails?.name?.substring(0, 2).toUpperCase() || "QT"}
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-1.5 leading-none">
                <span>Quote #{selectedQuote.quoteNumber.split("-")[1] || selectedQuote.quoteNumber}</span>
                <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full border ${getStatusBadge(selectedQuote.status)}`}>
                  {selectedQuote.status}
                </span>
              </h4>
              <p className="text-[10px] text-slate-500 mt-1 leading-none">
                {assignedName ? `Agent: ${assignedName}` : "Awaiting representative"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchInquiries(true)}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 rounded-lg transition cursor-pointer"
              title="Refresh Chat"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 animate-hover-spin">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </button>
            {isMobile && (
              <button
                onClick={onCloseMobile}
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 rounded-lg transition text-sm font-bold"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Chat Message Scrollport */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#efeae2] flex flex-col">
          {/* Request Creation Label */}
          <div className="flex justify-center my-1.5">
            <span className="bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[9px] font-bold text-slate-500 shadow-sm border border-slate-250/40 uppercase tracking-wider">
              Request Sent • {new Date(selectedQuote.createdAt).toLocaleDateString()}
            </span>
          </div>

          {/* Engineers' Notes (System Sticky Card) */}
          {selectedQuote.adminNotes && (
            <div className="flex justify-center my-1.5">
              <div className="bg-amber-50/95 backdrop-blur-sm px-4 py-3 rounded-xl text-xs text-slate-700 border border-amber-200/50 shadow-sm max-w-[90%] space-y-1">
                <span className="font-extrabold text-amber-800 text-[10px] uppercase tracking-wider block">🔧 Support Representative Note</span>
                <p className="leading-relaxed font-medium text-slate-650">{renderNotesWithLinks(selectedQuote.adminNotes)}</p>
              </div>
            </div>
          )}

          {/* Chat Messages */}
          {chatNotes.length === 0 ? (
            <div className="flex-1 flex items-center justify-center py-10">
              <span className="bg-white/95 backdrop-blur-sm px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 text-center shadow-sm max-w-xs leading-relaxed">
                Start chatting! Send a message below to request pricing revisions or updates.
              </span>
            </div>
          ) : (
            chatNotes.map((note, idx) => {
              const isMe = 
                note.role === "client" || 
                (note.role !== "admin" && (
                  !note.author ||
                  String(note.author).toLowerCase() === "client" ||
                  String(note.author).trim().toLowerCase() === String(user?.name || "").trim().toLowerCase()
                ));
              const bubbleClass = isMe
                ? "bg-[#d9fdd3] text-slate-900 rounded-tr-none border-[#b7e9b0] ml-auto"
                : "bg-white text-slate-800 rounded-tl-none border-slate-250/60 mr-auto";

              return (
                <div key={idx} className={`flex w-full ${isMe ? "justify-end" : "justify-start"}`}>
                  <div className={`p-3.5 rounded-2xl border text-xs max-w-[85%] relative min-w-[140px] pb-6 shadow-sm ${bubbleClass}`}>
                    <div className="flex justify-between items-center text-[9px] text-slate-400 mb-1 font-bold">
                      <span>{isMe ? "You" : (note.author || "Sales Team")}</span>
                    </div>
                    <p className="leading-relaxed whitespace-pre-wrap font-medium pb-0.5 break-words">
                      {renderNotesWithLinks(note.remarks)}
                    </p>
                    <span className="absolute bottom-1 right-2 text-[8px] text-slate-400 font-bold">
                      {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Dock */}
        <form onSubmit={handleSendMessage} className="p-3 bg-[#f0f2f5] border-t border-slate-200 flex gap-2 items-center flex-shrink-0">
          <input
            type="text"
            placeholder="Ask sales team or write message..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2.5 text-sm bg-white border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/25 text-slate-800 font-semibold disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={isSubmitting || !messageText.trim()}
            className="p-3 bg-[#00a884] hover:bg-[#008f72] disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-full transition shadow-sm flex items-center justify-center cursor-pointer w-[42px] h-[42px] flex-shrink-0"
            title="Send Message"
          >
            {isSubmitting ? (
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <FaPaperPlane size={14} className="transform rotate-0" />
            )}
          </button>
        </form>
      </div>
    );
  };

  return (
    <div className="min-h-screen md:h-[calc(100vh-80px)] md:overflow-hidden px-4 py-6 font-sans bg-slate-50 sm:px-6 lg:px-8 max-md:py-6 max-md:pb-28 flex flex-col justify-between">
      <div className="max-w-[95%] lg:max-w-[92%] xl:max-w-[1500px] mx-auto w-full flex-1 flex flex-col overflow-hidden min-h-0">
        
        {/* Header */}
        <div className="mb-8 text-center max-md:mb-6">
          <h1 className="mb-3 text-4xl font-extrabold tracking-tight text-slate-800 bg-clip-text sm:text-5xl bg-gradient-to-r from-blue-600 to-indigo-600 max-md:text-3xl max-md:mb-1">
            My Quote Inquiries
          </h1>
          <p className="max-w-2xl mx-auto text-sm text-slate-500">
            Track evaluation status, chat with the sales team, and manage your quotation requests in one place.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex justify-center mb-8">
          <div className="flex bg-slate-200/60 p-1 rounded-2xl border border-slate-300/40">
            <button
              onClick={() => setActiveTab("product")}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                activeTab === "product"
                  ? "bg-white text-blue-600 shadow-md"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              <FaFileInvoiceDollar /> Product Quotes ({productQuotes.length})
            </button>
            <button
              onClick={() => setActiveTab("custom")}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                activeTab === "custom"
                  ? "bg-white text-indigo-600 shadow-md"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              <FaHistory /> Custom Designs ({customQuotes.length})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 bg-white border border-slate-200/60 shadow-sm rounded-2xl">
            <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="mt-4 text-xs font-semibold text-slate-500 tracking-widest uppercase">Loading Inquiries...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch flex-1 overflow-hidden min-h-0 max-md:h-auto max-md:overflow-visible pb-4">
            
            {/* Left Column: Quotes Lists */}
            <div className="md:col-span-7 lg:col-span-8 space-y-4 md:h-full md:overflow-y-auto pr-2 max-md:h-auto max-md:overflow-visible">
              {activeTab === "product" ? (
                productQuotes.length === 0 ? (
                  <div className="p-12 text-center bg-white border border-slate-200/60 shadow-sm rounded-2xl">
                    <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 text-2xl text-slate-400 bg-slate-50 border border-slate-100 rounded-2xl">
                      <FaFileInvoiceDollar />
                    </div>
                    <h3 className="mb-2 text-lg font-bold text-slate-800">No Product Quotes Found</h3>
                    <p className="text-slate-500 max-w-sm mx-auto text-sm mb-6">You have not submitted any product quote requests yet.</p>
                    <Link to="/products" className="inline-block px-6 py-2.5 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-md text-xs">
                      Browse Products
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {productQuotes.map((quote) => (
                      <div
                        key={quote._id}
                        onClick={() => {
                          setSelectedQuote(prev => prev?._id === quote._id ? null : quote);
                        }}
                        className={`p-6 bg-white border rounded-2xl transition cursor-pointer flex flex-col gap-4 shadow-sm ${
                          selectedQuote?._id === quote._id
                            ? "border-blue-500 ring-2 ring-blue-500/10"
                            : "border-slate-200 hover:border-slate-300 hover:shadow"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-extrabold text-slate-800 uppercase">#{quote.quoteNumber.split("-")[1] || quote.quoteNumber}</span>
                              <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase border ${getStatusBadge(quote.status)}`}>
                                {quote.status}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 space-y-1">
                              <p className="flex items-center gap-1">
                                <FaCalendarAlt size={10} className="text-slate-400" />
                                <span>Submitted: {new Date(quote.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}</span>
                              </p>
                              <p>Items Requested: <span className="font-semibold text-slate-700">{quote.requestedItems?.length || 0} items</span></p>
                              {quote.finalTotal > 0 && (
                                <p className="text-sm font-semibold text-slate-800">
                                  Estimated Amount: <span className="text-blue-600">₹ {quote.finalTotal.toLocaleString("en-IN")}</span>
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-start sm:self-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedQuote(quote);
                                setShowMobileChat(true);
                              }}
                              className="flex items-center gap-1 px-4 py-2 border border-blue-200 hover:bg-blue-50/50 text-blue-600 font-bold text-xs rounded-xl transition cursor-pointer md:hidden shadow-sm"
                            >
                              <FaComments /> Chat
                            </button>
                            <Link
                              to={`/quote/${quote.quoteToken}`}
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 text-slate-700 hover:text-blue-600 font-bold text-xs rounded-xl transition cursor-pointer shadow-sm bg-white"
                            >
                              Details <FaChevronRight size={10} />
                            </Link>
                          </div>
                        </div>

                        {selectedQuote?._id === quote._id && (
                          <div className="pt-4 border-t border-slate-150 space-y-3 w-full">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Requested Items Detail</p>
                            <div className="space-y-2">
                              {quote.requestedItems?.map((item, idx) => (
                                <div key={idx} className="bg-slate-50 border border-slate-200/55 p-3 rounded-xl space-y-1.5">
                                  <div className="flex justify-between items-start">
                                    <span className="text-xs font-bold text-slate-800">{item.name}</span>
                                    <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">Qty: {item.quantity}</span>
                                  </div>
                                  {renderItemSpecs(item)}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )
              ) : (
                customQuotes.length === 0 ? (
                  <div className="p-12 text-center bg-white border border-slate-200/60 shadow-sm rounded-2xl">
                    <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 text-2xl text-slate-400 bg-slate-50 border border-slate-100 rounded-2xl">
                      <FaHistory />
                    </div>
                    <h3 className="mb-2 text-lg font-bold text-slate-800">No Custom Design Inquiries Found</h3>
                    <p className="text-slate-500 max-w-sm mx-auto text-sm mb-6">You have not submitted any custom design requests yet.</p>
                    <Link to="/custom-design-quotation" className="inline-block px-6 py-2.5 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-md text-xs">
                      Request Custom Quote
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {customQuotes.map((quote) => {
                      const isPending = quote.status === "Pending";
                      const isResponded = quote.status === "Responded";
                      const isAccepted = quote.status === "Accepted";
                      const isRejected = quote.status === "Rejected";

                      return (
                        <div
                          key={quote._id}
                          onClick={() => {
                            setSelectedQuote(prev => prev?._id === quote._id ? null : quote);
                          }}
                          className={`p-6 bg-white border rounded-2xl transition cursor-pointer flex flex-col gap-6 shadow-sm ${
                            selectedQuote?._id === quote._id
                              ? "border-indigo-500 ring-2 ring-indigo-500/10"
                              : "border-slate-200 hover:border-slate-300 hover:shadow"
                          }`}
                        >
                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                            <div className="flex-1 space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <span className="text-sm font-extrabold text-slate-800 uppercase">#{quote.quoteNumber.split("-")[1] || quote.quoteNumber}</span>
                                  <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase border ${getStatusBadge(quote.status)}`}>
                                    {quote.status}
                                  </span>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedQuote(quote);
                                    setShowMobileChat(true);
                                  }}
                                  className="md:hidden flex items-center gap-1 px-3 py-1.5 border border-indigo-200 text-indigo-600 font-bold text-xs rounded-xl shadow-sm hover:bg-indigo-50"
                                >
                                  <FaComments /> Chat
                                </button>
                              </div>

                              <div className="text-xs text-slate-500 space-y-1">
                                <p className="flex items-center gap-1">
                                  <FaCalendarAlt size={10} className="text-slate-400" />
                                  <span>Requested: {new Date(quote.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}</span>
                                </p>
                                <p className="font-medium text-slate-700">
                                  Address: <span className="text-slate-500 font-normal">{quote.userDetails?.address}</span>
                                </p>
                              </div>

                              {/* Detailed Custom Designs list when selected */}
                              {selectedQuote?._id === quote._id ? (
                                <div className="mt-4 pt-4 border-t border-slate-150 space-y-3 w-full">
                                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Design Specifications</p>
                                  <div className="space-y-3">
                                    {quote.designs?.map((d, i) => (
                                      <div key={i} className="bg-slate-50 border border-slate-200/55 p-3.5 rounded-xl space-y-2.5 text-xs text-slate-600">
                                        <div className="flex justify-between items-start">
                                          <span className="font-bold text-slate-800 text-sm">{d.designName}</span>
                                          <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-bold uppercase">{d.ledType} LED</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] font-semibold text-slate-500">
                                          <div>📏 Size: <span className="text-slate-800 font-bold">{d.length} x {d.width} ft</span></div>
                                          <div>🎨 Sheet Color: <span className="text-slate-800 font-bold">{d.sheetColor}</span></div>
                                          <div>📏 Thickness: <span className="text-slate-800 font-bold">{d.thickness} mm</span></div>
                                          <div>📅 Needed: <span className="text-slate-800 font-bold">{new Date(d.requiredDate).toLocaleDateString()}</span></div>
                                        </div>
                                        {d.specialInstructions && (
                                          <div className="bg-amber-50 border border-amber-200/50 p-2.5 rounded text-[11px] text-amber-950 leading-relaxed font-medium">
                                            <span className="font-bold block mb-0.5">Special Instructions:</span>
                                            {d.specialInstructions}
                                          </div>
                                        )}
                                        {d.referenceUrl && (
                                          <div className="pt-1">
                                            <a 
                                              href={d.referenceUrl} 
                                              target="_blank" 
                                              rel="noreferrer"
                                              className="text-blue-600 hover:text-blue-800 font-bold text-[10px] inline-flex items-center gap-1 transition"
                                            >
                                              View Reference Upload ↗
                                            </a>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                /* Simple Displays Designs list when not selected */
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {quote.designs?.map((d, i) => (
                                    <span key={i} className="px-2.5 py-1 bg-slate-50 rounded-lg text-xs font-semibold text-slate-600 border border-slate-200/60">
                                      {d.designName} ({d.length} x {d.width} ft)
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col items-start md:items-end gap-3 min-w-[180px] self-center md:self-start">
                              {isPending && (
                                <div className="flex items-center gap-1.5 text-xs text-slate-400 italic">
                                  <FaInfoCircle /> Technical evaluation...
                                </div>
                              )}

                              {isResponded && (
                                <div className="space-y-3 w-full text-left md:text-right" onClick={(e) => e.stopPropagation()}>
                                  <p className="text-xs text-slate-500 font-medium">Offered Custom Price:</p>
                                  <p className="text-2xl font-black text-cyan-600">₹ {(quote.offeredPrice || 0).toLocaleString("en-IN")}</p>
                                  
                                  <div className="flex gap-2 justify-start md:justify-end mt-3">
                                    <button
                                      onClick={() => handleUpdateCustomStatus(quote._id, "Accepted")}
                                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition cursor-pointer shadow-md"
                                    >
                                      <FaCheckCircle /> Accept
                                    </button>
                                    <button
                                      onClick={() => handleUpdateCustomStatus(quote._id, "Rejected")}
                                      className="flex items-center gap-1.5 px-4 py-2 bg-red-650 hover:bg-red-700 text-white font-bold text-xs rounded-lg transition cursor-pointer shadow-md"
                                    >
                                      <FaTimesCircle /> Decline
                                    </button>
                                  </div>
                                </div>
                              )}

                              {isAccepted && (
                                <div className="text-left md:text-right">
                                  <p className="text-xs text-slate-500 font-semibold">Agreed Price:</p>
                                  <p className="text-2xl font-bold text-emerald-600">₹ {(quote.offeredPrice || 0).toLocaleString("en-IN")}</p>
                                  <p className="text-xs text-emerald-600 font-bold mt-1">✓ Quotation Approved</p>
                                </div>
                              )}

                              {isRejected && (
                                <div className="text-left md:text-right">
                                  <p className="text-xs text-slate-500">Offered Price:</p>
                                  <p className="text-lg font-bold text-red-600 line-through">₹ {(quote.offeredPrice || 0).toLocaleString("en-IN")}</p>
                                  <p className="text-xs text-red-600 font-bold mt-1">✗ Declined</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              )}
            </div>

            {/* Right Column: Chat Box Sticky Workspace */}
            <div className="md:col-span-5 lg:col-span-4 hidden md:block h-full overflow-hidden">
              {renderChatBox()}
            </div>

          </div>
        )}

        {/* Mobile Fullscreen Chat Drawer */}
        {showMobileChat && selectedQuote && (
          <div className="fixed inset-0 z-50 flex flex-col bg-[#efeae2] md:hidden">
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {renderChatBox(true, () => {
                setShowMobileChat(false);
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default QuoteInquiries;
