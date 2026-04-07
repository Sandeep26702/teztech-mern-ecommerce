import React from "react";
import { FaMinus, FaPlus, FaShoppingCart, FaTrashAlt } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";

const getItemKey = (item) => item._id || item.localItemId || item.productId?._id || item.productId;

const getProductId = (item) =>
  item?.productId?._id ||
  item?.productId?.id ||
  (typeof item?.productId === "string" ? item.productId : null) ||
  item?.product?._id ||
  item?.product;

const getUnitPrice = (item) =>
  Number(
    item?.pricing?.unitPrice ||
      item?.pricingSnapshot?.unitPrice ||
      item?.unitPrice ||
      item?.productId?.price ||
      item?.price ||
      0
  );

const getItemShippingCharge = (item) =>
  Number(item?.productId?.shippingCharge || item?.shippingCharge || 0);

// 🔥 Options fetch karne ka logic wahi hai
const renderSelectedOptions = (item) => {
  const options = [];

  const variantCombo = item?.variant?.combination || item?.selectedVariant?.combination;
  if (variantCombo) {
    Object.entries(variantCombo).forEach(([k, v]) => {
      options.push(`${k}: ${v}`);
    });
  }

  const attrs = item?.attributes || item?.selectedAttributes;
  if (attrs) {
    Object.entries(attrs).forEach(([k, v]) => {
      const val = typeof v === 'object' && v !== null ? v.value : v;
      if (val) options.push(`${k}: ${val}`);
    });
  }

  if (options.length === 0) {
    const fields = 
      item?.selectedCustomFields || 
      item?.pricingSnapshot?.selectedCustomFields || 
      item?.pricing?.selectedOptions;

    if (fields && typeof fields === "object") {
      Object.entries(fields).forEach(([k, v]) => {
        if (Array.isArray(v)) {
          if (v.length) options.push(`${k}: ${v.join(", ")}`);
        } else if (v) {
          options.push(`${k}: ${v}`);
        }
      });
    }
  }

  return [...new Set(options)]; 
};

