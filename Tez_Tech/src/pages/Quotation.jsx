import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuote } from "../context/QuoteContext"; 
import { FaTrashAlt, FaMinus, FaPlus, FaBoxOpen, FaPaperPlane } from "react-icons/fa";
import api from "../utils/api"; 

const Quotation = () => {
  const { quoteItems, removeFromQuote, updateQuoteQuantity, clearQuote } = useQuote();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    message: ""
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Requirements render karne ka logic
  const renderRequirements = (item) => {
    const reqs = [];
    
    // 1. CSV Attributes
    if (item?.selectedAttributes && typeof item.selectedAttributes === 'object') {
       Object.entries(item.selectedAttributes).forEach(([key, opt]) => {
          let text = `${key}: ${opt.value}`;
          if (opt.priceAdjustment) text += ` (+₹${opt.priceAdjustment})`;
          reqs.push(text);
       });
    }

    // 2. Standard Variants
    if (item?.selectedVariant?.combination && typeof item.selectedVariant.combination === 'object') {
       Object.entries(item.selectedVariant.combination).forEach(([k, v]) => {
          reqs.push(`${k}: ${v}`);
       });
    }

    // 3. Custom Fields
    if (item?.selectedCustomFields && typeof item.selectedCustomFields === 'object') {
       Object.entries(item.selectedCustomFields).forEach(([k, v]) => {
          if (v && String(v).trim() !== "") reqs.push(`${k}: ${v}`);
       });
    }

    return reqs;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (quoteItems.length === 0) {
      alert("⚠️ Your quotation list is empty!");
      return;
    }

    setIsSubmitting(true);
    
    const normalizedItems = quoteItems
      .map((item) => {
        const productId =
          item?.productId?._id ||
          item?.productId?.id ||
          (typeof item?.productId === "string" ? item.productId : null);

        return {
          productId,
          name: item?.productId?.name || item?.name || "Product",
          quantity: Number(item?.quantity || 1),
          selectedVariant: item?.selectedVariant || null,
          selectedAttributes: item?.selectedAttributes || {},
          selectedCustomFields: item?.selectedCustomFields || {}, 
        };
      })
      .filter((item) => item.productId && item.quantity > 0);

    if (normalizedItems.length !== quoteItems.length) {
      alert("Some invalid items were found in your quote list. Please remove and try again.");
      setIsSubmitting(false);
      return;
    }

    const requestData = {
      userDetails: formData,
      requestedItems: normalizedItems
    };

    try {
      await api.post("/quote/create", requestData); 

      alert("🎉 Quotation request submitted successfully!");
      
      setFormData({ name: "", email: "", company: "", phone: "", message: "" });
      clearQuote(); 

    } catch (error) {
      console.error("Submission Error:", error);
      alert(error.response?.data?.message || "❌ Failed to submit request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🔥 NAYA LOGIC: URL parameters generate karne ke liye
  const handleProductClick = (item, productId) => {
    if (!productId) return;

    const params = new URLSearchParams();

    // Agar variant selected hai, toh URL param me daalo
    if (item?.selectedVariant?._id) {
      params.set("variant", item.selectedVariant._id);
    }

    // Agar attributes selected hain, toh unko stringify karke URL me daalo
    if (item?.selectedAttributes && Object.keys(item.selectedAttributes).length > 0) {
      params.set("attrs", encodeURIComponent(JSON.stringify(item.selectedAttributes)));
    }

    const queryString = params.toString();
    // Navigate with standard Real-World URL
    navigate(`/products/${productId}${queryString ? `?${queryString}` : ""}`);
  };

  return (
    <div className="min-h-screen px-4 py-10 font-sans bg-gray-50 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        <div className="mb-10 text-center">
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
            Request a Quote
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-gray-500">
            Review your selected items. Our team will get back to you with competitive pricing soon.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
          
          {/* 📦 Left Side: Quotation List */}
          <div className="lg:col-span-7">
            <h2 className="flex items-center gap-2 mb-6 text-xl font-bold text-gray-900">
              <FaBoxOpen className="text-blue-500" /> Selected Items ({quoteItems.length})
            </h2>

            {quoteItems.length === 0 ? (
              <div className="p-8 text-center bg-white border border-gray-100 shadow-sm rounded-2xl">
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 text-2xl text-blue-500 rounded-full bg-blue-50">
                  <FaBoxOpen />
                </div>
                <h3 className="mb-2 text-lg font-bold text-gray-900">No items in quote</h3>
                <p className="mb-6 text-gray-500">Add some products to see them here.</p>
                <a href="/products" className="inline-block px-6 py-2 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                  Browse Products
                </a>
              </div>
            ) : (
              <div className="space-y-4">
                {quoteItems.map((item) => {
                  const itemId = item.productId?._id || item._id || item.id;
                  const productId =
                    item?.productId?._id ||
                    item?.productId?.id ||
                    (typeof item?.productId === "string" ? item.productId : null) ||
                    item?.product?._id ||
                    item?.product;
                  const imageUrl =
                    item.productId?.image ||
                    item.productId?.images?.[0]?.url ||
                    item.productId?.images?.[0] ||
                    item.image ||
                    "https://placehold.co/100x100/f3f4f6/a1a1aa?text=No+Image";
                  const productName = item.productId?.name || item.name;
                  
                  const requirementsList = renderRequirements(item);

                  return (
                    <div
                      key={itemId}
                      className="flex items-center gap-4 p-4 bg-white border border-gray-100 shadow-sm rounded-2xl cursor-pointer"
                      // 🔥 YAHAN NAYA FUNCTION CALL HOGA URL PARAMS WALA
                      onClick={() => handleProductClick(item, productId)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="flex-shrink-0 w-16 h-16 overflow-hidden border bg-gray-50 rounded-xl">
                        <img src={imageUrl} alt={productName} className="object-contain w-full h-full" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-gray-900 truncate">{productName}</h3>
                        
                        {requirementsList.length > 0 && (
                          <div className="mt-1 space-y-1">
                            {requirementsList.map((line, idx) => (
                              <p key={`${itemId}-${idx}`} className="text-xs text-gray-500">
                                {line}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center p-1 border rounded-lg bg-gray-50" onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            updateQuoteQuantity(itemId, Math.max(1, item.quantity - 1));
                          }}
                          className="flex items-center justify-center w-8 h-8 rounded hover:bg-white"
                        >
                          <FaMinus className="text-xs" />
                        </button>
                        <span className="w-8 font-bold text-center">{item.quantity}</span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            updateQuoteQuantity(itemId, item.quantity + 1);
                          }}
                          className="flex items-center justify-center w-8 h-8 rounded hover:bg-white"
                        >
                          <FaPlus className="text-xs" />
                        </button>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromQuote(itemId);
                        }}
                        className="p-2 text-gray-400 hover:text-red-500"
                      >
                        <FaTrashAlt />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 📝 Right Side: Submission Form */}
          <div className="lg:col-span-5">
            <div className="sticky p-6 bg-white border border-gray-100 shadow-xl rounded-2xl sm:p-8 top-24">
              <h2 className="mb-6 text-xl font-bold text-gray-900">Contact Information</h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="text" name="name" placeholder="Full Name *"
                  required value={formData.name} onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />

                <input
                  type="email" name="email" placeholder="Email Address *"
                  required value={formData.email} onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />

                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text" name="company" placeholder="Company"
                    value={formData.company} onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <input
                    type="tel" name="phone" placeholder="Phone"
                    required pattern="[0-9]{10}" title="Please enter 10 digit phone number"
                    value={formData.phone} onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <textarea
                  name="message" placeholder="Additional Notes..."
                  rows="3" value={formData.message} onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                ></textarea>

                <button
                  type="submit"
                  disabled={isSubmitting || quoteItems.length === 0}
                  className="flex items-center justify-center w-full gap-3 px-8 py-4 font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl hover:shadow-lg disabled:opacity-50"
                >
                  {isSubmitting ? "Processing..." : <><FaPaperPlane /> Submit Quote</>}
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Quotation;