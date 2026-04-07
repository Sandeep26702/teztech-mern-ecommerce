import React from 'react';

const OrderSummary = ({ summaryRows, cartTotal, shippingTotal, igstTotal, grandTotal, loading, cartItems }) => {
  return (
    <div className="sticky top-24 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
      <h2 className="mb-6 text-xl font-semibold text-gray-800">Shopping cart</h2>
      
      {/* Cart Items */}
      <div className="space-y-4 mb-6 border-b border-gray-100 pb-6 max-h-[400px] overflow-y-auto pr-2">
        {summaryRows.map((item) => (
          <div key={item.key} className="flex gap-4">
            <div className="relative">
              <img src={item.image} alt={item.name} className="w-16 h-16 object-cover border border-gray-200 rounded-md" />
              <span className="absolute -top-2 -right-2 bg-gray-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                {item.qty}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800 line-clamp-2">{item.name}</p>
              <p className="text-sm font-semibold text-gray-900 mt-1">₹{item.unitPrice.toFixed(2)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Bill Details */}
      <div className="space-y-3 text-sm text-gray-600 mb-6">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span className="font-medium text-gray-900">₹{cartTotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Shipping</span>
          <span className="font-medium text-gray-900">₹{shippingTotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>IGST</span>
          <span className="font-medium text-gray-900">₹{igstTotal.toFixed(2)}</span>
        </div>
      </div>

      {/* Final Total */}
      <div className="flex justify-between items-center border-t border-gray-200 pt-4 mb-6">
        <span className="text-lg font-bold text-gray-900">TOTAL</span>
        <span className="text-2xl font-bold text-gray-900">₹{grandTotal.toFixed(2)}</span>
      </div>

      {/* Submit Button */}
      <button 
        type="submit" 
        form="checkout-form" // Binds to the form in CheckoutPage
        disabled={loading || cartItems.length === 0} 
        className="w-full bg-gray-900 hover:bg-black text-white font-semibold py-4 rounded-md transition duration-200 disabled:bg-gray-400"
      >
        {loading ? "Processing..." : `Continue & Pay ₹${grandTotal.toFixed(2)}`}
      </button>
    </div>
  );
};

export default OrderSummary;