const Cart = () => {
  const { cartItems, removeFromCart, updateQuantity, getCartTotal } = useCart();
  const navigate = useNavigate();

  // 💰 PRICING & TAX LOGIC
  const IGST_RATE = 0.18; // 18% IGST Standard for Electronics
  
  const cartTotal = Number(getCartTotal() || 0); // Subtotal
  const shippingTotal = cartItems.reduce(
    (sum, item) => sum + getItemShippingCharge(item) * Number(item.quantity || 0),
    0
  );
  
  // IGST Calculation
  const estimatedIGST = cartTotal * IGST_RATE;
  
  // Grand Total = Subtotal + Shipping + IGST
  const grandTotal = (cartTotal + shippingTotal + estimatedIGST).toFixed(2);

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 bg-slate-50">
        <div className="flex items-center justify-center w-24 h-24 mb-6 bg-white rounded-full shadow-sm">
          <FaShoppingCart className="text-4xl text-slate-300" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Your cart is empty.</h2>
        <p className="mt-2 text-slate-500">Add some premium products to start shopping.</p>
        <Link to="/products" className="px-8 py-3.5 mt-8 font-bold text-white transition-all shadow-lg bg-blue-600 rounded-xl hover:bg-blue-700 hover:shadow-blue-200 active:scale-95">
          Shop Now
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 pt-24 pb-12 font-sans sm:px-6 lg:px-8 bg-slate-50 selection:bg-blue-100 selection:text-blue-900">
      <div className="mx-auto max-w-7xl">
        
        <div className="flex items-end justify-between mb-8">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Shopping Cart</h1>
          <span className="text-sm font-bold tracking-widest uppercase text-slate-500">{cartItems.length} Items</span>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
          
          {/* 🛒 LEFT: CART ITEMS LIST */}
          <div className="lg:col-span-7 xl:col-span-8">
            <div className="overflow-hidden bg-white border shadow-sm border-slate-200/60 rounded-[2rem]">
              {cartItems.map((item, index) => {
                const itemKey = getItemKey(item) || `fallback-key-${index}`;
                const productId = getProductId(item);
                const itemImage =
                  item.variant?.image || 
                  item.selectedVariant?.image ||
                  item.productId?.image ||
                  item.productId?.images?.[0]?.url ||
                  item.productId?.images?.[0] ||
                  item.image ||
                  "https://placehold.co/100x100/f8fafc/94a3b8?text=No+Image";
                
                const itemName = item.productId?.name || item.name || "Unknown Product";
                const unitPrice = getUnitPrice(item);
                const selectedOptions = renderSelectedOptions(item);

                // URL PARAMS
                const vId = item.variant?._id || item.selectedVariant?._id || (typeof item.variant === 'string' ? item.variant : "");
                const attrs = item.attributes || item.selectedAttributes;
                const attrsString = attrs && Object.keys(attrs).length > 0 
                  ? encodeURIComponent(JSON.stringify(attrs)) 
                  : "";

                let productUrl = `/products/${productId}`; 
                const queryParams = [];
                if (vId) queryParams.push(`variant=${vId}`);
                if (attrsString) queryParams.push(`attrs=${attrsString}`);
                if (queryParams.length > 0) {
                  productUrl += `?${queryParams.join("&")}`;
                }

                return (
                  <div
                    key={itemKey}
                    className="flex flex-col gap-6 p-6 transition-colors border-b cursor-pointer border-slate-100 sm:flex-row sm:items-center last:border-0 hover:bg-slate-50/50 group"
                    onClick={() => {
                      if (productId) {
                        navigate(productUrl, {
                          state: { selectedCustomFields: item.selectedCustomFields || {} },
                        });
                      }
                    }}
                  >
                    {/* Product Image */}
                    <div className="flex-shrink-0 w-24 h-24 overflow-hidden transition-shadow bg-white border shadow-sm border-slate-100 rounded-2xl group-hover:shadow-md">
                      <img src={itemImage} alt={itemName} className="object-contain w-full h-full p-2" />
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold truncate text-slate-900">{itemName}</h3>
                      <p className="mt-1 text-sm font-semibold text-slate-500">Unit Price: Rs {unitPrice.toFixed(2)}</p>
                      
                      {/* 🔥 Premium Variants Print (Split Label and Value) */}
                      {selectedOptions.length > 0 && (
                        <div className="mt-3 space-y-1.5">
                          {selectedOptions.map((line, idx) => {
                            const [label, ...valArr] = line.split(":");
                            const value = valArr.join(":");
                            return (
                              <p key={`${itemKey}-option-${idx}`} className="text-xs tracking-wide uppercase text-slate-500">
                                {label}: <span className="font-bold text-slate-800">{value}</span>
                              </p>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Controls (Qty & Delete) */}
                    <div className="flex items-center justify-between gap-6 sm:justify-end">
                      
                      {/* Qty Selector */}
                      <div className="flex items-center overflow-hidden border shadow-sm bg-slate-50 border-slate-200 rounded-xl" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateQuantity(itemKey, Math.max(1, item.quantity - 1));
                          }}
                          className="p-3 transition-colors text-slate-500 hover:text-blue-600 hover:bg-blue-50 focus:outline-none"
                        >
                          <FaMinus className="text-xs" />
                        </button>
                        <span className="w-10 font-bold text-center text-slate-900">{item.quantity}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateQuantity(itemKey, item.quantity + 1);
                          }}
                          className="p-3 transition-colors text-slate-500 hover:text-blue-600 hover:bg-blue-50 focus:outline-none"
                        >
                          <FaPlus className="text-xs" />
                        </button>
                      </div>

                      {/* Delete Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromCart(itemKey);
                        }}
                        className="p-3 transition-all text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl focus:outline-none active:scale-90"
                        title="Remove Item"
                      >
                        <FaTrashAlt />
                      </button>

                    </div>

                    {/* Line Total */}
                    <div className="text-right sm:w-28">
                      <p className="text-lg font-black text-slate-900">
                        Rs {(unitPrice * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 🧾 RIGHT: PRICE SUMMARY CARD */}
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="sticky p-8 bg-white border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] top-28">
              <h2 className="mb-8 text-2xl font-black tracking-tight text-slate-900">Order Summary</h2>

              <div className="space-y-5 text-sm font-medium">
                {/* Subtotal */}
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal ({cartItems.length} items)</span>
                  <span className="font-bold text-slate-900">Rs {cartTotal.toFixed(2)}</span>
                </div>
                
                {/* Delivery */}
                <div className="flex justify-between text-slate-600">
                  <span>Delivery Charges</span>
                  {shippingTotal > 0 ? (
                    <span className="font-bold text-slate-900">Rs {shippingTotal.toFixed(2)}</span>
                  ) : (
                    <span className="font-bold tracking-wide uppercase text-emerald-500">Free</span>
                  )}
                </div>

                {/* IGST Section */}
                <div className="flex justify-between text-slate-600">
                  <span>Estimated IGST (18%)</span>
                  <span className="font-bold text-slate-900">Rs {estimatedIGST.toFixed(2)}</span>
                </div>

                {/* Divider */}
                <div className="pt-5 mt-5 border-t border-dashed border-slate-200">
                  <div className="flex items-end justify-between">
                    <div>
                      <span className="block text-xl font-black text-slate-900">Total Amount</span>
                      <span className="block mt-1 text-xs font-semibold tracking-wider uppercase text-slate-400">Incl. of all taxes</span>
                    </div>
                    {/* Deep Blue / Slate Total Color instead of Orange */}
                    <span className="text-2xl font-black text-blue-600">Rs {grandTotal}</span>
                  </div>
                </div>
              </div>

              {/* Checkout Button (Premium Dark Style) */}
              <button
                onClick={() => navigate("/checkout")}
                className="w-full py-4 mt-10 font-bold tracking-widest text-white uppercase transition-all duration-300 shadow-lg bg-slate-900 rounded-2xl hover:bg-blue-600 hover:shadow-blue-200 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 active:scale-[0.98]"
              >
                Proceed to Secure Checkout
              </button>

              {/* Trust Badges under button */}
              <div className="flex items-center justify-center gap-4 mt-6 text-xs font-semibold tracking-wide uppercase text-slate-400">
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                  Secure Payment
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  Genuine Quality
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Cart;