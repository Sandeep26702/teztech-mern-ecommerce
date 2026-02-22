import { useState } from "react";
import { useQuote } from "../context/QuoteContext"; 
import { FaTrashAlt, FaMinus, FaPlus, FaBoxOpen, FaPaperPlane } from "react-icons/fa";
import api from "../api/api"; // 🚀 Aapka backend API instance import kiya

const Quotation = () => {
  const { quoteItems, removeFromQuote, updateQuoteQuantity, clearQuote } = useQuote();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    message: ""
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 🚀 Is function ko async bana diya
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (quoteItems.length === 0) {
      alert("⚠️ Your quotation list is empty. Please add some products first.");
      return;
    }

    setIsSubmitting(true);
    
    // 📝 Data backend ke format ke hisaab se taiyaar
    const requestData = {
      userDetails: formData,
      requestedItems: quoteItems.map(item => ({
        productId: item._id || item.id,
        name: item.name,
        quantity: item.quantity
      }))
    };

    try {
      // 🌐 Seedha backend endpoint par POST request
      // (Agar aapka route alag hai toh "/quotes" ko uske hisaab se change kar lena, e.g., "/api/quotes")
      await api.post("/quotes", requestData);

      // Success hone par
      alert("🎉 Quotation request submitted successfully! We will contact you soon.");
      
      // Form aur Quote list clear karna
      setFormData({ name: "", email: "", company: "", phone: "", message: "" });
      clearQuote(); 

    } catch (error) {
      console.error("Error submitting quote:", error);
      alert(error.response?.data?.message || "❌ Failed to submit quotation. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-10 font-sans bg-gray-50 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* 🌟 Header */}
        <div className="mb-10 text-center">
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
            Request a Quote
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-gray-500">
            Review your selected items and provide your details. Our team will get back to you with the best competitive pricing within 24 hours.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
          
          {/* 📦 Left Side: Selected Items List */}
          <div className="lg:col-span-7">
            <h2 className="flex items-center gap-2 mb-6 text-xl font-bold text-gray-900">
              <FaBoxOpen className="text-blue-500" /> Selected Items ({quoteItems.length})
            </h2>

            {quoteItems.length === 0 ? (
              <div className="p-8 text-center bg-white border border-gray-100 shadow-sm rounded-2xl">
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 text-2xl text-blue-500 rounded-full bg-blue-50">
                  <FaBoxOpen />
                </div>
                <h3 className="mb-2 text-lg font-bold text-gray-900">No items selected</h3>
                <p className="mb-6 text-gray-500">Go back to products and add items to your quotation list.</p>
                <a href="/products" className="inline-block px-6 py-2 font-semibold text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700">
                  Browse Products
                </a>
              </div>
            ) : (
              <div className="space-y-4">
                {quoteItems.map((item) => {
                  
                  // 🚀 BULLETPROOF IMAGE LOGIC
                  const imageUrl = item?.image || item?.images?.[0]?.url || item?.images?.[0] || "https://placehold.co/400x300/f3f4f6/a1a1aa?text=No+Image";

                  return (
                    <div key={item._id || item.id} className="flex items-center gap-4 p-4 transition-shadow bg-white border border-gray-100 shadow-sm rounded-2xl hover:shadow-md">
                      
                      {/* Item Image */}
                      <div className="flex-shrink-0 w-20 h-20 overflow-hidden border border-gray-100 bg-gray-50 rounded-xl">
                        <img 
                          src={imageUrl} 
                          alt={item?.name || "Product"} 
                          className="object-contain w-full h-full mix-blend-multiply" 
                        />
                      </div>

                      {/* Item Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-gray-900 truncate">{item.name}</h3>
                        <p className="mt-1 text-sm text-gray-500 truncate">{item.category || "Component"}</p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center p-1 border border-gray-200 rounded-lg bg-gray-50">
                        <button 
                          type="button"
                          onClick={() => updateQuoteQuantity(item._id, Math.max(1, item.quantity - 1))}
                          className="flex items-center justify-center w-8 h-8 text-gray-600 transition-colors rounded hover:text-blue-600 hover:bg-white"
                        >
                          <FaMinus className="text-xs" />
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateQuoteQuantity(item._id, parseInt(e.target.value) || 1)}
                          className="w-10 text-sm font-bold text-center bg-transparent appearance-none focus:outline-none"
                        />
                        <button 
                          type="button"
                          onClick={() => updateQuoteQuantity(item._id, item.quantity + 1)}
                          className="flex items-center justify-center w-8 h-8 text-gray-600 transition-colors rounded hover:text-blue-600 hover:bg-white"
                        >
                          <FaPlus className="text-xs" />
                        </button>
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => removeFromQuote(item._id)}
                        className="p-2 text-gray-400 transition-colors rounded-lg hover:text-red-500 hover:bg-red-50"
                        title="Remove from list"
                      >
                        <FaTrashAlt />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 📝 Right Side: Request Form */}
          <div className="lg:col-span-5">
            <div className="sticky p-6 bg-white border border-gray-100 shadow-xl rounded-2xl sm:p-8 top-24">
              <h2 className="mb-6 text-xl font-bold text-gray-900">Your Details</h2>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                
                {/* Name */}
                <div>
                  <label className="block mb-1.5 text-sm font-semibold text-gray-700">Full Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="John Doe"
                    className="w-full px-4 py-3 transition-all duration-200 border border-gray-200 bg-gray-50 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block mb-1.5 text-sm font-semibold text-gray-700">Email Address <span className="text-red-500">*</span></label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="john@company.com"
                    className="w-full px-4 py-3 transition-all duration-200 border border-gray-200 bg-gray-50 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Company & Phone */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1.5 text-sm font-semibold text-gray-700">Company</label>
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      placeholder="Tech Ltd."
                      className="w-full px-4 py-3 transition-all duration-200 border border-gray-200 bg-gray-50 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block mb-1.5 text-sm font-semibold text-gray-700">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+91 98765..."
                      className="w-full px-4 py-3 transition-all duration-200 border border-gray-200 bg-gray-50 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="block mb-1.5 text-sm font-semibold text-gray-700">Additional Notes</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Any specific requirements or timeline..."
                    className="w-full px-4 py-3 transition-all duration-200 border border-gray-200 resize-y bg-gray-50 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  ></textarea>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || quoteItems.length === 0}
                  className="flex items-center justify-center w-full gap-3 px-8 py-4 font-bold text-white transition-all duration-300 transform bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl hover:from-blue-700 hover:to-cyan-600 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="w-5 h-5 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </>
                  ) : (
                    <>
                      <FaPaperPlane /> Send Quote Request
                    </>
                  )}
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