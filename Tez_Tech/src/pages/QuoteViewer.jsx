import { useState, useEffect } from "react";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import { 
  FaFileInvoice, FaCheckCircle, FaPrint, 
  FaRegCalendarAlt, FaTimesCircle, FaBuilding, FaPhoneAlt, FaEnvelope, FaExternalLinkAlt, FaCopy 
} from "react-icons/fa";
import api from "../utils/api"; // Axios instance with interceptors for seamless API calls and error handling

const QuoteViewer = () => {
  const { token } = useParams(); 
  const navigate = useNavigate();
  const location = useLocation();
  const viewOldVersion = new URLSearchParams(location.search).get("view") === "1";
  
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [expandedItems, setExpandedItems] = useState({});
  const [isLatest, setIsLatest] = useState(true);
  const [latestQuoteToken, setLatestQuoteToken] = useState(null);
  const [latestVersion, setLatestVersion] = useState(null);
  const [previousQuote, setPreviousQuote] = useState(null);
  const [parentQuoteNumber, setParentQuoteNumber] = useState(null);

  useEffect(() => {
    fetchQuoteByToken();
  }, [token, viewOldVersion]);

  const fetchQuoteByToken = async () => {
    try {
      const response = await api.get(`/quote/view/${token}`);
      if (
        !viewOldVersion &&
        response.data.isLatest === false &&
        response.data.latestQuoteToken &&
        response.data.latestQuoteToken !== token
      ) {
        navigate(`/quote/${response.data.latestQuoteToken}`, { replace: true });
        return;
      }
      setQuote(response.data.quote);
      setIsLatest(response.data.isLatest !== false);
      setLatestQuoteToken(response.data.latestQuoteToken || null);
      setLatestVersion(response.data.latestVersion || null);
      setPreviousQuote(response.data.previousQuote || null);
      setParentQuoteNumber(response.data.parentQuoteNumber || null);
    } catch (err) {
      console.error("Error fetching quote:", err);
      setError(err.response?.data?.message || "Invalid or expired quotation link.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    const actionText = newStatus === "Accepted" ? "Accept" : "Decline";
    if (!window.confirm(`Are you sure you want to ${actionText} this quotation?`)) return;
    
    setIsUpdating(true);
    try {
      await api.patch(`/quote/status/${quote._id}`, { status: newStatus });
      setQuote({ ...quote, status: newStatus });
      
      if (newStatus === "Accepted") {
        alert("🎉 Thank you! You have successfully accepted the quotation.");
      } else {
        alert("This quotation has been declined.");
      }
    } catch (err) {
      console.error(`Error updating quote to ${newStatus}:`, err);
      if (err.response?.status === 409 && err.response?.data?.latestQuoteToken) {
        alert("A newer version is available. Please open the latest version to update the status.");
      } else {
        alert("Something went wrong. Please try again.");
      }
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen text-lg text-gray-500 print:hidden">Loading your quotation...</div>;
  if (error) return <div className="flex items-center justify-center min-h-screen text-xl font-bold text-red-500 print:hidden">{error}</div>;
  if (!quote) return null;

  const renderSelectedOptions = (item) => {
    const options = Array.isArray(item?.selectedOptions) ? item.selectedOptions : [];
    if (options.length > 0) {
      return (
        <div className="mt-1 space-y-1">
          {options.map((option, idx) => {
            const label = String(option.fieldLabel || "Option").trim();
            const value = String(option.value || "").trim();
            const adj = Number(option.priceAdjustment || 0);
            const adjText = adj ? ` (${adj >= 0 ? "+" : "-"}Rs ${Math.abs(adj)})` : "";
            return (
              <p key={`${item._id || "item"}-${label}-${value}-${idx}`} className="text-[11px] text-gray-500">
                {label}: {value}{adjText}
              </p>
            );
          })}
        </div>
      );
    }

    const selected = item?.selectedCustomFields;
    if (!selected || typeof selected !== "object") return null;
    const product = item.productId && typeof item.productId === "object" ? item.productId : null;
    if (product && Array.isArray(product.customFields)) {
      const resolvedOptions = [];
      let optionAdjustment = 0;
      product.customFields.forEach((field) => {
        const fieldKey = String(field._id || field.label || "");
        const selectedValue = selected[fieldKey] ?? selected[field.label];
        if (!selectedValue || (Array.isArray(selectedValue) && !selectedValue.length)) return;
        const optionsList = Array.isArray(field.options) ? field.options : [];
        const selectedValues = Array.isArray(selectedValue) ? selectedValue : [selectedValue];
        selectedValues.forEach((value) => {
          const safeValue = String(value || "").trim();
          if (!safeValue) return;
          const matched = optionsList.find((opt) => String(opt.label || "").trim() === safeValue);
          const adj = Number(matched?.priceAdjustment || 0);
          optionAdjustment += Number.isFinite(adj) ? adj : 0;
          resolvedOptions.push({
            fieldLabel: String(field.label || fieldKey || "Option").trim(),
            value: safeValue,
            priceAdjustment: Number.isFinite(adj) ? adj : 0,
          });
        });
      });
      if (resolvedOptions.length > 0) {
        return (
          <div className="mt-1 space-y-1">
            {resolvedOptions.map((option, idx) => {
              const label = String(option.fieldLabel || "Option").trim();
              const value = String(option.value || "").trim();
              const adj = Number(option.priceAdjustment || 0);
              const adjText = adj ? ` (${adj >= 0 ? "+" : "-"}Rs ${Math.abs(adj)})` : "";
              return (
                <p key={`${item._id || "item"}-resolved-${label}-${value}-${idx}`} className="text-[11px] text-gray-500">
                  {label}: {value}{adjText}
                </p>
              );
            })}
          </div>
        );
      }
    }
    const fields = Array.isArray(item?.productId?.customFields) ? item.productId.customFields : [];
    const getLabel = (key) => {
      const match = fields.find(
        (field) =>
          String(field?._id || "") === String(key) ||
          String(field?.label || "").toLowerCase() === String(key || "").toLowerCase()
      );
      return String(match?.label || key || "").trim();
    };
    const lines = Object.entries(selected)
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          if (!value.length) return null;
          return `${getLabel(key)}: ${value.join(", ")}`;
        }
        if (!String(value || "").trim()) return null;
        return `${getLabel(key)}: ${value}`;
      })
      .filter(Boolean);
    if (lines.length === 0) return null;

    return (
      <div className="mt-1 space-y-1">
        {lines.map((line, idx) => (
          <p key={`${item._id || "item"}-cf-${idx}`} className="text-[11px] text-gray-500">
            {line}
          </p>
        ))}
      </div>
    );
  };

  const toggleItemDetails = (key) => {
    setExpandedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const getItemProductId = (item) => item?.productId?._id || item?.productId || null;

  const findPreviousItem = (item) => {
    if (!previousQuote || !Array.isArray(previousQuote.requestedItems)) return null;
    const currentId = getItemProductId(item);
    const currentName = String(item?.name || "").trim();
    return previousQuote.requestedItems.find((prev) => {
      const prevId = getItemProductId(prev);
      if (currentId && prevId && String(prevId) === String(currentId)) return true;
      if (currentName && String(prev?.name || "").trim() === currentName) return true;
      return false;
    });
  };

  const buildItemDetailPath = (item, index) => `/quote/${token}/item/${item?._id || index}`;

  const handleCopyItemLink = async (path) => {
    const link = `${window.location.origin}${path}`;
    try {
      await navigator.clipboard.writeText(link);
      alert("Item link copied!");
    } catch (err) {
      console.error("Copy failed:", err);
      alert("Unable to copy link. Please copy it manually.");
    }
  };

  // 🧮 Calculations with Percentages
  const originalSubTotal = quote.requestedItems.reduce((acc, item) => acc + (item.quantity * (item.originalPrice || item.offeredPrice || 0)), 0);
  const offeredSubTotal = quote.requestedItems.reduce((acc, item) => acc + (item.quantity * (item.offeredPrice || 0)), 0);
  
  const itemLevelSavings = originalSubTotal - offeredSubTotal;
  const extraDiscount = quote.totalDiscount || 0;
  const shippingCharge = quote.shippingCharge || 0;
  const gstPercentage = Number(quote.gstPercentage || 0);
  const gstAmount = Math.round(offeredSubTotal * (gstPercentage / 100) * 100) / 100;
  const additionalChargeAmount = Number(quote.additionalChargeAmount || 0);
  const additionalChargeName = String(quote.additionalChargeName || "").trim();
  const totalSavings = itemLevelSavings + extraDiscount;
  const computedFinalTotal = Math.max(
    0,
    offeredSubTotal - extraDiscount + shippingCharge + gstAmount + additionalChargeAmount
  );
  const displayFinalTotal =
    Number.isFinite(Number(quote.finalTotal)) && Number(quote.finalTotal) > 0
      ? Number(quote.finalTotal)
      : computedFinalTotal;
  
  // Total Percentage Calculator
  const calculatePercentage = (discount, total) => {
    if (!total || total === 0) return 0;
    return Math.round((discount / total) * 100);
  };

  const overallDiscountPercentage = calculatePercentage(totalSavings, originalSubTotal);

  return (
    <>
      {/* 🛑 MAGIC CSS: Sirf Bill Print Hoga 🛑 */}
      <style>
        {`
          @media print {
            body * { visibility: hidden; }
            #printable-bill, #printable-bill * { visibility: visible; }
            #printable-bill {
              position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0;
            }
            @page { size: A4; margin: 10mm; }
          }
        `}
      </style>

      <div className="min-h-screen px-4 py-10 bg-gray-50 sm:px-6 print:py-0 print:bg-white">
        <div className="max-w-4xl mx-auto">
          {!isLatest && latestQuoteToken && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 print:hidden">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold">A newer version of this quotation is available.</p>
                  {latestVersion && (
                    <p className="text-xs text-amber-700">Latest version: V{latestVersion}</p>
                  )}
                </div>
                <Link
                  to={`/quote/${latestQuoteToken}`}
                  className="inline-flex items-center justify-center rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-amber-700"
                >
                  View Latest Version
                </Link>
              </div>
            </div>
          )}
          
          <div className="flex justify-end mb-4 print:hidden">
            <button 
              onClick={() => window.print()} 
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition shadow-md"
            >
              <FaPrint /> Print Quotation
            </button>
          </div>

          {/* 📄 MAIN PRINTABLE INVOICE AREA */}
          <div id="printable-bill" className="p-8 bg-white border border-gray-100 shadow-xl md:p-12 rounded-2xl print:p-0 print:shadow-none print:border-none print:rounded-none">
            
            {/* Header */}
            <div className="flex flex-col items-start justify-between pb-6 mb-6 border-b-2 border-gray-800 sm:flex-row sm:items-center">
              <div>
                <h1 className="flex items-center gap-3 text-3xl font-black tracking-tight text-gray-900">
                  QUOTATION
                </h1>
                <p className="mt-1 font-bold text-gray-600">Ref ID: #{quote._id.slice(-6).toUpperCase()}</p>
                {parentQuoteNumber && (
                  <p className="text-xs font-semibold text-gray-500">Quote No: {parentQuoteNumber}</p>
                )}
                <p className="text-xs font-semibold text-gray-500">Version: V{quote.version || 1}</p>
              </div>
              
              <div className="mt-4 text-left sm:mt-0 sm:text-right">
                <h2 className="text-xl font-bold tracking-wide text-gray-900 uppercase">Sonani Industries</h2>
                <p className="mt-1 text-sm text-gray-700">123 Industrial Estate, Surat, Gujarat</p>
                <p className="text-sm text-gray-700">contact@sonani.com | +91 9876543210</p>
              </div>
            </div>

            {/* Client Details */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="print:break-inside-avoid">
                <p className="pb-1 mb-2 text-xs font-bold tracking-widest text-gray-500 uppercase border-b">Prepared For</p>
                <h3 className="text-lg font-bold text-gray-900">{quote.userDetails.name}</h3>
                {quote.userDetails.company && <p className="text-sm text-gray-800">{quote.userDetails.company}</p>}
                <p className="text-sm text-gray-800">{quote.userDetails.email}</p>
                <p className="text-sm text-gray-800">{quote.userDetails.phone}</p>
              </div>

              <div className="text-right print:break-inside-avoid">
                 <p className="pb-1 mb-2 text-xs font-bold tracking-widest text-gray-500 uppercase border-b">Quote Details</p>
                <div className="flex justify-end gap-4 mb-1">
                  <span className="text-sm text-gray-600">Date Issued:</span>
                  <span className="w-24 text-sm font-bold text-right text-gray-900">{new Date(quote.updatedAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-end gap-4">
                  <span className="text-sm text-gray-600">Valid Until:</span>
                  <span className="w-24 text-sm font-bold text-right text-gray-900">
                    {quote.validUntil ? new Date(quote.validUntil).toLocaleDateString() : "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {/* 🛒 Items Table with Percentage */}
            <div className="mb-8 border border-gray-300">
              <table className="w-full text-left border-collapse">
                <thead className="print:table-header-group">
                  <tr className="text-sm tracking-wide text-gray-900 uppercase bg-gray-100">
                    <th className="p-3 font-bold border-b border-gray-300">Item</th>
                    <th className="w-12 p-3 font-bold text-center border-b border-gray-300">Qty</th>
                    <th className="p-3 font-bold text-right border-b border-gray-300">MRP</th>
                    <th className="p-3 font-bold text-right text-gray-600 border-b border-gray-300">Disc %</th>
                    <th className="p-3 font-bold text-right border-b border-gray-300">Rate</th>
                    <th className="p-3 font-bold text-right border-b border-gray-300 w-28">Total</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-gray-800">
                  {quote.requestedItems.map((item, index) => {
                    const basePrice = item.originalPrice || item.offeredPrice || 0;
                    const isDiscounted = item.offeredPrice < basePrice;
                    const itemDiscountAmount = basePrice - (item.offeredPrice || 0);
                    const itemDiscPercent = calculatePercentage(itemDiscountAmount, basePrice);
                    const itemKey = item._id || `${index}`;
                    const isExpanded = Boolean(expandedItems[itemKey]);
                    const optionAdjustment = Number.isFinite(Number(item.optionAdjustment))
                      ? Number(item.optionAdjustment)
                      : Array.isArray(item.selectedOptions)
                        ? item.selectedOptions.reduce((sum, opt) => sum + Number(opt.priceAdjustment || 0), 0)
                        : 0;
                    const productImage = item?.productId?.image;
                    const productSku = item?.productId?.sku;
                    const itemDetailPath = buildItemDetailPath(item, index);
                    const prevItem = findPreviousItem(item);
                    const prevQty = prevItem ? Number(prevItem.quantity || 0) : null;
                    const prevRate = prevItem ? Number(prevItem.offeredPrice || 0) : null;
                    const qtyChanged = prevItem && prevQty !== Number(item.quantity || 0);
                    const rateChanged = prevItem && prevRate !== Number(item.offeredPrice || 0);
                    const prevLineTotal = prevItem ? prevRate * prevQty : null;
                    const lineTotalChanged =
                      prevItem && prevLineTotal !== Number((item.offeredPrice || 0) * (item.quantity || 0));

                    return (
                      <tr key={item._id} className={`print:break-inside-avoid ${index % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                        <td className="p-3 font-medium border-b border-gray-200">
                          <div className="flex items-start gap-3">
                            {productImage ? (
                              <img src={productImage} alt={item.name} className="object-cover w-12 h-12 rounded" />
                            ) : (
                              <div className="w-12 h-12 bg-gray-200 rounded" />
                            )}
                            <div>
                              <button
                                type="button"
                                onClick={() => toggleItemDetails(itemKey)}
                                className="text-left text-gray-900 hover:underline"
                              >
                                {item.name}
                              </button>
                              {productSku && <div className="text-xs text-gray-500">{productSku}</div>}
                              <div className="mt-1 text-xs text-blue-600 print:hidden">Click to view details</div>
                              <div className="flex flex-wrap gap-2 mt-2 text-[11px] print:hidden">
                                <Link
                                  to={itemDetailPath}
                                  className="inline-flex items-center gap-1 px-2 py-1 font-semibold text-blue-700 bg-blue-50 border border-blue-100 rounded-md hover:bg-blue-100"
                                >
                                  <FaExternalLinkAlt /> Open full page
                                </Link>
                                <button
                                  type="button"
                                  onClick={() => handleCopyItemLink(itemDetailPath)}
                                  className="inline-flex items-center gap-1 px-2 py-1 font-semibold text-gray-700 bg-white border border-gray-200 rounded-md hover:border-gray-300"
                                >
                                  <FaCopy /> Copy link
                                </button>
                              </div>
                              {isExpanded && (
                                <div className="mt-2 space-y-1 text-[12px] text-gray-600">
                                  <div>Base Price: â‚¹{Number(item.basePrice || basePrice).toLocaleString('en-IN')}</div>
                                  <div>Option Adjustment: â‚¹{Number(optionAdjustment || 0).toLocaleString('en-IN')}</div>
                                  <div>Offered Price: â‚¹{Number(item.offeredPrice || 0).toLocaleString('en-IN')}</div>
                                  <div>Line Total: â‚¹{((item.offeredPrice || 0) * item.quantity).toLocaleString('en-IN')}</div>
                                  {renderSelectedOptions(item)}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-center border-b border-gray-200">
                          {qtyChanged && (
                            <div className="text-xs text-gray-400 line-through">{prevQty}</div>
                          )}
                          <div className={`font-bold ${qtyChanged ? "text-emerald-700" : "text-gray-900"}`}>
                            {item.quantity}
                          </div>
                        </td>
                        <td className="p-3 text-right text-gray-500 border-b border-gray-200">
                          {isDiscounted ? <span className="line-through">₹{basePrice.toLocaleString('en-IN')}</span> : "-"}
                        </td>
                        <td className="p-3 font-bold text-right text-green-700 border-b border-gray-200">
                          {isDiscounted && itemDiscPercent > 0 ? `${itemDiscPercent}%` : "-"}
                        </td>
                        <td className="p-3 text-right border-b border-gray-200">
                          {rateChanged && (
                            <div className="text-xs text-gray-400 line-through">
                              ₹{prevRate?.toLocaleString("en-IN") || "0"}
                            </div>
                          )}
                          <div className={`font-bold ${rateChanged ? "text-emerald-700" : "text-gray-900"}`}>
                            ₹{item.offeredPrice?.toLocaleString('en-IN') || "0"}
                          </div>
                        </td>
                        <td className="p-3 font-bold text-right text-gray-900 border-b border-gray-200">
                          {lineTotalChanged && (
                            <div className="text-xs text-gray-400 line-through">
                              ₹{Number(prevLineTotal || 0).toLocaleString("en-IN")}
                            </div>
                          )}
                          <div className={lineTotalChanged ? "text-emerald-700" : "text-gray-900"}>
                            ₹{((item.offeredPrice || 0) * item.quantity).toLocaleString('en-IN')}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 📝 Notes & Calculation Section */}
            <div className="flex flex-col justify-between gap-8 mb-6 sm:flex-row print:break-inside-avoid">
              
              <div className="w-full sm:w-1/2">
                {quote.adminNotes && (
                  <div>
                    <h4 className="pb-1 mb-2 text-sm font-bold text-gray-900 uppercase border-b">Terms & Conditions</h4>
                    <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-line">{quote.adminNotes}</p>
                  </div>
                )}
              </div>

              {/* Totals Box */}
              <div className="w-full text-sm sm:w-1/3">
                <div className="flex justify-between mb-2 text-gray-700">
                  <span>Subtotal:</span>
                  <span className="font-bold">₹ {offeredSubTotal.toLocaleString('en-IN')}</span>
                </div>

                {extraDiscount > 0 && (
                  <div className="flex justify-between mb-2 font-bold text-gray-700">
                    <span>Extra Discount:</span>
                    <span>- ₹ {extraDiscount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                {gstPercentage > 0 && (
                  <div className="flex justify-between mb-2 font-bold text-gray-700">
                    <span>GST ({gstPercentage}%):</span>
                    <span>+ ₹ {gstAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                {additionalChargeAmount > 0 && (
                  <div className="flex justify-between mb-2 font-bold text-gray-700">
                    <span>{additionalChargeName || "Additional Charge"}:</span>
                    <span>+ ₹ {additionalChargeAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                {/* 👇 YAHAN PE CHANGE HUA HAI 👇 */}
                {shippingCharge > 0 && (
                  <div className="flex justify-between mb-2 font-bold text-gray-700">
                    <span>Shipping Charge:</span>
                    <span>+ Rs {shippingCharge.toLocaleString('en-IN')}</span>
                  </div>
                )}

                {totalSavings > 0 && (
                  <div className="flex justify-between p-2 mb-2 font-bold text-green-700 border border-green-200 rounded bg-green-50 print:border-gray-400 print:bg-white print:text-gray-900">
                    <span>You Saved:</span>
                    <span>{overallDiscountPercentage}% OFF (₹ {totalSavings.toLocaleString('en-IN')})</span>
                  </div>
                )}

                <div className="flex items-end justify-between pt-2 mt-2 border-t-2 border-gray-800">
                  <span className="text-lg font-bold text-gray-900 uppercase">Final Total:</span>
                  <span className="text-2xl font-black leading-none text-gray-900">
                    ₹ {displayFinalTotal.toLocaleString('en-IN') || "0"}
                  </span>
                </div>
              </div>
            </div>

            {/* 🚀 Action Buttons (Hidden in Print) */}
            <div className="pt-8 mt-8 border-t border-gray-200 print:hidden">
              {quote.status === "Accepted" ? (
                <div className="flex items-center justify-center gap-3 px-8 py-5 text-xl font-bold text-green-700 bg-green-50 rounded-xl">
                  <FaCheckCircle size={28} /> Quotation Accepted
                </div>
              ) : quote.status === "Rejected" ? (
                <div className="flex items-center justify-center gap-3 px-8 py-5 text-xl font-bold text-red-700 bg-red-50 rounded-xl">
                  <FaTimesCircle size={28} /> Quotation Declined
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                  {!isLatest && (
                    <div className="w-full rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm font-semibold text-amber-700">
                      This is an older version. Please open the latest version to accept or reject.
                    </div>
                  )}
                  <button 
                    onClick={() => handleStatusUpdate("Rejected")}
                    disabled={isUpdating || !isLatest}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white border-2 border-red-500 hover:bg-red-50 text-red-600 px-8 py-3.5 rounded-xl text-lg font-bold transition disabled:opacity-50"
                  >
                    <FaTimesCircle /> Decline Quote
                  </button>
                  
                  <button 
                    onClick={() => handleStatusUpdate("Accepted")}
                    disabled={isUpdating || !isLatest}
                    className="flex items-center justify-center w-full gap-2 px-10 py-4 text-lg font-bold text-white transition bg-green-600 shadow-lg sm:w-auto hover:bg-green-700 rounded-xl disabled:opacity-50"
                  >
                    <FaCheckCircle /> Accept This Quote
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default QuoteViewer;
