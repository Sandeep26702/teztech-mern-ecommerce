import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext'; // Sahi Hook
import { useAuth } from '../context/AuthContext'; // Aapka Auth Hook
import { placeNewOrder } from '../services/orderService';

const CheckoutPage = () => {
  const { cartItems, getCartTotal, clearCart } = useCart(); // CartContext ka sahi data
  const { user } = useAuth(); // AuthContext ka data
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const cartTotal = getCartTotal();

  // Editable Shipping Form State
  const [shippingInfo, setShippingInfo] = useState({
    fullName: user?.name || '',
    phone: '',
    address: '',
    city: '',
    pincode: ''
  });

  const [paymentMethod, setPaymentMethod] = useState('COD');

  const handleInputChange = (e) => {
    setShippingInfo({ ...shippingInfo, [e.target.name]: e.target.value });
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    
    if (cartItems.length === 0) {
      alert("Aapka cart khali hai!");
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        items: cartItems.map(item => ({
          productId: item._id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image
        })),
        shippingInfo,
        paymentMethod,
        totalAmount: cartTotal
      };

      const res = await placeNewOrder(orderData);
      
      if (res.success) {
        alert("🎉 Order Success! ID: " + res.order._id);
        clearCart();
        navigate('/'); 
      }
    } catch (error) {
      console.error("Order Error:", error);
      alert(error.response?.data?.message || "Order fail ho gaya. Login check karein.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-4 pt-24 pb-12 bg-gray-50 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="mb-8 text-2xl font-extrabold text-gray-900 md:text-3xl">Secure Checkout</h1>
        
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* LEFT: Shipping Form */}
          <div className="w-full p-6 bg-white border border-gray-100 shadow-sm lg:w-2/3 md:p-8 rounded-2xl">
            <h2 className="flex items-center gap-2 mb-6 text-xl font-bold text-gray-800">
              <span className="flex items-center justify-center text-xs text-white bg-orange-600 rounded-full w-7 h-7">1</span>
              Delivery Address
            </h2>
            
            <form onSubmit={handlePlaceOrder} className="space-y-5">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-gray-700">Full Name</label>
                  <input type="text" name="fullName" required value={shippingInfo.fullName} onChange={handleInputChange} className="p-3 transition-all border border-gray-300 outline-none rounded-xl focus:ring-2 focus:ring-orange-500" placeholder="Enter your name" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-gray-700">Phone Number</label>
                  <input type="tel" name="phone" required value={shippingInfo.phone} onChange={handleInputChange} className="p-3 transition-all border border-gray-300 outline-none rounded-xl focus:ring-2 focus:ring-orange-500" placeholder="10-digit number" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700">Complete Address</label>
                <textarea name="address" required rows="3" value={shippingInfo.address} onChange={handleInputChange} className="p-3 transition-all border border-gray-300 outline-none rounded-xl focus:ring-2 focus:ring-orange-500" placeholder="Street, House No, Landmark..."></textarea>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-gray-700">City</label>
                  <input type="text" name="city" required value={shippingInfo.city} onChange={handleInputChange} className="p-3 transition-all border border-gray-300 outline-none rounded-xl focus:ring-2 focus:ring-orange-500" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-gray-700">Pincode</label>
                  <input type="text" name="pincode" required value={shippingInfo.pincode} onChange={handleInputChange} className="p-3 transition-all border border-gray-300 outline-none rounded-xl focus:ring-2 focus:ring-orange-500" />
                </div>
              </div>

              <h2 className="flex items-center gap-2 mt-10 mb-6 text-xl font-bold text-gray-800">
                <span className="flex items-center justify-center text-xs text-white bg-orange-600 rounded-full w-7 h-7">2</span>
                Payment Options
              </h2>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all ${paymentMethod === 'COD' ? 'border-orange-600 bg-orange-50' : 'border-gray-100 hover:border-gray-300'}`}>
                  <div className="flex items-center gap-3">
                    <input type="radio" name="payment" value="COD" checked={paymentMethod === 'COD'} onChange={(e) => setPaymentMethod(e.target.value)} className="w-4 h-4 accent-orange-600" />
                    <span className="font-bold text-gray-700">Cash on Delivery</span>
                  </div>
                </label>
                <label className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all ${paymentMethod === 'ONLINE' ? 'border-orange-600 bg-orange-50' : 'border-gray-100 hover:border-gray-300'}`}>
                  <div className="flex items-center gap-3">
                    <input type="radio" name="payment" value="ONLINE" checked={paymentMethod === 'ONLINE'} onChange={(e) => setPaymentMethod(e.target.value)} className="w-4 h-4 accent-orange-600" />
                    <span className="font-bold text-gray-700">Pay Online</span>
                  </div>
                </label>
              </div>

              <button type="submit" disabled={loading || cartItems.length === 0} className="w-full py-4 mt-8 font-black tracking-wider text-white uppercase transition-all bg-orange-600 shadow-lg hover:bg-orange-700 rounded-xl shadow-orange-100 disabled:bg-gray-400">
                {loading ? 'Processing...' : `Place Order • ₹${cartTotal}`}
              </button>
            </form>
          </div>

          {/* RIGHT: Order Summary */}
          <div className="w-full lg:w-1/3">
            <div className="sticky p-6 bg-white border border-gray-100 shadow-sm rounded-2xl top-28">
              <h2 className="pb-3 mb-5 text-lg font-bold text-gray-800 border-b">Your Order</h2>
              <div className="max-h-[350px] overflow-y-auto space-y-4 mb-5 pr-2 custom-scrollbar">
                {cartItems.map((item) => (
                  <div key={item._id} className="flex items-center gap-4 p-2 rounded-lg bg-gray-50">
                    <div className="flex-shrink-0 overflow-hidden bg-white border border-gray-100 rounded-md w-14 h-14">
                      <img src={item.image} alt={item.name} className="object-cover w-full h-full" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-gray-800 uppercase line-clamp-1">{item.name}</p>
                      <p className="text-[11px] text-gray-500 font-bold tracking-tight">QTY: {item.quantity} × ₹{item.price}</p>
                    </div>
                    <p className="text-sm font-black text-gray-900">₹{item.price * item.quantity}</p>
                  </div>
                ))}
              </div>
              
              <div className="pt-2 space-y-3">
                <div className="flex justify-between text-sm font-medium text-gray-500">
                  <span>Subtotal</span>
                  <span>₹{cartTotal}</span>
                </div>
                <div className="flex justify-between text-sm font-medium text-gray-500">
                  <span>Shipping</span>
                  <span className="text-green-600">FREE</span>
                </div>
                <div className="flex items-center justify-between pt-3 mt-2 text-xl font-black text-gray-900 border-t">
                  <span>Total Pay</span>
                  <span className="text-orange-600">₹{cartTotal}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;