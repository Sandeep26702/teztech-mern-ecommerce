import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FaArrowLeft, FaCamera, FaCopy } from "react-icons/fa";
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
  const [isScreenshotMode, setIsScreenshotMode] = useState(false);

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

  const goPrevImage = () => {
    if (!imageList.length) return;
    setActiveImageIndex((prev) => (prev - 1 + imageList.length) % imageList.length);
  };

  const goNextImage = () => {
    if (!imageList.length) return;
    setActiveImageIndex((prev) => (prev + 1) % imageList.length);
  };

  const renderSelectedOptions = (item) => {
    const options = Array.isArray(item?.selectedOptions) ? item.selectedOptions : [];
    if (options.length > 0) {
      return (
        <div className="flex flex-col gap-1.5 mt-3 border-t border-gray-100 pt-3">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Selected Variations</p>
          {options.map((option, idx) => {
            const label = String(option.fieldLabel || "Option").trim();
            const value = String(option.value || "").trim();
            const adj = Number(option.priceAdjustment || 0);
            
            return (
              <div key={idx} className="flex items-center justify-between bg-orange-50/50 border border-orange-100 px-3 py-1.5 rounded-lg">
                <span className="text-xs text-gray-700">
                  <span className="font-medium">{label}:</span> <span className="font-bold text-gray-900">{value}</span>
                </span>
                {adj !== 0 && (
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${adj > 0 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                    {adj > 0 ? '+' : '-'} Rs {Math.abs(adj).toLocaleString("en-IN")}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      );
    }
    return null;
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
      alert("Item link copied!");
    } catch (err) {
      alert("Unable to copy link. Please copy it manually.");
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh] text-gray-600 font-medium">Loading item details...</div>;
  if (error) return <div className="flex flex-col items-center justify-center min-h-[60vh] text-red-600 font-bold">{error}</div>;
  if (!quote || !quoteItem) return null;

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
    <>
      <style>
        {`
          .quote-item-page { background: #f8fafc; min-height: 100vh; padding: 2rem 1rem; }
          .screenshot-mode.quote-item-page { background: #e2e8f0; padding: 1rem; display: flex; justify-content: center; }
          .screenshot-mode .main-container { max-width: 480px !important; width: 100%; background: #ffffff; border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); padding: 20px !important; margin: 0 auto; }
          .screenshot-mode .hide-in-screenshot { display: none !important; }
          .screenshot-mode .screenshot-grid { display: flex !important; flex-direction: column !important; gap: 16px !important; }
          .screenshot-mode .screenshot-image { max-height: 280px !important; border: none !important; border-radius: 8px; }
          .screenshot-mode .card-box { border: 1px solid #f1f5f9; box-shadow: none; padding: 12px !important; }
          .screenshot-mode .whatsapp-header { display: flex !important; justify-content: space-between; align-items: center; border-bottom: 2px dashed #cbd5e1; padding-bottom: 12px; margin-bottom: 16px; }
        `}
      </style>

      <div className={`quote-item-page ${isScreenshotMode ? "screenshot-mode" : ""}`}>
        
        <div className="max-w-5xl mx-auto flex justify-end mb-4 hide-in-screenshot">
            <button 
                type="button" 
                onClick={() => setIsScreenshotMode((prev) => !prev)} 
                className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border rounded-full shadow-lg transition-all ${isScreenshotMode ? "bg-red-600 text-white border-red-700 hover:bg-red-700" : "bg-gray-900 text-white border-gray-900 hover:bg-gray-800"}`}
            >
                <FaCamera className="text-lg" /> {isScreenshotMode ? "Exit Screenshot Mode" : "Generate WhatsApp Bill"}
            </button>
        </div>

        <div className="max-w-5xl mx-auto main-container transition-all duration-300">
            
            <div className="flex items-center justify-between mb-6 hide-in-screenshot">
              <Link to={`/quote/${token}`} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50">
                <FaArrowLeft /> Back
              </Link>
              <button onClick={handleCopyLink} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg shadow-sm">
                <FaCopy /> Copy Link
              </button>
            </div>

            <div className="hidden whatsapp-header">
                <div>
                    <h2 className="text-xl font-black text-gray-800 tracking-tight">QUOTATION</h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ref: #{String(quote._id || "").slice(-6).toUpperCase()}</p>
                </div>
                <div className="text-right">
                    <span className="inline-block bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-1 rounded">VALID FOR 7 DAYS</span>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2 screenshot-grid">
              
              {/* Image & Specs Column */}
              <div className="w-full flex flex-col space-y-4">
                <div className="relative flex items-center justify-center w-full bg-white border border-gray-200 rounded-xl overflow-hidden card-box">
                  <img src={activeImage} alt={quoteItem.name} className="object-contain w-full max-h-[400px] screenshot-image p-2" />
                  
                  {imageList.length > 1 && (
                    <div className="hide-in-screenshot">
                      <button onClick={goPrevImage} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow"><FaArrowLeft className="text-xs"/></button>
                      <button onClick={goNextImage} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow"><FaArrowLeft className="rotate-180 text-xs"/></button>
                    </div>
                  )}
                </div>

                {imageList.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto hide-in-screenshot">
                    {imageList.map((img, index) => (
                      <img key={index} src={img} onClick={() => setActiveImageIndex(index)} className={`h-12 w-12 object-cover rounded border cursor-pointer ${index === activeImageIndex ? "border-orange-500" : "border-gray-200"}`} alt="thumb"/>
                    ))}
                  </div>
                )}

                {specRows.length > 0 && (
                  <div className="bg-white border border-gray-100 rounded-xl p-4 card-box shadow-sm">
                    <h3 className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-2">Key Specs</h3>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        {specRows.map(row => (
                            <div key={row.key} className="flex justify-between border-b border-gray-50 py-1">
                                <span className="text-gray-500">{row.key}</span>
                                <span className="font-semibold text-gray-800">{row.value}</span>
                            </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Product Details & Consolidated Pricing Column */}
              <div className="space-y-4">
                
                <div className="bg-white border border-gray-200 rounded-xl p-5 card-box relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
                  <p className="text-[10px] font-bold tracking-widest text-orange-500 uppercase">{product?.sku ? `SKU: ${product.sku}` : "PRODUCT"}</p>
                  <h1 className="text-xl sm:text-2xl font-black text-gray-900 uppercase mt-1 leading-tight">{quoteItem.name}</h1>
                  
                  {renderSelectedOptions(quoteItem)}

                  {/* MERGED RATE AND QUANTITY SECTION */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                    <div>
                        {discountPercent > 0 && (
                            <div className="text-[10px] mb-1">
                                <span className="text-gray-400 line-through mr-2">MRP: Rs {basePrice.toLocaleString("en-IN")}</span>
                                <span className="text-green-600 font-bold">{discountPercent}% OFF</span>
                            </div>
                        )}
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest block">RATE / PC</span>
                        <span className="text-2xl font-black text-gray-900 block">Rs {offeredPrice.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="text-right border-l border-gray-200 pl-4">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest block">QTY</span>
                        <span className="text-2xl font-black text-gray-800">{quoteItem.quantity} <span className="text-sm font-semibold text-gray-500">Pcs</span></span>
                    </div>
                  </div>
                </div>

                {/* Final Bill Summary (Item Total Removed, Focus only on Grand Total) */}
                <div className="bg-gray-900 text-white rounded-xl p-5 shadow-md card-box">
                  <h3 className="text-[10px] font-bold tracking-widest text-gray-400 uppercase border-b border-gray-700 pb-2 mb-3">Bill Breakdown</h3>
                  <div className="space-y-1.5 text-xs font-medium text-gray-300">
                    <div className="flex justify-between"><span>Total Items Value</span><span>Rs {offeredSubTotal.toLocaleString("en-IN")}</span></div>
                    {shippingCharge > 0 && <div className="flex justify-between"><span>Shipping</span><span>+ Rs {shippingCharge.toLocaleString("en-IN")}</span></div>}
                    {gstPercentage > 0 && <div className="flex justify-between"><span>GST ({gstPercentage}%)</span><span>+ Rs {gstAmount.toLocaleString("en-IN")}</span></div>}
                    {additionalChargeAmount > 0 && <div className="flex justify-between"><span>{additionalChargeName}</span><span>+ Rs {additionalChargeAmount.toLocaleString("en-IN")}</span></div>}
                    {extraDiscount > 0 && <div className="flex justify-between text-green-400"><span>Extra Discount</span><span>- Rs {extraDiscount.toLocaleString("en-IN")}</span></div>}
                  </div>
                  <div className="flex flex-col items-end mt-4 pt-3 border-t border-gray-700">
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Final Amount To Pay</span>
                    <span className="text-3xl font-black text-orange-400 leading-none mt-1">Rs {displayFinalTotal.toLocaleString("en-IN")}</span>
                  </div>
                </div>

              </div>
            </div>
            
        </div>
      </div>
    </>
  );
};

export default QuoteItemViewer;