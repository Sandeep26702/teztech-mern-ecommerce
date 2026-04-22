import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { 
  FaRupeeSign, FaExclamationTriangle, FaBoxOpen, 
  FaTruck, FaCheckDouble, FaExclamationCircle,
  FaUserAlt, FaClipboardList, FaEye
} from "react-icons/fa";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revenueTab, setRevenueTab] = useState("today");
  
  // 🚀 ROUTING: Dashboard se action lene ke liye
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    revenue: { today: 0, week: 0, month: 0 },
    pendingUPI: 0,
    orderStatus: { processing: 0, shipping: 0, delivered: 0 },
    lowStockItems: [],
    recentOrders: [], // 👈 Recent orders state
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const config = { headers: { Authorization: `Bearer ${token}` } };

        const res = await axios.get("https://sonani-backend.onrender.com/api/admin/dashboard-stats", config);
        
        if (res.data.success) {
          setStats(res.data.stats);
          setError("");
        }
      } catch (err) {
        console.error("Dashboard Stats Error:", err);
        setError("Unable to fetch real data from backend. Please check your API.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8 mx-auto font-sans sm:px-6 lg:px-8 max-w-7xl sm:py-10 bg-slate-50">
      
      <div className="mb-8">
        <h2 className="text-2xl font-black tracking-tight sm:text-3xl text-slate-900">Store Overview</h2>
        <p className="mt-1 text-sm text-slate-500">Monitor your real-time sales, orders, and take actions.</p>
      </div>

      {error && (
        <div className="p-4 mb-6 border-l-4 border-red-500 rounded-lg bg-red-50">
          <p className="text-sm font-bold text-red-700">{error}</p>
        </div>
      )}

      {/* TOP ROW: REVENUE & PENDING ACTIONS */}
      <div className="grid grid-cols-1 gap-6 mb-6 lg:grid-cols-3">
        
        {/* REVENUE CARD */}
        <div className="flex flex-col p-6 bg-white border shadow-sm lg:col-span-2 border-slate-200 rounded-2xl">
          <div className="flex flex-col justify-between gap-4 mb-6 sm:flex-row sm:items-center">
            <h3 className="text-lg font-bold text-slate-900">Sales & Revenue</h3>
            <div className="flex p-1 space-x-1 bg-slate-100 rounded-xl w-max">
              {['today', 'week', 'month'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setRevenueTab(tab)}
                  className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                    revenueTab === tab 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-4 mt-auto">
            <div className="flex items-center justify-center w-16 h-16 text-2xl text-blue-600 bg-blue-100 rounded-full">
              <FaRupeeSign />
            </div>
            <div>
              <p className="mb-1 text-sm font-bold tracking-widest uppercase text-slate-400">
                {revenueTab === 'today' ? "Today's Sales" : revenueTab === 'week' ? "This Week's Sales" : "This Month's Sales"}
              </p>
              <h4 className="text-4xl font-black text-slate-900">
                {formatCurrency(stats.revenue[revenueTab])}
              </h4>
            </div>
          </div>
        </div>

        {/* PENDING ACTIONS (UPI ALERT) - 🔥 ACTIONABLE */}
        <div className="relative flex flex-col p-6 overflow-hidden bg-white border shadow-sm border-amber-200 rounded-2xl group">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <FaExclamationTriangle className="text-8xl text-amber-500" />
          </div>
          <h3 className="relative z-10 mb-2 text-lg font-bold text-amber-900">Action Required</h3>
          <p className="relative z-10 mb-6 text-sm font-medium text-amber-700">Manual UPI verifications pending.</p>
          
          <div className="relative z-10 flex flex-col gap-4 mt-auto">
            <h4 className="text-5xl font-black text-amber-600">{stats.pendingUPI}</h4>
            <button 
              onClick={() => navigate('/admin/orders')} // 👈 ACTION
              className="w-full px-4 py-3 text-sm font-bold text-white transition-colors shadow-sm bg-amber-500 rounded-xl hover:bg-amber-600 active:scale-95"
            >
              Review Payments
            </button>
          </div>
        </div>
      </div>

      {/* MIDDLE ROW: ORDER STATUSES - 🔥 ACTIONABLE */}
      <h3 className="mb-4 text-lg font-bold text-slate-900">Order Pipeline</h3>
      <div className="grid grid-cols-1 gap-4 mb-8 sm:grid-cols-3">
        
        <div onClick={() => navigate('/admin/orders')} className="flex items-center gap-4 p-5 transition-all bg-white border shadow-sm cursor-pointer border-slate-200 rounded-2xl hover:shadow-md hover:border-blue-200 group">
          <div className="flex items-center justify-center w-12 h-12 text-blue-600 transition-transform bg-blue-50 rounded-xl group-hover:scale-110">
            <FaBoxOpen className="text-xl" />
          </div>
          <div>
            <p className="text-xs font-bold tracking-wider uppercase text-slate-500 group-hover:text-blue-600">Processing</p>
            <h4 className="text-2xl font-black text-slate-900">{stats.orderStatus.processing}</h4>
          </div>
        </div>

        <div onClick={() => navigate('/admin/orders')} className="flex items-center gap-4 p-5 transition-all bg-white border shadow-sm cursor-pointer border-slate-200 rounded-2xl hover:shadow-md hover:border-indigo-200 group">
          <div className="flex items-center justify-center w-12 h-12 text-indigo-600 transition-transform bg-indigo-50 rounded-xl group-hover:scale-110">
            <FaTruck className="text-xl" />
          </div>
          <div>
            <p className="text-xs font-bold tracking-wider uppercase text-slate-500 group-hover:text-indigo-600">Shipping</p>
            <h4 className="text-2xl font-black text-slate-900">{stats.orderStatus.shipping}</h4>
          </div>
        </div>

        <div onClick={() => navigate('/admin/orders')} className="flex items-center gap-4 p-5 transition-all bg-white border shadow-sm cursor-pointer border-slate-200 rounded-2xl hover:shadow-md hover:border-emerald-200 group">
          <div className="flex items-center justify-center w-12 h-12 transition-transform text-emerald-600 bg-emerald-50 rounded-xl group-hover:scale-110">
            <FaCheckDouble className="text-xl" />
          </div>
          <div>
            <p className="text-xs font-bold tracking-wider uppercase text-slate-500 group-hover:text-emerald-600">Delivered</p>
            <h4 className="text-2xl font-black text-slate-900">{stats.orderStatus.delivered}</h4>
          </div>
        </div>

      </div>

      {/* BOTTOM ROW: RECENT ORDERS (RESTORED) & LOW STOCK */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* RECENT ORDERS - 🔥 ACTIONABLE */}
        <div className="flex flex-col overflow-hidden bg-white border shadow-sm lg:col-span-2 border-slate-200 rounded-2xl">
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Recent Orders</h3>
              <p className="mt-1 text-xs text-slate-500">Latest 5 orders requiring attention.</p>
            </div>
            <button 
              onClick={() => navigate('/admin/orders')} 
              className="px-4 py-2 text-xs font-bold text-blue-600 transition-colors rounded-lg bg-blue-50 hover:bg-blue-100"
            >
              View All
            </button>
          </div>
          
          <div className="flex-1 divide-y divide-slate-100">
            {(!stats.recentOrders || stats.recentOrders.length === 0) ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <FaClipboardList className="mb-3 text-4xl text-slate-300" />
                <p className="font-medium text-slate-500">No recent orders found.</p>
              </div>
            ) : (
              stats.recentOrders.map((order) => (
                <div key={order._id} className="flex flex-col justify-between gap-4 p-4 transition-colors sm:flex-row sm:items-center sm:px-6 hover:bg-slate-50/50 group">
                  
                  <div className="flex-1">
                    <p className="text-sm font-black text-slate-900">
                      {order.orderCode || `#${order.orderNumber || order._id.slice(-6)}`}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {new Date(order.createdAt).toLocaleString("en-IN", {
                        day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
                      })}
                    </p>
                  </div>

                  <div className="flex items-center flex-1 gap-2 text-sm font-bold text-slate-700">
                    <FaUserAlt className="text-xs text-slate-400" />
                    <span className="truncate">{order.shippingInfo?.fullName || "Guest User"}</span>
                  </div>

                  <div className="flex items-center justify-between w-full gap-4 sm:justify-end sm:w-auto">
                    <span className="text-base font-black text-slate-900">
                      {formatCurrency(order.totalAmount)}
                    </span>
                    <button 
                      onClick={() => navigate(`/admin/orders/${order._id}`)} // 👈 ACTION
                      className="flex items-center gap-2 text-xs font-bold text-blue-600 bg-white border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                    >
                      <FaEye /> View
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* LOW STOCK ALERTS */}
        <div className="flex flex-col overflow-hidden bg-white border shadow-sm border-slate-200 rounded-2xl">
          <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100 bg-red-50/30">
            <FaExclamationCircle className="text-xl text-red-500" />
            <h3 className="text-lg font-bold text-red-900">Low Stock Alerts</h3>
          </div>
          
          <div className="flex-1 divide-y divide-slate-100">
            {(!stats.lowStockItems || stats.lowStockItems.length === 0) ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <p className="font-medium text-slate-500">All products have sufficient stock.</p>
              </div>
            ) : (
              stats.lowStockItems.map((item) => (
                <div key={item._id} className="flex items-center justify-between p-4 px-6 hover:bg-slate-50">
                  <p className="pr-4 text-sm font-semibold text-slate-800 line-clamp-2">{item.name}</p>
                  <div className="flex items-center flex-shrink-0 gap-2">
                    <span className={`px-2.5 py-1 text-xs font-black rounded-md ${
                      item.stock === 0 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                    }`}>
                      {item.stock} Left
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;