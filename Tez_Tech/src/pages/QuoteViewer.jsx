import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { 
  FaFileInvoice, FaCheckCircle, FaPrint, 
  FaRegCalendarAlt, FaTimesCircle, FaBuilding, FaPhoneAlt, FaEnvelope 
} from "react-icons/fa";
import api from "../utils/api"; // Axios instance with interceptors for seamless API calls and error handling

const QuoteViewer = () => {
  const { token } = useParams(); 
  
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchQuoteByToken();
  }, [token]);

  const fetchQuoteByToken = async () => {
    try {
      const response = await api.get(`/quote/view/${token}`);
      setQuote(response.data.quote);
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
      alert("Something went wrong. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen text-lg text-gray-500 print:hidden">Loading your quotation...</div>;
  if (error) return <div className="flex items-center justify-center min-h-screen text-xl font-bold text-red-500 print:hidden">{error}</div>;
  if (!quote) return null;

  // 🧮 Calculations with Percentages
  const originalSubTotal = quote.requestedItems.reduce((acc, item) => acc + (item.quantity * (item.originalPrice || item.offeredPrice || 0)), 0);
  const offeredSubTotal = quote.requestedItems.reduce((acc, item) => acc + (item.quantity * (item.offeredPrice || 0)), 0);
  
  const itemLevelSavings = originalSubTotal - offeredSubTotal;
  const extraDiscount = quote.totalDiscount || 0;
  const shippingCharge = quote.shippingCharge || 0;
  const totalSavings = itemLevelSavings + extraDiscount;
  
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
                    <th className="p-3 font-bold border-b border-gray-300">Item Description</th>
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

                    return (
                      <tr key={item._id} className={`print:break-inside-avoid ${index % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                        <td className="p-3 font-medium border-b border-gray-200">
                          {item.name}
                        </td>
                        <td className="p-3 font-bold text-center border-b border-gray-200">
                          {item.quantity}
                        </td>
                        <td className="p-3 text-right text-gray-500 border-b border-gray-200">
                          {isDiscounted ? <span className="line-through">₹{basePrice.toLocaleString('en-IN')}</span> : "-"}
                        </td>
                        <td className="p-3 font-bold text-right text-green-700 border-b border-gray-200">
                          {isDiscounted && itemDiscPercent > 0 ? `${itemDiscPercent}%` : "-"}
                        </td>
                        <td className="p-3 font-bold text-right border-b border-gray-200">
                          ₹{item.offeredPrice?.toLocaleString('en-IN') || "0"}
                        </td>
                        <td className="p-3 font-bold text-right text-gray-900 border-b border-gray-200">
                          ₹{((item.offeredPrice || 0) * item.quantity).toLocaleString('en-IN')}
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
                    ₹ {quote.finalTotal?.toLocaleString('en-IN') || "0"}
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
                  <button 
                    onClick={() => handleStatusUpdate("Rejected")}
                    disabled={isUpdating}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white border-2 border-red-500 hover:bg-red-50 text-red-600 px-8 py-3.5 rounded-xl text-lg font-bold transition disabled:opacity-50"
                  >
                    <FaTimesCircle /> Decline Quote
                  </button>
                  
                  <button 
                    onClick={() => handleStatusUpdate("Accepted")}
                    disabled={isUpdating}
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
