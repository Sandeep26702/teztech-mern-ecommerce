import React from 'react';
import { FaCloudUploadAlt, FaInfoCircle } from 'react-icons/fa';

const PaymentSection = ({ 
  paymentMethod, 
  setPaymentMethod, 
  orderNotes, 
  setOrderNotes,
  paymentDetails,
  setPaymentDetails 
}) => {

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPaymentDetails({ ...paymentDetails, screenshot: e.target.files[0] });
    }
  };

  return (
    // 👇 Yahan se Main Dabba (Parent) shuru hota hai
    <div className="p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm">
      <h2 className="mb-4 text-xl font-bold tracking-tight text-slate-900">Payment Information</h2>
      <p className="mb-6 text-sm text-slate-500">Choose your preferred payment method:</p>
      
      <div className="mb-8 space-y-3">
        {/* Option 1: Manual Transfer */}
        <label className={`flex items-center gap-4 p-5 cursor-pointer border-2 rounded-2xl transition-all duration-200 ${paymentMethod === "MANUAL" ? 'border-blue-600 bg-blue-50/50' : 'border-slate-100 hover:border-slate-200'}`}>
          <input 
            type="radio" 
            name="payment"
            value="MANUAL" 
            checked={paymentMethod === "MANUAL"} 
            onChange={(e) => setPaymentMethod(e.target.value)} 
            className="w-5 h-5 text-blue-600 cursor-pointer focus:ring-blue-500" 
          />
          <span className="text-sm font-bold tracking-wide uppercase text-slate-800">Manual Transfer (UPI, QR, NEFT)</span>
        </label>
        
        {/* Option 2: Store Pick-up */}
        <label className={`flex items-center gap-4 p-5 cursor-pointer border-2 rounded-2xl transition-all duration-200 ${paymentMethod === "STORE_PICKUP" ? 'border-blue-600 bg-blue-50/50' : 'border-slate-100 hover:border-slate-200'}`}>
          <input 
            type="radio" 
            name="payment"
            value="STORE_PICKUP" 
            checked={paymentMethod === "STORE_PICKUP"} 
            onChange={(e) => setPaymentMethod(e.target.value)} 
            className="w-5 h-5 text-blue-600 cursor-pointer focus:ring-blue-500" 
          />
          <span className="text-sm font-bold tracking-wide uppercase text-slate-800">Pay at Store (Pickup Only)</span>
        </label>
      </div>

      {/* --- QR & Verification Section --- */}
      {paymentMethod === "MANUAL" && (
        <div className="mt-6 p-6 border-2 border-dashed border-slate-100 rounded-[2rem] bg-slate-50/30 animate-fade-in">
          <div className="flex flex-col items-start gap-8 lg:flex-row">
            
            {/* Left: Minimalist QR Code Design */}
            <div className="w-full text-center lg:w-1/2">
              <div className="flex flex-col items-center justify-center">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                  <span className="text-xs font-black tracking-widest uppercase text-slate-500">Scan to Pay</span>
                </div>
                
                {/* Image Path: Make sure it matches your public folder image name */}
                <img 
                  src="/payment_QR.png" 
                  alt="Payment QR Code" 
                  className="object-contain w-64 h-64 p-1 mb-4 bg-white border shadow-sm border-slate-200 rounded-xl" 
                />
                
                <p className="text-sm font-extrabold tracking-tight uppercase text-slate-800">
                  Patel Purvit Ghanshyambhai
                </p>
              </div>
            </div>

            {/* Right: Verification Form */}
            <div className="w-full space-y-5 lg:w-1/2">
              <div className="flex gap-3 p-4 border border-blue-100 bg-blue-50 rounded-xl">
                <FaInfoCircle className="flex-shrink-0 mt-1 text-blue-500" />
                <p className="text-xs leading-relaxed text-blue-700">
                  Please upload the payment screenshot and enter the 12-digit UTR/Transaction ID for faster order verification.
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">UTR / Transaction ID</label>
                <input 
                  type="text" 
                  placeholder="Enter 12 digit UTR number"
                  className="w-full p-4 font-bold bg-white border outline-none border-slate-200 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-900"
                  value={paymentDetails.utrNumber}
                  onChange={(e) => setPaymentDetails({...paymentDetails, utrNumber: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Payment Screenshot</label>
                <div className="relative group">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 z-10 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center justify-center p-6 transition-all bg-white border-2 border-dashed border-slate-200 rounded-xl group-hover:border-blue-400">
                    <FaCloudUploadAlt className="mb-2 text-3xl transition-colors text-slate-300 group-hover:text-blue-500" />
                    <p className="text-xs font-bold text-slate-500">
                      {paymentDetails.screenshot ? paymentDetails.screenshot.name : "Click to upload screenshot"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Notes Box */}
      <div className="pt-8 mt-10 border-t border-slate-100">
          <label className="block mb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Add Your Notes / Comments</label>
          <textarea
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              placeholder="Ex: Please pack carefully, GST number etc."
              rows="3"
              className="w-full p-5 font-medium transition-all border outline-none resize-none bg-slate-50 border-slate-200 rounded-2xl focus:border-blue-500 focus:bg-white text-slate-700"
          ></textarea>
      </div>
    </div> 
    // 👆 Yahan Main Dabba (Parent) band ho gaya
  );
};

export default PaymentSection;