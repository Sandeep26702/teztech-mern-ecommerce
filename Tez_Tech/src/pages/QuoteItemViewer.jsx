import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FaCopy, FaCheckCircle, FaCube } from "react-icons/fa";
import api from "../utils/api";

const toSafeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const hasMeaningfulValue = (value) => {
  if (value === undefined || value === null) return false;
  const raw = String(value).trim();
  if (!raw) return false;
  const parsed = Number(raw);
  if (Number.isFinite(parsed) && parsed === 0) return false;
  return true;
};

const QuoteItemViewer = () => {
  const { token, itemId } = useParams();
  const [quote, setQuote] = useState(null);
  const [quoteItem, setQuoteItem] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchQuoteItem = async () => {
      try {
        const response = await api.get(`/quote/view/${token}`);
        const quoteData = response.data.quote;
        setQuote(quoteData);

        const items = Array.isArray(quoteData?.requestedItems) ? quoteData.requestedItems : [];
        const directMatch = items.find((item) => String(item?._id || "") === String(itemId || ""));
        
        if (directMatch) {
          setQuoteItem(directMatch);
          return;
        }

        const numericIndex = Number(itemId);
        if (Number.isInteger(numericIndex) && numericIndex >= 0 && numericIndex < items.length) {
          setQuoteItem(items[numericIndex]);
          return;
        }

        setQuoteItem(null);
        setError("Item not found in this quotation.");
      } catch (err) {
        console.error("Error fetching quote item:", err);
        setError(err.response?.data?.message || "Invalid or expired quotation link.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuoteItem();
  }, [token, itemId]);

  const product = quoteItem?.productId && typeof quoteItem.productId === "object" ? quoteItem.productId : null;

  const imageList = useMemo(() => {
    if (!product && !quoteItem) return [];
    const images = Array.isArray(product?.images) ? product.images : [];
    const normalized = images.map((img) => (typeof img === "string" ? img : img?.url)).filter(Boolean);
    if (normalized.length) return normalized;
    const fallback = product?.image || quoteItem?.image;
    return fallback ? [fallback] : [];
  }, [product, quoteItem]);

  const activeImage = imageList[activeImageIndex] || "https://placehold.co/900x600/f3f4f6/a1a1aa?text=No+Image";

  // Compact Variations Renderer
  const renderSelectedOptions = (item) => {
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
      <div className="flex flex-wrap gap-1.5 mt-2">
        {parts.map((p, i) => (
          <div key={i} className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-gray-700 bg-gray-100 rounded">
            <span className="tracking-widest text-gray-400 uppercase">{p.label}:</span>
            <span className="text-gray-900">{p.value}</span>
          </div>
        ))}
      </div>
    );
  };

  const specFallback = [
    { key: "Height", value: product?.heightFt },
    { key: "Width", value: product?.widthFt },
    { key: "Material", value: product?.materialType },
    { key: "Power (W)", value: product?.powerWatt },
    { key: "Warranty", value: product?.warranty },
  ];

  const specRows = (product?.details?.length ? product.details : specFallback)
    .map((item) => ({ key: String(item.key || "").trim(), value: String(item.value || "").trim() }))
    .filter((item) => item.key && hasMeaningfulValue(item.value))
    .slice(0, 6);

  const handleCopyLink = async () => {
    const link = window.location.href;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      alert("Unable to copy link. Please copy it manually.");
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen font-medium text-gray-500 bg-white">Loading item details...</div>;
  if (error) return <div className="flex flex-col items-center justify-center min-h-screen font-semibold text-red-600 bg-white">{error}</div>;
  if (!quote || !quoteItem) return null;

  // Pricing Calculations
  const basePrice = toSafeNumber(quoteItem.originalPrice, toSafeNumber(quoteItem.basePrice, 0));
  const offeredPrice = toSafeNumber(quoteItem.offeredPrice, 0);
  const discountAmount = Math.max(0, basePrice - offeredPrice);
  const discountPercent = basePrice > 0 ? Math.round((discountAmount / basePrice) * 100) : 0;
  
  const extraDiscount = toSafeNumber(quote.totalDiscount, 0);
  const shippingCharge = toSafeNumber(quote.shippingCharge, 0);
  const gstPercentage = toSafeNumber(quote.gstPercentage, 0);
  const additionalChargeAmount = toSafeNumber(quote.additionalChargeAmount, 0);
  const additionalChargeName = String(quote.additionalChargeName || "").trim() || "Extra Charge";
  
  const offeredSubTotal = (quote.requestedItems || []).reduce((sum, item) => sum + toSafeNumber(item.offeredPrice, 0) * toSafeNumber(item.quantity, 0), 0);
  const gstAmount = Math.round(offeredSubTotal * (gstPercentage / 100) * 100) / 100;
  const computedFinalTotal = Math.max(0, offeredSubTotal - extraDiscount + shippingCharge + gstAmount + additionalChargeAmount);
  const displayFinalTotal = Number.isFinite(Number(quote.finalTotal)) && Number(quote.finalTotal) > 0 ? Number(quote.finalTotal) : computedFinalTotal;

  return (
    <div className="flex items-center justify-center min-h-screen p-2 font-sans bg-gray-100 sm:p-4">
      {/* Box containing the whole view, limited height to fit on laptop screen */}
      <div className="w-full max-w-5xl overflow-hidden bg-white shadow-2xl rounded-3xl flex flex-col max-h-[96vh] md:max-h-[90vh]">
        
        {/* ================= HEADER BUTTONS ================= */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
          
          {/* UIVERSE.IO "GO BACK" BUTTON (Adapted as React Router Link) */}
          <Link to={`/quote/${token}`} className="relative flex items-center justify-center w-48 h-12 text-sm font-semibold text-center text-black transition-all bg-white border border-gray-200 rounded-2xl group hover:shadow-sm">
            <div className="bg-green-400 rounded-xl h-10 w-1/4 flex items-center justify-center absolute left-1 top-[3px] group-hover:w-[182px] z-10 duration-500">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" height="20px" width="20px">
                <path d="M224 480h640a32 32 0 1 1 0 64H224a32 32 0 0 1 0-64z" fill="#000000"></path>
                <path d="m237.248 512 265.408 265.344a32 32 0 0 1-45.312 45.312l-288-288a32 32 0 0 1 0-45.312l288-288a32 32 0 1 1 45.312 45.312L237.248 512z" fill="#000000"></path>
              </svg>
            </div>
            <p className="z-20 transition-colors duration-500 translate-x-2 group-hover:text-black">All Quotes</p>
          </Link>

          {/* PREMIUM SHARE BUTTON */}
          <button 
            onClick={handleCopyLink} 
            className={`relative flex items-center justify-center h-12 w-48 rounded-2xl font-bold text-sm transition-all duration-300 overflow-hidden ${copied ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-gray-900 text-white hover:bg-black hover:shadow-lg'}`}
          >
            <span className="relative z-10 flex items-center gap-2">
              {copied ? <><FaCheckCircle /> Link Copied!</> : <><FaCopy /> Share Link</>}
            </span>
          </button>
        </div>

        {/* ================= MAIN CONTENT (Screenshot Ready Layout) ================= */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 grid grid-cols-1 md:grid-cols-[40%_60%] gap-6">
          
          {/* LEFT COLUMN: Image & Key Specs under it */}
          <div className="flex flex-col gap-4">
            
            {/* Image Box: Reduced border, smaller height to fit screen */}
            <div className="relative flex flex-col items-center justify-center w-full bg-white border border-gray-100 rounded-2xl">
              <img 
                src={activeImage} 
                alt={quoteItem.name} 
                className="object-contain w-full h-[220px] md:h-[280px] p-2 mix-blend-multiply" 
              />
              {/* Thumbnail Gallery (Very compact) */}
              {imageList.length > 1 && (
                <div className="flex justify-center w-full gap-2 pb-2 mt-2 overflow-x-auto scrollbar-hide">
                  {imageList.map((img, index) => (
                    <button 
                      key={index} 
                      onClick={() => setActiveImageIndex(index)}
                      className={`h-10 w-10 flex-shrink-0 rounded-md overflow-hidden transition-all ${index === activeImageIndex ? "ring-2 ring-gray-900" : "opacity-60 hover:opacity-100"}`}
                    >
                      <img src={img} className="object-cover w-full h-full mix-blend-multiply bg-gray-50" alt={`thumb-${index}`}/>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Specs placed directly under Image */}
            {specRows.length > 0 && (
              <div className="p-4 border border-gray-100 bg-gray-50/50 rounded-2xl">
                <h3 className="mb-2 text-[10px] font-black tracking-widest text-gray-400 uppercase flex items-center gap-1.5">
                  <FaCube /> Key Specifications
                </h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                    {specRows.map(row => (
                        <div key={row.key} className="flex justify-between pb-1 text-xs border-b border-gray-200/50 last:border-0">
                            <span className="font-medium text-gray-500">{row.key}</span>
                            <span className="pl-2 font-bold text-gray-900 truncate" title={row.value}>{row.value}</span>
                        </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Details, Pricing & Bill Summary */}
          <div className="flex flex-col justify-between h-full gap-4">
            
            {/* Top Area: Details & Item Price */}
            <div>
              {/* Product Meta */}
              <div className="flex items-center gap-1.5 mb-1.5 text-[10px] font-black tracking-widest text-gray-400 uppercase">
                <span>{product?.sku || quoteItem.sku || "N/A"}</span>
                {product?.category && (
                  <><span>&bull;</span><span className="text-blue-500">{product.category.name || product.category}</span></>
                )}
              </div>
              
              {/* Product Name */}
              <h1 className="text-2xl font-black leading-tight tracking-tight text-gray-900 uppercase md:text-3xl">
                {quoteItem.name}
              </h1>
              
              {/* Variations */}
              {renderSelectedOptions(quoteItem)}

              {/* Seamless Inline Pricing (Compact) */}
              <div className="flex items-end justify-between pt-4 mt-4 border-t border-gray-100">
                <div>
                  <p className="text-[9px] font-bold tracking-widest text-gray-400 uppercase mb-0.5">Approved Rate</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black tracking-tight text-gray-900">₹{offeredPrice.toLocaleString("en-IN")}</span>
                    {discountPercent > 0 && (
                      <span className="text-xs font-bold text-green-500 bg-green-50 px-1.5 py-0.5 rounded">-{discountPercent}%</span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-3 text-right">
                  <div>
                    <span className="text-[9px] font-bold tracking-widest text-gray-400 uppercase block mb-0.5">Qty</span>
                    <span className="text-xl font-bold text-gray-900">{quoteItem.quantity}</span>
                  </div>
                  <div className="w-px h-8 bg-gray-200"></div>
                  <div>
                    <span className="text-[9px] font-bold tracking-widest text-gray-400 uppercase block mb-0.5">Item Total</span>
                    <span className="text-xl font-black text-blue-600">₹{(offeredPrice * quoteItem.quantity).toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Area: Quotation Bill Summary (Compact and Professional) */}
            <div className="p-4 text-gray-900 border border-gray-200 md:p-5 bg-gray-50 rounded-2xl">
              <h3 className="text-[10px] font-black tracking-widest text-gray-400 uppercase mb-3 flex items-center justify-between border-b border-gray-200 pb-2">
                <span>Quotation Bill Summary</span>
                <span>Ref: #{String(quote._id || "").slice(-6).toUpperCase()}</span>
              </h3>
              
              <div className="space-y-1.5 text-xs font-semibold text-gray-600">
                <div className="flex justify-between">
                  <span>Total Items Value</span>
                  <span className="text-gray-900">₹{offeredSubTotal.toLocaleString("en-IN")}</span>
                </div>
                {extraDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Extra Discount</span>
                    <span>- ₹{extraDiscount.toLocaleString("en-IN")}</span>
                  </div>
                )}
                {shippingCharge > 0 && (
                  <div className="flex justify-between">
                    <span>Shipping Charges</span>
                    <span className="text-gray-900">+ ₹{shippingCharge.toLocaleString("en-IN")}</span>
                  </div>
                )}
                {gstPercentage > 0 && (
                  <div className="flex justify-between">
                    <span>Taxes ({gstPercentage}%)</span>
                    <span className="text-gray-900">+ ₹{gstAmount.toLocaleString("en-IN")}</span>
                  </div>
                )}
                {additionalChargeAmount > 0 && (
                  <div className="flex justify-between">
                    <span>{additionalChargeName}</span>
                    <span className="text-gray-900">+ ₹{additionalChargeAmount.toLocaleString("en-IN")}</span>
                  </div>
                )}
              </div>
              
              {/* Grand Total */}
              <div className="pt-3 mt-3 border-t border-gray-200">
                <div className="flex items-end justify-between">
                  <span className="text-xs font-black tracking-widest text-gray-800 uppercase">Grand Total</span>
                  <span className="text-2xl font-black tracking-tight text-gray-900">₹{displayFinalTotal.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default QuoteItemViewer;