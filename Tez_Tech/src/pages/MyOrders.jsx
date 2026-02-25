import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const { api } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const getMyOrders = async () => {
      try {
        const { data } = await api.get('/orders/my-orders');
        if (data.success) setOrders(data.orders);
      } catch (err) {
        console.error("Fetch Orders Error:", err);
      }
    };
    getMyOrders();
  }, [api]);

  return (
    <div className="min-h-screen pt-24 pb-20 bg-[#f8fafc]">
      <div className="max-w-4xl px-6 mx-auto">
        
        {/* Stylish Header */}
        <div className="mb-12">
          <h1 className="text-3xl font-light tracking-tight text-slate-800">
            My <span className="font-semibold text-indigo-600">Shopping Bag</span>
          </h1>
          <p className="text-sm font-medium text-slate-400">Tracking your latest styles</p>
        </div>

        {orders.length === 0 ? (
          <div className="p-20 text-center bg-white rounded-[2rem] shadow-sm border border-slate-100">
            <p className="italic font-medium text-slate-400">No orders yet...</p>
          </div>
        ) : (
          <div className="grid gap-5">
            {orders.map((order) => (
              <div 
                key={order._id} 
                onClick={() => navigate(`/order/${order._id}`)}
                className="group relative bg-white rounded-3xl p-5 border-l-4 border-l-indigo-500 shadow-sm hover:shadow-xl hover:scale-[1.01] transition-all duration-300 cursor-pointer"
              >
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                  
                  {/* Left: Product Images & Info */}
                  <div className="flex items-center gap-6">
                    <div className="flex -space-x-5">
                      {order.items.slice(0, 3).map((item, index) => (
                        <div 
                          key={index} 
                          className="p-1 overflow-hidden border-2 border-white shadow-sm w-14 h-14 rounded-2xl bg-slate-50"
                          style={{ zIndex: 3 - index }}
                        >
                          <img src={item.image} alt="" className="object-contain w-full h-full" />
                        </div>
                      ))}
                    </div>

                    <div>
                      <h3 className="text-lg font-medium tracking-tight text-slate-800">
                        {order.items.length > 1 ? `${order.items.length} Items` : order.items[0]?.name}
                      </h3>
                      <p className="text-xs font-normal text-slate-400">
                        Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </div>

                  {/* Right: Status & Price (Colorful Touch) */}
                  <div className="flex items-center justify-between pt-4 border-t md:gap-8 md:border-0 md:pt-0">
                    
                    {/* Status with Soft Colors */}
                    <span className={`px-4 py-1.5 rounded-xl text-[11px] font-semibold tracking-wide shadow-sm ${
                      order.orderStatus === 'Delivered' 
                      ? 'bg-emerald-50 text-emerald-600' 
                      : 'bg-amber-50 text-amber-600'
                    }`}>
                      {order.orderStatus}
                    </span>

                    {/* Clean Price Logic */}
                    <div className="text-right">
                      <span className="mr-1 text-xs italic font-medium text-slate-400">Total</span>
                      <span className="text-xl font-bold leading-none text-slate-900">
                        ₹{order.totalAmount}
                      </span>
                    </div>

                    <div className="hidden md:block">
                       <div className="flex items-center justify-center w-8 h-8 transition-colors rounded-full bg-slate-50 group-hover:bg-indigo-50">
                          <span className="text-lg text-slate-300 group-hover:text-indigo-500">›</span>
                       </div>
                    </div>

                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrders;