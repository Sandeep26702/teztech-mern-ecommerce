import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  FaArrowLeft, FaPaperPlane, FaCopy, FaCheck, 
  FaLink, FaClipboardList, FaWhatsapp, FaEnvelope, FaTrash, FaPlus 
} from "react-icons/fa";
import api from "../../api/api";

const QuoteEditor = () => {
  const { id } = useParams(); 
  const navigate = useNavigate();
  
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [copied, setCopied] = useState(false);

  const [adminNotes, setAdminNotes] = useState("");
  const [totalDiscount, setTotalDiscount] = useState(""); 

  useEffect(() => {
    fetchQuoteDetails();
  }, [id]);

  const fetchQuoteDetails = async () => {
    try {
      const response = await api.get(`/quotes/${id}`);
      setQuote(response.data.quote);
      setAdminNotes(response.data.quote.adminNotes || "");
      setTotalDiscount(response.data.quote.totalDiscount || "");
      
      if (response.data.quote.quoteToken && response.data.quote.status !== "Pending") {
         const generatedLink = `${window.location.origin}/quote/${response.data.quote.quoteToken}`;
         setShareLink(generatedLink);
      }
    } catch (error) {
      console.error("Error fetching quote:", error);
      alert("Failed to load quote details.");
    } finally {
      setLoading(false);
    }
  };

  const handleItemChange = (itemId, field, value) => {
    let parsedValue = value;
    if (field !== "name") {
      parsedValue = value === "" ? "" : Number(value);
    }
    
    const updatedItems = quote.requestedItems.map(item => 
      item._id === itemId ? { ...item, [field]: parsedValue } : item
    );
    setQuote({ ...quote, requestedItems: updatedItems });
  };

  const handleRemoveItem = (itemId) => {
    if(!window.confirm("Are you sure you want to remove this item?")) return;
    
    const updatedItems = quote.requestedItems.filter(item => item._id !== itemId);
    setQuote({ ...quote, requestedItems: updatedItems });
  };

  // 🔄 UPDATE: Ab ye blank row add nahi karega, seedha Product page pe bhejega
  const handleAddItem = () => {
    // '/products' ko aapne app ke actual products page ke route se change kar lena agar alag ho
    navigate('/products', { state: { addingToQuoteId: id } });
  };

  const calculateSubTotal = () => {
    if (!quote || !quote.requestedItems) return 0;
    return quote.requestedItems.reduce((acc, item) => acc + ((item.quantity || 0) * (item.offeredPrice || 0)), 0);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmitResponse = async (e) => {
    e.preventDefault();
    
    if (quote.requestedItems.length === 0) {
      alert("⚠️ You must have at least one item in the quotation before submitting.");
      return;
    }

    const hasEmptyNames = quote.requestedItems.some(item => !item.name || item.name.trim() === "");
    if(hasEmptyNames) {
      alert("⚠️ Please enter a product name for all items.");
      return;
    }

    setSubmitting(true);

    const subTotal = calculateSubTotal();
    const finalTotal = subTotal - Number(totalDiscount || 0);

    const itemsToSubmit = quote.requestedItems.map(item => {
      if (item._id.startsWith("custom-")) {
        const { _id, ...rest } = item;
        return rest; 
      }
      return item;
    });

    const updateData = {
      requestedItems: itemsToSubmit, 
      adminNotes,
      totalDiscount: Number(totalDiscount || 0),
      finalTotal,
      validUntil: new Date(new Date().setDate(new Date().getDate() + 7)) 
    };

    try {
      const response = await api.put(`/quotes/${id}/respond`, updateData);
      alert("✅ Quote updated and link generated successfully!");
      
      setQuote(response.data.quote); 
      
      const newLink = response.data.link || `${window.location.origin}/quote/${response.data.quote.quoteToken}`;
      setShareLink(newLink);
      
    } catch (error) {
      console.error("Error sending response:", error);
      alert("❌ Failed to process quote. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-10 font-medium text-center text-gray-500">Loading quote details...</div>;
  if (!quote) return <div className="p-10 font-medium text-center text-red-500">Quote not found!</div>;

  const subTotal = calculateSubTotal();
  const finalTotal = subTotal - Number(totalDiscount || 0);

  return (
    <div className="p-4 mx-auto font-sans max-w-7xl sm:p-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 mb-6 font-medium text-gray-500 transition-colors hover:text-blue-600">
        <FaArrowLeft /> Back to Quotes
      </button>

      {/* ========================================= */}
      {/* TOP SECTION: Client Info & Sharing        */}
      {/* ========================================= */}
      <div className="grid grid-cols-1 gap-6 mb-8 lg:grid-cols-2">
        
        {/* Client Details Box */}
        <div className="h-full p-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
          <h3 className="pb-2 mb-4 text-lg font-bold text-gray-800 border-b">Client Details</h3>
          <div className="space-y-3 text-sm text-gray-600">
            <p><strong className="text-gray-900">Name:</strong> {quote.userDetails.name}</p>
            <p><strong className="text-gray-900">Email:</strong> {quote.userDetails.email}</p>
            <p><strong className="text-gray-900">Phone:</strong> {quote.userDetails.phone || "N/A"}</p>
            <p><strong className="text-gray-900">Company:</strong> {quote.userDetails.company || "N/A"}</p>
            <div className="p-3 mt-2 border border-gray-100 rounded-lg bg-gray-50">
              <strong className="block mb-1 text-gray-900">Message:</strong> 
              <p className="italic text-gray-600">{quote.userDetails.message || "No notes provided by client."}</p>
            </div>
            <p className="flex items-center pt-4 mt-4 border-t border-gray-100">
              <strong className="mr-2 text-gray-900">Status:</strong> 
              <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide ${
                quote.status === "Pending" ? "bg-yellow-100 text-yellow-800" : 
                quote.status === "Accepted" ? "bg-green-100 text-green-800" :
                quote.status === "Rejected" ? "bg-red-100 text-red-800" :
                "bg-blue-100 text-blue-800"
              }`}>
                {quote.status}
              </span>
            </p>
          </div>
        </div>

        {/* 🔗 DIRECT LINK & SHARE BOX */}
        <div className="h-full">
          {shareLink ? (
            <div className="flex flex-col justify-center h-full p-6 border border-green-200 shadow-sm bg-green-50 rounded-2xl">
              <h3 className="flex items-center gap-2 mb-2 text-lg font-bold text-green-900">
                <FaLink /> Shareable Quote Link
              </h3>
              <p className="mb-4 text-xs text-green-700">Link is ready! Send it to the client directly.</p>
              
              <div className="flex mb-4 overflow-hidden transition-all bg-white border border-green-200 rounded-lg focus-within:ring-2 focus-within:ring-green-400">
                <input type="text" value={shareLink} readOnly className="w-full p-3 text-xs text-gray-600 outline-none" />
                <button type="button" onClick={handleCopyLink} className="flex items-center justify-center gap-2 px-4 text-sm font-medium text-white transition-colors bg-green-600 hover:bg-green-700">
                  {copied ? <><FaCheck /> Copied</> : <><FaCopy /> Copy</>}
                </button>
              </div>

              {/* 📲 WhatsApp & Email Buttons */}
              <div className="grid grid-cols-2 gap-3 mt-auto">
                <a 
                  href={`https://api.whatsapp.com/send?phone=${quote.userDetails.phone || ""}&text=Hello ${quote.userDetails.name},%0A%0AHere is the custom quotation you requested from Sonani:%0A${shareLink}%0A%0AThank you!`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe57] text-white py-2 rounded-lg font-bold text-sm transition-colors"
                >
                  <FaWhatsapp size={16} /> WhatsApp
                </a>
                
                <a 
                  href={`mailto:${quote.userDetails.email}?subject=Your Custom Quotation from Sonani&body=Hello ${quote.userDetails.name},%0D%0A%0D%0AHere is the link to view and accept your custom quotation:%0D%0A${shareLink}%0D%0A%0D%0AThank you!`}
                  className="flex items-center justify-center gap-2 py-2 text-sm font-bold text-white transition-colors bg-gray-800 rounded-lg hover:bg-gray-900"
                >
                  <FaEnvelope size={16} /> Email
                </a>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center text-gray-400 border border-gray-200 border-dashed shadow-sm bg-gray-50 rounded-2xl">
               <FaLink size={32} className="mb-3 text-gray-300" />
               <p className="text-sm">Submit the quote setup below<br/>to generate a shareable link.</p>
            </div>
          )}
        </div>
      </div>

      {/* ========================================= */}
      {/* BOTTOM SECTION: Full Width Pricing Setup  */}
      {/* ========================================= */}
      <form onSubmit={handleSubmitResponse} className="w-full p-6 bg-white border border-gray-100 shadow-sm md:p-8 rounded-2xl">
        <div className="flex items-center justify-between gap-2 mb-6">
          <h3 className="flex items-center gap-2 text-xl font-bold text-gray-800">
            <span className="p-2 text-blue-600 bg-blue-100 rounded-lg"><FaClipboardList size={18} /></span> 
            Pricing Setup
          </h3>
          <button 
            type="button" 
            onClick={handleAddItem}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-blue-700 transition-colors border border-blue-200 rounded-lg bg-blue-50 hover:bg-blue-100"
          >
            <FaPlus /> Add Item
          </button>
        </div>

        {/* 🛒 Full Width Items Table */}
        <div className="mb-8 overflow-hidden border border-gray-200 rounded-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="text-xs tracking-wider uppercase bg-slate-50 text-slate-600">
                  <th className="p-4 font-semibold min-w-[250px]">Product Name</th>
                  <th className="w-32 p-4 font-semibold text-center min-w-[120px]">Qty</th>
                  <th className="p-4 font-semibold text-right bg-yellow-50/50 min-w-[150px]">Original Price</th>
                  <th className="p-4 font-semibold text-right text-blue-700 min-w-[160px]">Offered Price (₹)</th>
                  <th className="p-4 font-semibold text-right min-w-[140px]">Total (₹)</th>
                  <th className="w-12 p-4 text-center"></th> 
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {quote.requestedItems.length > 0 ? (
                  quote.requestedItems.map((item) => {
                    const basePrice = item.originalPrice !== undefined ? item.originalPrice : (item.price || 0); 
                    const isDiscounted = item.offeredPrice < basePrice;
                    const discountPercent = basePrice > 0 ? Math.round(((basePrice - item.offeredPrice) / basePrice) * 100) : 0;

                    return (
                      <tr key={item._id} className="transition-colors hover:bg-slate-50/50 group">
                        
                        {/* ✏️ Editable Product Name */}
                        <td className="p-4 align-middle">
                          <input 
                            type="text"
                            value={item.name}
                            onChange={(e) => handleItemChange(item._id, "name", e.target.value)}
                            placeholder="Enter product name..."
                            className="w-full px-2 py-1 font-medium text-gray-800 transition-all border border-transparent rounded outline-none hover:border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-inherit"
                          />
                          {isDiscounted && item.offeredPrice > 0 && (
                            <div className="text-[10px] font-bold text-green-600 mt-1 ml-2 bg-green-50 inline-block px-1.5 py-0.5 rounded border border-green-200">
                              {discountPercent}% OFF
                            </div>
                          )}
                        </td>
                        
                        {/* ✏️ Editable Quantity */}
                        <td className="p-4 text-center align-middle">
                          <input 
                            type="number" 
                            min="1"
                            value={item.quantity === 0 ? "" : item.quantity}
                            onChange={(e) => handleItemChange(item._id, "quantity", e.target.value)}
                            className="w-full px-3 py-2 text-sm text-center font-medium text-gray-800 transition-all bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </td>
                        
                        {/* ✏️ Editable Original Price */}
                        <td className="p-4 align-middle bg-yellow-50/30">
                          <div className="relative flex items-center">
                            <span className="absolute font-medium text-gray-400 left-3">₹</span>
                            <input 
                              type="number" 
                              min="0"
                              value={basePrice === 0 ? "" : basePrice}
                              onChange={(e) => handleItemChange(item._id, "originalPrice", e.target.value)}
                              className={`w-full py-2 pl-7 pr-2 text-sm text-right font-medium transition-all bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${isDiscounted ? "text-gray-400 line-through" : "text-gray-800"}`}
                            />
                          </div>
                        </td>

                        {/* 💰 Editable Offered Price Field */}
                        <td className="p-4 align-middle">
                          <div className="relative flex items-center">
                            <span className="absolute font-medium text-blue-400 left-3">₹</span>
                            <input 
                              type="number" 
                              min="0"
                              required
                              value={item.offeredPrice === 0 ? "" : item.offeredPrice}
                              onChange={(e) => handleItemChange(item._id, "offeredPrice", e.target.value)}
                              placeholder="0"
                              className="w-full py-2 pl-7 pr-3 font-bold text-right text-blue-900 transition-all border border-blue-200 rounded-lg outline-none bg-blue-50/50 focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </div>
                        </td>

                        {/* Total */}
                        <td className="p-4 font-bold text-right text-gray-800 align-middle whitespace-nowrap">
                          {((item.offeredPrice || 0) * (item.quantity || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>

                        {/* 🗑️ Remove Button */}
                        <td className="p-4 text-center align-middle">
                          <button 
                            type="button"
                            onClick={() => handleRemoveItem(item._id)}
                            className="p-2 transition-colors rounded text-slate-400 hover:text-red-500 hover:bg-red-50"
                            title="Remove Item"
                          >
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="p-8 font-medium text-center text-gray-500">
                      No items currently in quote. Click "Add Item" to add products.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 📝 BARABAR BOXES: Calculation & Notes Section */}
        <div className="grid items-stretch grid-cols-1 gap-6 mb-8 lg:grid-cols-2">
          
          {/* Notes Box */}
          <div className="flex flex-col h-full">
            <label className="block mb-2 text-sm font-semibold text-gray-700">Message/Terms for Client</label>
            <textarea 
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="E.g., Prices are inclusive of GST. Free delivery within 5 days. Valid for 7 days."
              className="flex-1 w-full p-4 text-sm text-gray-700 transition-all bg-white border border-gray-200 shadow-sm outline-none resize-none rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 💵 Professional Invoice Totals Box - SOFT THEME */}
          <div className="flex flex-col justify-between h-full p-6 transition-all border shadow-sm bg-slate-50 border-slate-200 rounded-xl">
            <div className="flex-1 space-y-4">
              <div className="flex justify-between text-sm text-slate-600">
                <span className="font-medium">Items Subtotal:</span>
                <span className="font-bold text-slate-800">₹ {subTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-white border rounded-lg shadow-sm border-slate-200">
                <span className="text-sm font-medium text-slate-600">Extra Discount (₹):</span>
                <div className="relative flex items-center w-36">
                  <span className="absolute text-sm font-medium left-3 text-slate-400">₹</span>
                  <input 
                    type="number" 
                    min="0"
                    value={totalDiscount === 0 ? "" : totalDiscount}
                    onChange={(e) => setTotalDiscount(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full py-1.5 pl-7 pr-3 text-sm font-bold text-right text-slate-800 transition-all bg-slate-50 border border-slate-200 rounded outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white focus:border-blue-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 mt-6 border-t border-slate-200">
              <div className="flex items-end justify-between">
                <div>
                  <p className="mb-1 text-xs font-bold tracking-wider uppercase text-slate-500">Final Total</p>
                  <p className="text-3xl font-extrabold leading-none text-blue-700 whitespace-nowrap">
                    ₹ {finalTotal > 0 ? finalTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : "0.00"}
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* 🚀 Action Buttons */}
        <div className="flex flex-col justify-end gap-4 pt-6 border-t border-gray-100 sm:flex-row">
          <button 
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-3 font-bold text-gray-700 transition border border-gray-300 rounded-xl hover:bg-gray-50"
          >
            Back
          </button>
          <button 
            type="submit"
            disabled={submitting || finalTotal <= 0 || quote.requestedItems.length === 0}
            className="flex items-center justify-center w-full gap-2 px-8 py-3 font-bold text-white transition-all bg-blue-600 rounded-xl hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto"
          >
            {submitting ? "Saving..." : (
              <>
                <FaPaperPlane /> {quote.status === "Pending" ? "Save & Generate Link" : "Update Quote"}
              </>
            )}
          </button>
        </div>
      </form>

    </div>
  );
};

export default QuoteEditor;