import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaSave, FaFilePdf, FaCopy, FaWhatsapp, FaCheckCircle, FaUserTag, FaComments } from "react-icons/fa";
import api from "../../utils/api"; 
import { toast } from "react-hot-toast";

import CustomerInfo from "./CustomerInfo";
import PricingTable from "./PricingTable";
import OrderSummary from "./OrderSummary";
import ClientNotesModal from "../components/ClientNotesModal.jsx";

const getAuthorColor = (name) => {
  const colors = [
    "text-teal-650",
    "text-blue-600",
    "text-purple-650",
    "text-orange-600",
    "text-pink-600",
    "text-indigo-600",
    "text-rose-600"
  ];
  if (!name) return "text-blue-650";
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

const QuoteEditor = () => {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const isNewQuote = id === "new";
  
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);

  const [shareLink, setShareLink] = useState("");
  const [copied, setCopied] = useState(false);

  const [customerData, setCustomerData] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    address: "", 
    message: "",
  });

  const [items, setItems] = useState([]);

  const [quoteData, setQuoteData] = useState({
    extraDiscountType: "flat",
    extraDiscountValue: 0,
    shippingCharge: 0,
    gstPercentage: 18,
    additionalChargeName: "",
    additionalChargeAmount: 0,
    adminNotes: "",
  });

  const [assignedTo, setAssignedTo] = useState("");
  const [crmNotes, setCrmNotes] = useState([]);
  const [salesTeam, setSalesTeam] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isCommentPublic, setIsCommentPublic] = useState(false);
  const [addingComment, setAddingComment] = useState(false);
  const [showClientNotes, setShowClientNotes] = useState(false);

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

  // ---------------------------------------------------------
  // 🧮 EXCEL-BASED DYNAMIC GST & MATH CALCULATION
  // ---------------------------------------------------------
  
  // 1. Total Subtotal (Bina GST aur discount ke)
  const subTotal = items.reduce((sum, item) => sum + (Number(item.offeredPrice) * Number(item.quantity)), 0);
  
  // 2. Total Discount
  const discountAmount = quoteData.extraDiscountType === "percent" 
        ? (subTotal * (Number(quoteData.extraDiscountValue) / 100)) 
        : Number(quoteData.extraDiscountValue);

  // 3. Har item ka alag-alag GST calculate karna (Excel data se)
  let totalGstAmount = 0;

  items.forEach(item => {
      const itemTotal = Number(item.offeredPrice) * Number(item.quantity);
      // Global discount ko har item par barabar baantna
      const itemDiscount = subTotal > 0 ? (itemTotal / subTotal) * discountAmount : 0;
      const itemTaxableAmount = itemTotal - itemDiscount;
      
      // Excel se aaya hua GST % (Agar Excel me field 'gstRate' ya 'GST' nahi hai toh quoteData.gstPercentage use karega)
      const itemGstPercent = Number(item.gstRate || item.GST || item.product?.gstRate || item.product?.GST || quoteData.gstPercentage || 18); 
      
      totalGstAmount += itemTaxableAmount * (itemGstPercent / 100);
  });

  // 4. Final Total Bill
  const finalTotal = subTotal 
        - discountAmount 
        + Number(quoteData.shippingCharge) 
        + totalGstAmount 
        + Number(quoteData.additionalChargeAmount);

  // ---------------------------------------------------------

  // Fetch Real Data from Backend
  useEffect(() => {
    const fetchQuoteDetails = async () => {
      if (isNewQuote) {
        setFetchLoading(false);
        setItems([]);
        return;
      }

      try {
        setFetchLoading(true);
        const response = await api.get(`/quote/admin/${id}`); 
        const realQuote = response.data.quote || response.data; 

        setCustomerData({
          name: realQuote.userDetails?.name || "",
          company: realQuote.userDetails?.company || "",
          email: realQuote.userDetails?.email || "",
          phone: realQuote.userDetails?.phone || "",
          address: realQuote.userDetails?.address || "",
          message: realQuote.userDetails?.message || "",
        });

        const formattedItems = (realQuote.requestedItems || []).map(item => ({
          ...item,
          _id: item._id || item.productId || Date.now().toString(),
          name: item.product?.name || item.name || "Unknown Product", 
          quantity: Number(item.quantity) || 1,
          originalPrice: Number(item.originalPrice) || Number(item.basePrice) || 0,
          offeredPrice: Number(item.offeredPrice) || Number(item.originalPrice) || 0,
          // DB se GST field le raha hai (purane quotes ke liye)
          gstRate: item.gstRate || item.GST || item.product?.gstRate || item.product?.GST || 18,
        }));
        setItems(formattedItems);

        setQuoteData({
          extraDiscountType: realQuote.extraDiscountType || "flat",
          extraDiscountValue: Number(realQuote.extraDiscountValue) || 0,
          shippingCharge: Number(realQuote.shippingCharge) || 0,
          gstPercentage: realQuote.gstPercentage || 18,
          additionalChargeName: realQuote.additionalChargeName || "",
          additionalChargeAmount: Number(realQuote.additionalChargeAmount) || 0,
          adminNotes: realQuote.adminNotes || "",
        });

        setAssignedTo(realQuote.assignedTo?._id || realQuote.assignedTo || "");
        setCrmNotes(realQuote.crmNotes || []);

        if (realQuote.quoteToken) {
           const baseUrl = window.location.origin;
           setShareLink(`${baseUrl}/quote/${realQuote.quoteToken}`);
        }

        if (["Accepted", "Rejected"].includes(realQuote.status)) {
            setIsViewOnly(true);
        }

      } catch (error) {
        console.error("Error fetching quote details:", error);
        alert("Failed to load quote details.");
      } finally {
        setFetchLoading(false);
      }
    };

    fetchQuoteDetails();
  }, [id, isNewQuote]);

  const handleUpdateCustomerField = (field, value) => {
    setCustomerData((prev) => ({ ...prev, [field]: value }));
  };

  const handleUpdateQuoteField = (field, value) => {
    setQuoteData((prev) => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (itemId, field, value) => {
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item._id !== itemId) return item;
        if (typeof field === "object") return { ...item, ...field }; 
        return { ...item, [field]: value };
      })
    );
  };

  const handleAddItem = (newConfiguredProduct) => {
    if (!newConfiguredProduct || !newConfiguredProduct.productId) return;

    setItems((prev) => [
      ...prev,
      {
        ...newConfiguredProduct,
        _id: Date.now().toString(),
        gstRate: newConfiguredProduct.gstRate || newConfiguredProduct.GST || 18, 
      },
    ]);
  };

  const handleRemoveItem = (itemId) => {
    setItems((prev) => prev.filter((item) => item._id !== itemId));
  };

  // Save / Update Logic
  const handleSaveQuote = async () => {
    if (items.length === 0) return alert("Please add at least one item to the quotation.");
    if (!customerData.name || !customerData.phone) return alert("Customer Name and Phone are required.");

    setLoading(true);
    
    const finalPayload = {
      userDetails: customerData,
      clientDetails: customerData,
      requestedItems: items,
      totalDiscount: discountAmount, 
      extraDiscountType: quoteData.extraDiscountType,
      extraDiscountValue: quoteData.extraDiscountValue,
      shippingCharge: quoteData.shippingCharge,
      gstPercentage: Number(quoteData.gstPercentage) || 0,
      additionalChargeName: quoteData.additionalChargeName,
      additionalChargeAmount: quoteData.additionalChargeAmount,
      finalTotal: finalTotal,
      totalGstAmount: totalGstAmount, // 👈 Backend ko bhejne ke liye 
      adminNotes: quoteData.adminNotes,
      assignedTo: assignedTo || null,
    };

    try {
        let responseData;
        if(isNewQuote){
           const res = await api.post(`/quote/manual`, finalPayload);
           responseData = res.data;
           alert("Manual Quote Created Successfully! 🎉");
        } else {
           const res = await api.put(`/quote/respond/${id}`, finalPayload);
           responseData = res.data;
           alert("Quote Updated Successfully! 🎉");
        }
        
        if (responseData && (responseData.quoteToken || responseData.quote?.quoteToken)) {
            const token = responseData.quoteToken || responseData.quote.quoteToken;
            setShareLink(`${window.location.origin}/quote/${token}`);
            
            const newQuoteId = responseData.quoteId || responseData.quote?._id;
            if (newQuoteId && String(newQuoteId) !== String(id)) {
               navigate(`/admin/quotes/${newQuoteId}`, { replace: true });
            }
        }
        
    } catch (error) {
        console.error("Error saving quote:", error);
        if (error.response?.status === 409 && error.response?.data?.latestQuoteId) {
            alert("This is an older version of the quote. Redirecting you to the latest version...");
            navigate(`/admin/quotes/${error.response.data.latestQuoteId}`, { replace: true });
        } else {
            alert(error.response?.data?.message || "Failed to save quote.");
        }
    } finally {
        setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!shareLink) return;
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAssign = async (userId) => {
    setAssignedTo(userId);
    if (isNewQuote) return;
    try {
      await api.put(`/quote/assign/${id}`, { assignedTo: userId });
      toast.success("Quote assigned successfully!");
    } catch (error) {
      console.error("Failed to assign quote:", error);
      toast.error("Failed to assign quote.");
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setAddingComment(true);
    try {
      const res = await api.post(`/quote/comment/${id}`, { remarks: newComment, isPublic: true });
      if (res.data.success) {
        toast.success("Message sent!");
        setCrmNotes(res.data.quote.crmNotes || []);
        setNewComment("");
      }
    } catch (error) {
      console.error("Failed to add comment:", error);
      toast.error("Failed to add comment.");
    } finally {
      setAddingComment(false);
    }
  };

  if (fetchLoading) {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-lg font-medium text-gray-500 animate-pulse">Loading quote details...</p>
        </div>
      );
  }

  return (
    <div className="max-w-6xl p-4 mx-auto md:p-6 lg:p-8">
      {/* 🌟 Header Actions */}
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate("/admin/quotes")}
            className="p-2 text-gray-500 transition-colors bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-900"
          >
            <FaArrowLeft />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isNewQuote ? "Create Manual Quote" : `Edit Quote #${id.substring(0, 6)}...`}
            </h1>
            <p className="text-sm text-gray-500">Update details and apply discounts.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!isNewQuote && (
            <button
              onClick={() => setShowClientNotes(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-250 text-amber-800 font-bold text-xs rounded-xl shadow-sm cursor-pointer transition-all active:scale-95 z-20"
            >
              📝 Client CRM Notes
            </button>
          )}
          {!isNewQuote && (
             <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
               <input 
                 type="checkbox" 
                 checked={isViewOnly} 
                 onChange={(e) => setIsViewOnly(e.target.checked)}
                 className="w-4 h-4 accent-amber-600"
               />
               Lock Quote
             </label>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <CustomerInfo
          customerData={customerData}
          onUpdateCustomerField={handleUpdateCustomerField}
          isViewOnly={isViewOnly}
        />

        {/* 🤝 CRM & Lead Assignment */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <FaUserTag size={18} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">CRM & Lead Tracking</h3>
                <p className="text-xs text-gray-500">Manage assignment and view interaction history</p>
              </div>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Assignment Section */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <span>Assigned To</span>
                </label>
                <select
                  value={assignedTo || ""}
                  onChange={(e) => handleAssign(e.target.value)}
                  disabled={isViewOnly}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-800 text-sm font-medium bg-white"
                >
                  <option value="">Unassigned</option>
                  {salesTeam.map((member) => (
                    <option key={member._id} value={member._id}>
                      {member.name} ({member.email})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1.5">
                  Assign this lead to a sales representative to track follow-ups.
                </p>
              </div>

              <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-xl">
                <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-1">CRM Status</h4>
                <p className="text-xs text-blue-700 leading-relaxed">
                  Ensure all conversations, calls, or WhatsApp responses are logged in the timeline to maintain a clear audit trail.
                </p>
              </div>
            </div>

            {/* Notes / Timeline Section (WhatsApp Style) */}
            <div className="flex flex-col h-[450px] border-t md:border-t-0 md:border-l border-slate-200 pt-6 md:pt-0 md:pl-6 overflow-hidden">
              <div className="flex items-center gap-1.5 text-sm font-bold text-gray-700 mb-3 flex-shrink-0">
                <FaComments className="text-gray-400" />
                <span>Discussion History Log ({crmNotes.length})</span>
              </div>

              {/* WhatsApp Chat Area */}
              <div className="flex-1 overflow-y-auto space-y-3 p-4 bg-[#efeae2] rounded-xl border border-slate-200">
                {crmNotes.length === 0 ? (
                  <div className="flex justify-center items-center h-full">
                    <span className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl text-xs font-medium text-slate-400 text-center shadow-sm max-w-xs">
                      No discussion logs yet. Use the chat bar below to record a call note or status update.
                    </span>
                  </div>
                ) : (
                  crmNotes.map((note, idx) => {
                    const isClient = 
                      note.role === "client" || 
                      (note.role !== "admin" && (
                        !note.author ||
                        String(note.author).toLowerCase() === "client" ||
                        String(note.author).trim().toLowerCase() === String(customerData?.name || "").trim().toLowerCase()
                      ));
                    const bubbleBg = isClient 
                      ? "bg-white text-slate-800 rounded-tl-none border-slate-200 shadow-sm" 
                      : "bg-[#d9fdd3] text-slate-900 rounded-tr-none border-[#b7e9b0] shadow-sm";

                    return (
                      <div 
                        key={idx} 
                        className={`flex w-full mb-3 ${isClient ? "justify-start" : "justify-end"}`}
                      >
                        <div className={`p-3 rounded-2xl border text-xs max-w-[85%] relative min-w-[130px] ${bubbleBg}`}>
                          
                          {/* Sender Name */}
                          <div className="flex items-center gap-4 mb-1 justify-between text-[9px] font-bold">
                            <span className={getAuthorColor(note.author)}>{note.author || "Sales Rep"}</span>
                          </div>

                          {/* Remarks */}
                          <p className="font-medium whitespace-pre-wrap break-words leading-relaxed pb-3 text-slate-800">
                            {note.remarks}
                          </p>

                          {/* Timestamp inside bubble bottom right */}
                          <span className="absolute bottom-1 right-2 text-[8px] text-slate-400 font-semibold">
                            {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Add Comment Form */}
              {isNewQuote ? (
                <div className="text-xs text-gray-400 bg-slate-50 p-4 rounded-xl border border-dashed border-slate-200 text-center mt-3">
                  Comments can be logged after the quote is saved.
                </div>
              ) : (
                <form onSubmit={handleAddComment} className="flex flex-col gap-2 mt-3 bg-[#f0f2f5] p-3 rounded-xl border border-slate-200">
                  <div className="flex gap-2 items-center">
                    <div className="flex-1 bg-white border border-slate-200 rounded-xl flex items-center px-2 py-0.5 shadow-sm">
                      <textarea
                        rows="1"
                        placeholder="Log client call, email remark..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        disabled={isViewOnly || addingComment}
                        className="flex-1 px-2 py-1.5 text-xs focus:outline-none text-slate-800 resize-none min-h-[34px] max-h-[80px]"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleAddComment(e);
                          }
                        }}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isViewOnly || addingComment || !newComment.trim()}
                      className="p-2.5 bg-[#00a884] hover:bg-[#008f72] disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-full transition shadow-sm flex items-center justify-center cursor-pointer w-[38px] h-[38px] flex-shrink-0"
                      title="Send Note"
                    >
                      {addingComment ? (
                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 transform rotate-90">
                          <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <div className="flex items-center justify-between px-1 text-slate-500">
                    <span className="text-[9px] text-slate-400 italic">Press Enter to send, Shift+Enter for new line.</span>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        <PricingTable
          items={items}
          onItemChange={handleItemChange}
          onAddItem={handleAddItem} 
          onRemoveItem={handleRemoveItem}
          isViewOnly={isViewOnly}
        />

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          
          <div className="flex flex-col w-full gap-6 mt-6 lg:w-1/2 lg:mt-12">
            <div className="flex flex-wrap gap-3">
              {!isViewOnly && (
                <button 
                  onClick={handleSaveQuote}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 font-bold text-white transition-all bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 disabled:opacity-70"
                >
                  <FaSave /> {loading ? "Saving to Database..." : "Save Quote"}
                </button>
              )}
              <button className="flex items-center gap-2 px-6 py-3 font-bold text-gray-700 transition-all bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50">
                <FaFilePdf className="text-red-500" /> Generate PDF
              </button>
            </div>

            {shareLink && (
              <div className="p-5 mt-4 border shadow-sm bg-emerald-50 border-emerald-200 rounded-xl">
                <h4 className="mb-2 text-sm font-bold text-emerald-800">🔗 Shareable Quotation Link</h4>
                <p className="mb-4 text-xs text-emerald-600">Send this link to the customer to view and accept the quote.</p>
                
                <div className="flex items-center gap-2 bg-white p-1.5 rounded-lg border border-emerald-200 shadow-inner">
                  <input 
                    type="text" 
                    readOnly 
                    value={shareLink} 
                    className="w-full px-3 text-sm font-medium text-gray-700 bg-transparent outline-none select-all"
                  />
                  <button 
                    onClick={handleCopyLink}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-bold text-white rounded-md transition-colors ${copied ? 'bg-emerald-500' : 'bg-gray-800 hover:bg-black'}`}
                  >
                    {copied ? <><FaCheckCircle /> Copied!</> : <><FaCopy /> Copy</>}
                  </button>
                </div>

                {customerData.phone && (
                  <a 
                    href={`https://wa.me/${customerData.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello ${customerData.name},\n\nHere is your requested quotation. You can view it here:\n${shareLink}\n\nThank you!`)}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-4 text-sm font-bold text-emerald-700 hover:text-emerald-900 hover:underline"
                  >
                    <FaWhatsapp size={18} /> Send via WhatsApp
                  </a>
                )}
              </div>
            )}
          </div>

          <OrderSummary
            items={items}
            quoteData={quoteData}
            onUpdateQuoteField={handleUpdateQuoteField}
            isViewOnly={isViewOnly}
            // Passing explicitly calculated values to OrderSummary 
            calculatedSubTotal={subTotal}
            calculatedDiscount={discountAmount}
            calculatedGst={totalGstAmount}
            calculatedFinalTotal={finalTotal}
          />
        </div>
      </div>
      {showClientNotes && (
        <ClientNotesModal
          isOpen={showClientNotes}
          onClose={() => setShowClientNotes(false)}
          clientName={customerData.name}
          clientEmail={customerData.email}
          clientPhone={customerData.phone}
        />
      )}
    </div>
  );
};

export default QuoteEditor;