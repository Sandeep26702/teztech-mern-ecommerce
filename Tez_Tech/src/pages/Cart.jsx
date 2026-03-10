import React from "react";
import { FaMinus, FaPlus, FaShoppingCart, FaTrashAlt } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";

const getItemKey = (item) => item._id || item.localItemId || item.productId?._id || item.productId;
const getUnitPrice = (item) =>
  Number(
    item?.pricing?.unitPrice ??
      item?.pricingSnapshot?.unitPrice ??
      item?.unitPrice ??
      item?.productId?.price ??
      item?.price ??
      0
  );

const renderSelectedOptions = (item) => {
  const selected = item?.selectedCustomFields;
  if (!selected || typeof selected !== "object") return [];

  return Object.entries(selected)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        if (!value.length) return null;
        return `${key}: ${value.join(", ")}`;
      }
      if (!String(value || "").trim()) return null;
      return `${key}: ${value}`;
    })
    .filter(Boolean);
};

const Cart = () => {
  const { cartItems, removeFromCart, updateQuantity, getCartTotal } = useCart();
  const navigate = useNavigate();

  if (cartItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
        <FaShoppingCart className="mb-4 text-6xl text-gray-300" />
        <h2 className="text-2xl font-bold text-gray-800">Your cart is empty.</h2>
        <p className="mt-2 text-gray-500">Add some products to start shopping.</p>
        <Link to="/products" className="px-8 py-3 mt-6 font-bold text-white transition-all bg-orange-600 rounded-xl hover:bg-orange-700">
          Shop Now
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 pt-24 pb-12 bg-gray-50 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="mb-8 text-3xl font-black text-gray-900">Shopping Cart ({cartItems.length})</h1>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <div className="overflow-hidden bg-white border border-gray-100 shadow-sm rounded-2xl">
              {cartItems.map((item) => {
                const itemKey = getItemKey(item);
                const itemImage =
                  item.productId?.image ||
                  item.productId?.images?.[0]?.url ||
                  item.productId?.images?.[0] ||
                  item.image ||
                  "https://placehold.co/100x100/f3f4f6/a1a1aa?text=No+Image";
                const itemName = item.productId?.name || item.name;
                const unitPrice = getUnitPrice(item);
                const selectedOptions = renderSelectedOptions(item);

                return (
                  <div key={itemKey} className="flex flex-col gap-4 p-4 border-b border-gray-100 sm:flex-row sm:items-center last:border-0 hover:bg-gray-50/50">
                    <div className="flex-shrink-0 w-24 h-24 overflow-hidden border border-gray-100 bg-gray-50 rounded-xl">
                      <img src={itemImage} alt={itemName} className="object-contain w-full h-full" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 truncate">{itemName}</h3>
                      <p className="mt-1 text-sm font-medium text-gray-500">Unit Price: Rs {unitPrice}</p>
                      {selectedOptions.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {selectedOptions.map((line) => (
                            <p key={`${itemKey}-${line}`} className="text-xs text-gray-500">
                              {line}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center bg-white border border-gray-200 rounded-lg shadow-sm">
                        <button
                          onClick={() => updateQuantity(itemKey, Math.max(1, item.quantity - 1))}
                          className="p-2 transition-colors hover:text-orange-600"
                        >
                          <FaMinus className="text-xs" />
                        </button>
                        <span className="w-10 font-bold text-center text-gray-800">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(itemKey, item.quantity + 1)}
                          className="p-2 transition-colors hover:text-orange-600"
                        >
                          <FaPlus className="text-xs" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(itemKey)}
                        className="p-3 text-gray-400 transition-colors hover:text-red-500 hover:bg-red-50 rounded-xl"
                      >
                        <FaTrashAlt />
                      </button>
                    </div>

                    <div className="text-right sm:w-24">
                      <p className="text-lg font-black text-gray-900">Rs {Math.round(unitPrice * item.quantity)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="sticky p-6 bg-white border border-gray-100 shadow-xl rounded-2xl top-24">
              <h2 className="mb-6 text-xl font-bold text-gray-900">Price Details</h2>

              <div className="space-y-4">
                <div className="flex justify-between text-gray-600">
                  <span>Price ({cartItems.length} items)</span>
                  <span>Rs {getCartTotal()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Charges</span>
                  <span className="font-bold text-green-600">FREE</span>
                </div>
                <div className="pt-4 mt-4 border-t border-gray-200 border-dashed">
                  <div className="flex justify-between text-xl font-black text-gray-900">
                    <span>Total Amount</span>
                    <span className="text-orange-600">Rs {getCartTotal()}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate("/checkout")}
                className="w-full py-4 mt-8 font-bold tracking-wide text-white uppercase transition-all bg-orange-600 shadow-lg rounded-xl hover:bg-orange-700 hover:shadow-orange-200"
              >
                Proceed to Checkout
              </button>

              <p className="mt-4 text-xs text-center text-gray-400">Safe and secure payments.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
