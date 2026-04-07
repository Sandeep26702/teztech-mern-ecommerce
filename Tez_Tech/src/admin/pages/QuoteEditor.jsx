import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaSave, FaFilePdf, FaCopy, FaWhatsapp, FaCheckCircle } from "react-icons/fa";
import api from "../../utils/api"; 

import CustomerInfo from "./CustomerInfo";
import PricingTable from "./PricingTable";
import OrderSummary from "./OrderSummary";

const QuoteEditor = () => {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const isNewQuote = id === "new";
  
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);

  // 🟢 NEW STATE: Generate hone wale link ko store karne ke liye
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
    gstPercentage: 0,
    additionalChargeName: "",
    additionalChargeAmount: 0,
    adminNotes: "",
  });

  const subTotal = items.reduce((sum, item) => sum + (Number(item.offeredPrice) * Number(item.quantity)), 0);
  
  const discountAmount = quoteData.extraDiscountType === "percent" 
        ? (subTotal * (Number(quoteData.extraDiscountValue) / 100)) 
        : Number(quoteData.extraDiscountValue);

  const gstAmount = (subTotal * (Number(quoteData.gstPercentage) / 100));
  
  const finalTotal = subTotal 
        - discountAmount 
        + Number(quoteData.shippingCharge) 
        + gstAmount 
        + Number(quoteData.additionalChargeAmount);

  // 1. Fetch Real Data from Backend
  useEffect(() => {
    const fetchQuoteDetails = async () => {
      if (isNewQuote) {
        setFetchLoading(false);
        // Remove empty item push. Let PricingTable be totally empty initially.
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
        }));
        setItems(formattedItems);

        setQuoteData({
          extraDiscountType: realQuote.extraDiscountType || "flat",
          extraDiscountValue: Number(realQuote.extraDiscountValue) || 0,
          shippingCharge: Number(realQuote.shippingCharge) || 0,
          gstPercentage: Number(realQuote.gstPercentage) || 0,
          additionalChargeName: realQuote.additionalChargeName || "",
          additionalChargeAmount: Number(realQuote.additionalChargeAmount) || 0,
          adminNotes: realQuote.adminNotes || "",
        });

        // 🟢 Generate Share Link for existing quote
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
      },
    ]);
  };

  const handleRemoveItem = (itemId) => {
    setItems((prev) => prev.filter((item) => item._id !== itemId));
  };

  // 3. 🚀 Save / Update Logic
  const handleSaveQuote = async () => {
    // Validation
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
      gstPercentage: quoteData.gstPercentage,
      additionalChargeName: quoteData.additionalChargeName,
      additionalChargeAmount: quoteData.additionalChargeAmount,
      finalTotal: finalTotal,
      adminNotes: quoteData.adminNotes,
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
        
        // 🟢 Update Share Link after successful save
        if (responseData && (responseData.quoteToken || responseData.quote?.quoteToken)) {
            const token = responseData.quoteToken || responseData.quote.quoteToken;
            setShareLink(`${window.location.origin}/quote/${token}`);
            
            // If it was a new quote, optionally redirect to the edit page of that new quote
            if (isNewQuote && responseData.quoteId) {
               navigate(`/admin/quotes/${responseData.quoteId}`, { replace: true });
            }
        }
        
    } catch (error) {
        console.error("Error saving quote:", error);
        alert(error.response?.data?.message || "Failed to save quote.");
    } finally {
        setLoading(false);
    }
  };

  // 🟢 Copy to Clipboard Logic
  const handleCopyLink = () => {
    if (!shareLink) return;
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

      <div className="space-y-6">
        {/* Customer Details Component */}
        <CustomerInfo
          customerData={customerData}
          onUpdateCustomerField={handleUpdateCustomerField}
          isViewOnly={isViewOnly}
        />

        {/* Pricing & Items Component */}
        <PricingTable
          items={items}
          onItemChange={handleItemChange}
          onAddItem={handleAddItem} 
          onRemoveItem={handleRemoveItem}
          isViewOnly={isViewOnly}
        />

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          
          {/* Action Buttons & Share Link Box */}
          <div className="flex flex-col w-full lg:w-1/2 gap-6 mt-6 lg:mt-12">
            
            {/* Primary Save/PDF Buttons */}
            <div className="flex flex-wrap gap-3">
              {!isViewOnly && (
                <button 
                  onClick={handleSaveQuote}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 font-bold text-white transition-all bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-70 shadow-sm"
                >
                  <FaSave /> {loading ? "Saving to Database..." : "Save Quote"}
                </button>
              )}
              <button className="flex items-center gap-2 px-6 py-3 font-bold text-gray-700 transition-all bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm">
                <FaFilePdf className="text-red-500" /> Generate PDF
              </button>
            </div>

            {/* 🟢 NEW: Share Link UI Box */}
            {shareLink && (
              <div className="p-5 mt-4 bg-emerald-50 border border-emerald-200 rounded-xl shadow-sm">
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
            {/* End of Share Link Box */}

          </div>

          {/* Order Summary Component */}
          <OrderSummary
            items={items}
            quoteData={quoteData}
            onUpdateQuoteField={handleUpdateQuoteField}
            isViewOnly={isViewOnly}
          />
        </div>
      </div>
    </div>
  );
};

export default QuoteEditor;