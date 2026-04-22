import React, { useState } from 'react';
import { getTrueUnitPrice } from "../../context/CartContext";

const renderSelectedOptions = (item) => {
  let results = [];
  if (item?.selectedCustomFields && typeof item.selectedCustomFields === 'object') {
    Object.entries(item.selectedCustomFields).forEach(([key, value]) => {
      // 🔥 FIX: Hide internal tags
      if (key === "_finalPrice") return; 
      if (Array.isArray(value) && value.length > 0) results.push(`${key}: ${value.join(", ")}`);
      else if (String(value || "").trim()) results.push(`${key}: ${value}`);
    });
  }
  return results;
};

const OrderSummary = ({ summaryRows, shippingTotal, loading, cartItems }) => {
  const [isOpen, setIsOpen] = useState(false);

  let cartTotal = 0;
  let totalGstAmount = 0;

  const enrichedSummaryRows = summaryRows.map((item) => {
    const originalCartItem = cartItems?.find(ci => (ci._id === item.key) || (ci.productId?._id === item.key) || (ci.productId === item.key)) || item;
    
    const unitPrice = getTrueUnitPrice(originalCartItem);
    const qty = Number(item.qty || originalCartItem.quantity || 1);
    const gstRate = Number(originalCartItem?.gstRate || originalCartItem?.productId?.gstRate || originalCartItem?.productId?.GST || 18);

    cartTotal += (unitPrice * qty);
    const itemTotal = unitPrice * qty;
    totalGstAmount += itemTotal - (itemTotal / (1 + (gstRate / 100)));

    return { ...item, originalCartItem, unitPrice, variationsLines: renderSelectedOptions(originalCartItem) };
  });

  const grandTotal = cartTotal + shippingTotal;

  return (
    <>
      <div className="hidden lg:block sticky top-24 bg-white p-8 rounded-[2rem] border shadow-sm">
        <h2 className="mb-6 text-xl font-bold">Order Summary</h2>
        <div className="space-y-4 mb-6 border-b pb-6 max-h-[350px] overflow-y-auto">
          {enrichedSummaryRows.map((item, index) => (
            <div key={`${item.key}-${index}`} className="flex gap-4 group">
              <div className="relative flex-shrink-0">
                <img src={item.image} alt={item.name} className="object-contain w-16 h-16 border rounded-xl" />
                <span className="absolute -top-2 -right-2 bg-slate-900 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">{item.qty}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{item.name}</p>
                {item.variationsLines.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {item.variationsLines.map((line, i) => (<span key={i} className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{line}</span>))}
                  </div>
                )}
                <p className="mt-1 text-xs font-medium">Unit: ₹{item.unitPrice.toLocaleString("en-IN")}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mb-6 space-y-3 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span className="font-bold">₹{cartTotal.toLocaleString("en-IN")}</span></div>
          <div className="flex justify-between"><span>Shipping</span><span className="font-bold">₹{shippingTotal.toLocaleString("en-IN")}</span></div>
          <div className="flex justify-between text-xs italic text-slate-400"><span>* Total includes GST of ₹{Math.round(totalGstAmount).toLocaleString("en-IN")}</span></div>
        </div>
        <div className="flex items-center justify-between pt-5 border-t">
          <span className="text-sm font-black">Total Amount</span>
          <span className="text-2xl font-black text-slate-900">₹{grandTotal.toLocaleString("en-IN")}</span>
        </div>
      </div>
      
      {/* Mobile view */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] p-4 bg-white border-t shadow-[0_-10px_40px_rgba(0,0,0,0.08)] rounded-t-[2rem]">
        {isOpen && (
          <div className="px-2 py-2 mb-4 space-y-3 animate-fade-in">
            <div className="flex justify-between text-sm"><span className="text-slate-500">Subtotal</span><span className="font-bold">₹{cartTotal.toLocaleString("en-IN")}</span></div>
            <div className="flex justify-between text-sm"><span className="text-slate-500">Shipping Charge</span><span className="font-bold text-emerald-600">₹{shippingTotal.toLocaleString("en-IN")}</span></div>
            <p className="text-[10px] text-slate-400 italic text-right">* Total includes GST of ₹{Math.round(totalGstAmount).toLocaleString("en-IN")}</p>
          </div>
        )}
        <div className="flex items-center justify-between gap-4">
          <div className="cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
            <div className="flex items-center gap-1">
              <span className="text-xl font-black text-slate-900">₹{grandTotal.toLocaleString("en-IN")}</span>
            </div>
            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter">Bill Details</p>
          </div>
          <button type="submit" form="checkout-form" disabled={loading || cartItems.length === 0} className="flex-1 py-4 text-sm font-bold text-white bg-slate-900 rounded-2xl">Place Order</button>
        </div>
      </div>
    </>
  );
};
export default OrderSummary;