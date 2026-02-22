import { useCart } from "../context/CartContext";
import { useNavigate, Link } from "react-router-dom";
import { FaTrashAlt, FaMinus, FaPlus, FaShoppingCart, FaArrowRight, FaArrowLeft } from "react-icons/fa";

const Cart = () => {
  const { cartItems, removeFromCart, updateQuantity, getCartTotal } = useCart();
  const navigate = useNavigate();

  // 🛒 Empty Cart State
  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 font-sans">
        <div className="flex items-center justify-center w-24 h-24 mb-6 text-4xl text-orange-600 rounded-full shadow-sm bg-orange-50">
          <FaShoppingCart />
        </div>
        <h2 className="mb-2 text-2xl font-bold text-gray-900">Your cart is empty</h2>
        <p className="max-w-md mb-8 text-center text-gray-500">
          Looks like you haven't added anything to your cart yet. Let's get you some great products!
        </p>
        <Link 
          to="/products" 
          className="flex items-center gap-2 px-6 py-3 font-semibold text-white transition-colors bg-orange-600 shadow-sm rounded-xl hover:bg-orange-700"
        >
          <FaArrowLeft className="text-sm" /> Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 py-10 mx-auto font-sans max-w-7xl sm:px-6 lg:px-8">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Shopping Cart</h1>
        <p className="mt-2 text-gray-500">You have {cartItems.length} item(s) in your cart</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
        
        {/* 📦 Left Side: Cart Items */}
        <div className="space-y-6 lg:col-span-8">
          {cartItems.map((item) => (
            <div 
              key={item._id} 
              className="flex flex-col items-center gap-6 p-4 transition-shadow bg-white border border-gray-100 shadow-sm sm:flex-row sm:p-6 rounded-2xl hover:shadow-md"
            >
              {/* Product Image */}
              <div className="flex-shrink-0 w-full h-32 overflow-hidden border border-gray-100 sm:w-32 bg-gray-50 rounded-xl">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="object-cover w-full h-full" />
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-gray-400">
                    <FaShoppingCart className="text-3xl opacity-20" />
                  </div>
                )}
              </div>

              {/* Product Info & Controls */}
              <div className="flex flex-col justify-between flex-1 w-full">
                
                {/* Title & Price */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 line-clamp-2">{item.name}</h3>
                    <p className="mt-1 text-xl font-extrabold text-gray-900">₹{item.price?.toLocaleString('en-IN')}</p>
                  </div>
                  
                  {/* Remove Button (Desktop) */}
                  <button
                    onClick={() => removeFromCart(item._id)}
                    className="hidden p-2 text-gray-400 transition-colors rounded-lg sm:flex hover:text-red-500 hover:bg-red-50"
                    title="Remove item"
                  >
                    <FaTrashAlt />
                  </button>
                </div>

                {/* Quantity & Mobile Remove */}
                <div className="flex items-center justify-between mt-4">
                  
                  {/* Quantity Controller */}
                  <div className="flex items-center p-1 border border-gray-200 rounded-lg bg-gray-50">
                    <button 
                      onClick={() => updateQuantity(item._id, Math.max(1, item.quantity - 1))}
                      className="flex items-center justify-center w-8 h-8 text-gray-600 transition-colors rounded hover:text-orange-600 hover:bg-white"
                      disabled={item.quantity <= 1}
                    >
                      <FaMinus className="text-xs" />
                    </button>
                    
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (!isNaN(val) && val > 0) updateQuantity(item._id, val);
                      }}
                      className="w-12 text-sm font-bold text-center bg-transparent appearance-none focus:outline-none"
                    />
                    
                    <button 
                      onClick={() => updateQuantity(item._id, item.quantity + 1)}
                      className="flex items-center justify-center w-8 h-8 text-gray-600 transition-colors rounded hover:text-orange-600 hover:bg-white"
                    >
                      <FaPlus className="text-xs" />
                    </button>
                  </div>

                  {/* Remove Button (Mobile) */}
                  <button
                    onClick={() => removeFromCart(item._id)}
                    className="flex items-center gap-1 text-sm font-medium text-red-500 sm:hidden"
                  >
                    <FaTrashAlt /> Remove
                  </button>
                </div>

              </div>
            </div>
          ))}
        </div>

        {/* 💳 Right Side: Order Summary */}
        <div className="lg:col-span-4">
          <div className="sticky p-6 border border-gray-100 bg-gray-50 rounded-2xl sm:p-8 top-24">
            <h2 className="mb-6 text-xl font-bold text-gray-900">Order Summary</h2>
            
            <div className="space-y-4 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-gray-900">₹{getCartTotal()?.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping Estimate</span>
                <span className="font-semibold text-green-600">Free</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span className="font-semibold text-gray-900">Calculated at checkout</span>
              </div>
              
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-200">
                <span className="text-base font-bold text-gray-900">Total</span>
                <span className="text-2xl font-extrabold text-orange-600">
                  ₹{getCartTotal()?.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <button
              onClick={() => navigate("/checkout")}
              className="w-full mt-8 flex items-center justify-center gap-2 bg-orange-600 text-white font-bold text-lg py-4 rounded-xl shadow-lg shadow-orange-200 hover:bg-orange-700 hover:shadow-xl transition-all active:scale-[0.98]"
            >
              Proceed to Checkout <FaArrowRight className="text-sm" />
            </button>
            
            <div className="mt-4 text-center">
              <Link to="/products" className="text-sm font-medium text-orange-600 hover:text-orange-700">
                or Continue Shopping
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Cart;