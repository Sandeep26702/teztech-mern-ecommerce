import React, { useState } from 'react';

const OrderSummary = ({ summaryRows, cartTotal, shippingTotal, igstTotal, grandTotal, loading, cartItems }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* --- DESKTOP VIEW (Visible on lg screens) --- */}
      <div className="hidden lg:block sticky top-24 bg-white p-8 rounded-[2rem] border border-slate-200/60 shadow-sm">
        <h2 className="mb-6 text-xl font-bold tracking-tight text-slate-900">Order Summary</h2>
        
        {/* Cart Items */}
        <div className="space-y-4 mb-6 border-b border-slate-100 pb-6 max-h-[350px] overflow-y-auto custom-scrollbar">
          {summaryRows.map((item) => (
            <div key={item.key} className="flex gap-4 group">
              <div className="relative flex-shrink-0">
                <img src={item.image} alt={item.name} className="object-contain w-16 h-16 border bg-slate-50 border-slate-100 rounded-xl" />
                <span className="absolute -top-2 -right-2 bg-slate-900 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-lg">
                  {item.qty}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold transition-colors text-slate-800 line-clamp-1 group-hover:text-blue-600">{item.name}</p>
                <p className="mt-1 text-xs font-medium tracking-wider uppercase text-slate-500">Unit: ₹{item.unitPrice.toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Bill Details */}
        <div className="mb-6 space-y-3 text-sm">
          <div className="flex justify-between text-slate-500">
            <span>Subtotal</span>
            <span className="font-bold text-slate-900">₹{cartTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>Shipping</span>
            <span className="font-bold text-slate-900">₹{shippingTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>IGST (18%)</span>
            <span className="font-bold text-slate-900">₹{igstTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Final Total */}
        <div className="flex items-center justify-between pt-5 border-t border-slate-100">
          <span className="text-sm font-black tracking-widest uppercase text-slate-400">Total Amount</span>
          <span className="text-2xl font-black text-slate-900">₹{grandTotal.toFixed(2)}</span>
        </div>
        
        <p className="mt-4 text-[11px] text-center text-slate-400 font-medium italic">
          Please complete all steps to place your order.
        </p>
      </div>

      {/* --- MOBILE VIEW (Sticky Floating Bar) --- */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] p-4 bg-white border-t border-slate-100 shadow-[0_-10px_40px_rgba(0,0,0,0.08)] rounded-t-[2rem]">
        
        {/* Mobile Detail Toggle (Click total to see breakdown) */}
        {isOpen && (
          <div className="px-2 py-2 mb-4 space-y-3 animate-fade-in">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Items Total ({summaryRows.length})</span>
              <span className="font-bold">₹{cartTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Shipping</span>
              <span className="font-bold text-emerald-600">₹{shippingTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pb-2 text-sm border-b border-dashed">
              <span className="text-slate-500">Taxes</span>
              <span className="font-bold">₹{igstTotal.toFixed(2)}</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-4">
          <div className="cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
            <div className="flex items-center gap-1">
              <span className="text-xl font-black text-slate-900">₹{grandTotal.toFixed(2)}</span>
              <svg className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 15l7-7 7 7" />
              </svg>
            </div>
            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter">View Detailed Bill</p>
          </div>

          <button 
            type="submit" 
            form="checkout-form"
            disabled={loading || cartItems.length === 0}
            className="flex-1 py-4 text-sm font-bold text-white transition-all shadow-lg bg-slate-900 rounded-2xl shadow-slate-200 active:scale-95 disabled:bg-slate-300"
          >
            {loading ? "Processing..." : "Place Order"}
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .animate-fade-in { animation: fadeIn 0.3s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </>
  );
};

export default OrderSummary;