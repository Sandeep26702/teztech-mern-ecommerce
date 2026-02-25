import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const OrderDetail = () => {
  const { id } = useParams(); // URL se ID nikalne ke liye
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderDetail = async () => {
      try {
        const token = localStorage.getItem('token');
        // Console log check karein ki ID aa rahi hai ya nahi
        console.log("Fetching Order ID:", id);

        const { data } = await axios.get(`http://localhost:5000/api/orders/detail/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (data.success) {
          setOrder(data.order);
        }
      } catch (error) {
        console.error("Detail Fetch Error:", error.response?.data || error.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchOrderDetail();
  }, [id]);

  if (loading) return <div className="pt-32 font-bold text-center">Loading Order...</div>;

  if (!order) return (
    <div className="pt-32 text-center">
      <h2 className="font-bold text-red-500">Order Details Not Found!</h2>
      <button onClick={() => navigate('/my-orders')} className="px-4 py-2 mt-4 text-white bg-gray-900 rounded">
        Go Back
      </button>
    </div>
  );

  return (
    <div className="min-h-screen px-4 pb-12 bg-gray-50 pt-28">
      <div className="max-w-4xl p-6 mx-auto bg-white shadow-sm rounded-2xl">
        <h1 className="mb-4 text-xl font-black uppercase">Order #{order._id.slice(-8)}</h1>
        
        {/* PRODUCT LIST WITH IMAGES */}
        <div className="mb-8 space-y-4">
          {order.items.map((item, index) => (
            <div key={index} className="flex items-center gap-4 pb-4 border-b">
              <img src={item.image} alt={item.name} className="object-contain w-20 h-20 border rounded-lg" />
              <div className="flex-1">
                <p className="text-sm font-bold uppercase">{item.name}</p>
                <p className="text-xs font-bold text-gray-500">Qty: {item.quantity} × ₹{item.price}</p>
              </div>
              <p className="font-black">₹{item.price * item.quantity}</p>
            </div>
          ))}
        </div>

        {/* SHIPPING INFO */}
        <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2 bg-gray-50 rounded-xl">
          <div>
            <h3 className="text-[10px] font-black text-gray-400 uppercase mb-2">Delivery Address</h3>
            <p className="text-sm font-bold">{order.shippingInfo.fullName}</p>
            <p className="text-xs text-gray-600">{order.shippingInfo.address}, {order.shippingInfo.city}</p>
            <p className="mt-2 text-xs font-bold">📞 {order.shippingInfo.phone}</p>
          </div>
          <div className="text-right border-gray-200 md:border-l md:pl-6">
             <h3 className="text-[10px] font-black text-gray-400 uppercase mb-2">Total Amount</h3>
             <p className="text-2xl font-black text-orange-600">₹{order.totalAmount}</p>
             <p className="mt-1 text-xs font-bold uppercase">Status: {order.orderStatus}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;