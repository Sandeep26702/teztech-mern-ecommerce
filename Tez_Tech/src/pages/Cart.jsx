import React, { useState, useEffect } from "react";
import { FaMinus, FaPlus, FaShoppingCart, FaTrashAlt } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { useCart, getTrueUnitPrice } from "../context/CartContext";
import api from "../utils/api";

const getItemKey = (item) => item._id || item.localItemId || item.productId?._id || item.productId;

const renderSelectedOptions = (item) => {
  const options = [];
  const fields = item?.selectedCustomFields || {};
  Object.entries(fields).forEach(([k, v]) => {
    // 🔥 FIX: Hide internal tags from customer view
    if (k === "_finalPrice" || !v || (Array.isArray(v) && v.length === 0)) return;
    options.push(`${k}: ${Array.isArray(v) ? v.join(", ") : v}`);
  });
  return [...new Set(options)];
};

const Cart = () => {
  const { cartItems, removeFromCart, updateQuantity } = useCart();
  const navigate = useNavigate();
  const [defaultShipping, setDefaultShipping] = useState(0);
  const [isShippingLoading, setIsShippingLoading] = useState(true);

  useEffect(() => {
    const fetchDefaultShipping = async () => {
      try {
        const { data } = await api.get("/shipping/active");
        if (data.success && data.providers?.length > 0) {
          const defaultProvider = data.providers.find(p => p.isDefault) || data.providers[0];
          
          let totalWeight = cartItems.reduce((acc, item) => {
            const w = Number(item?.productId?.weightKg) || Number(item?.weightKg) || 0;
            const q = Number(item?.quantity) || 1;
            return acc + (w * q);
          }, 0);

          if (totalWeight === 0 && cartItems.length > 0) totalWeight = 1; // Default to 1 KG minimum
          const rate = defaultProvider.ratePerKg ?? defaultProvider.baseRate ?? 0;
          setDefaultShipping(Math.round(totalWeight * rate));
        }
      } catch (err) {
        console.error("Failed to fetch shipping", err);
      } finally {
        setIsShippingLoading(false);
      }
    };
    
    if (cartItems?.length > 0) {
      fetchDefaultShipping();
    } else {
      setIsShippingLoading(false);
    }
  }, [cartItems]);

  let cartTotal = 0;
  let totalGstAmount = 0;

  cartItems?.forEach(item => {
    const unitPrice = getTrueUnitPrice(item); 
    const qty = Number(item.quantity || 1);
    const gstRate = Number(item.gstRate || item.productId?.gstRate || item.productId?.GST || 18);

    cartTotal += (unitPrice * qty);
    const itemTotal = unitPrice * qty;
    totalGstAmount += itemTotal - (itemTotal / (1 + (gstRate / 100)));
  });

  const grandTotal = cartTotal + defaultShipping;

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 bg-slate-50">
        <FaShoppingCart className="mb-4 text-6xl text-slate-300" />
        <h2 className="text-2xl font-bold text-slate-900">Your cart is empty.</h2>
        <Link to="/products" className="px-8 py-3.5 mt-8 font-bold text-white bg-blue-600 rounded-xl">Shop Now</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 pt-24 pb-12 font-sans bg-slate-50">
      <div className="w-full">
        <h1 className="mb-8 text-3xl font-black">Shopping Cart</h1>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-7 xl:col-span-8 bg-white border rounded-[2rem]">
              {cartItems.map((item) => {
                const itemKey = getItemKey(item);
                const unitPrice = getTrueUnitPrice(item); 
                const selectedOptions = renderSelectedOptions(item);

                return (
                  <div key={itemKey} className="flex flex-col gap-6 p-6 border-b border-slate-100 sm:flex-row sm:items-center">
                    <img src={item.image || item.productId?.image || "https://placehold.co/100x100"} alt="Product" className="object-contain w-24 h-24 border rounded-2xl" />
                    <div className="flex-1">
                      <h3 className="text-lg font-bold">{item.name || item.productId?.name}</h3>
                      <p className="mt-1 text-sm font-semibold text-slate-500">Unit Price: ₹{unitPrice.toLocaleString("en-IN")}</p>
                      {selectedOptions.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {selectedOptions.map((opt, idx) => (<p key={idx} className="px-2 py-1 text-xs font-bold text-blue-700 rounded bg-blue-50 w-fit">{opt}</p>))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-4">
                      <div className="flex items-center border rounded-xl">
                        <button onClick={() => updateQuantity(itemKey, Math.max(1, item.quantity - 1))} className="p-3 text-slate-500"><FaMinus className="text-xs" /></button>
                        <span className="w-10 font-bold text-center text-slate-900">{item.quantity}</span>
                        <button onClick={() => updateQuantity(itemKey, item.quantity + 1)} className="p-3 text-slate-500"><FaPlus className="text-xs" /></button>
                      </div>
                      <button onClick={() => removeFromCart(itemKey)} className="p-3 text-slate-400"><FaTrashAlt /></button>
                    </div>
                    <div className="text-right sm:w-28">
                      <p className="text-lg font-black text-slate-900">₹{(unitPrice * item.quantity).toLocaleString("en-IN")}</p>
                    </div>
                  </div>
                );
              })}
          </div>
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="sticky p-8 bg-white border shadow-lg rounded-[2rem] top-28">
              <h2 className="mb-8 text-2xl font-black">Order Summary</h2>
              <div className="space-y-5 text-sm font-medium">
                <div className="flex justify-between"><span>Subtotal</span><span className="font-bold">₹{cartTotal.toLocaleString("en-IN")}</span></div>
                <div className="flex justify-between">
                  <span>Shipping Charge (By Default)</span>
                  <span className="font-bold text-slate-700">
                    {isShippingLoading ? "Calculating..." : `₹${defaultShipping.toLocaleString("en-IN")}`}
                  </span>
                </div>
                <div className="flex justify-between pb-4 text-xs italic border-b text-slate-400"><span>* Total includes GST of ₹{Math.round(totalGstAmount).toLocaleString("en-IN")}</span></div>
                <div className="flex items-end justify-between pt-2 mt-2">
                  <span className="text-xl font-black">Total Amount</span>
                  <span className="text-2xl font-black text-blue-600">₹{grandTotal.toLocaleString("en-IN")}</span>
                </div>
              </div>
              <button onClick={() => navigate("/checkout")} className="w-full py-4 mt-8 font-bold text-white bg-slate-900 rounded-2xl">Proceed to Checkout</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Cart;