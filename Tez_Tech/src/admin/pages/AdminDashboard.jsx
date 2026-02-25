import { useEffect, useState } from "react";
import axios from "axios";
import { 
  FaBox, FaUsers, FaClipboardList, FaRupeeSign, 
  FaServer, FaExclamationTriangle, 
  FaFileInvoiceDollar, FaClock, FaCheckCircle, FaTimesCircle 
} from "react-icons/fa";

const AdminDashboard = () => {
  const [stats, setStats] = useState({ products: 0, users: 0, orders: 0, revenue: 0 });
  const [quoteStats, setQuoteStats] = useState({ total: 0, pending: 0, accepted: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const config = { headers: { Authorization: `Bearer ${token}` } };

        // 🚀 Dono APIs ek sath call kar rahe hain (Dashboard + Quotes)
        const [dashRes, quoteRes] = await Promise.all([
          axios.get("http://localhost:5000/api/admin/dashboard", config),
          axios.get("http://localhost:5000/api/quotes", config).catch(() => ({ data: { quotes: [] } })) // Error aane par empty array le lega
        ]);
        
        // 1. Store Stats Set Karna
        if (dashRes.data.success) {
          setStats({
            products: dashRes.data.totalProducts || 0,
            users: dashRes.data.totalUsers || 0,
            orders: dashRes.data.totalOrders || 0,
            revenue: dashRes.data.totalRevenue || 0
          });
        }

        // 2. Quote Stats Calculate Karna
        const quotes = quoteRes.data.quotes || [];
        let pending = 0, accepted = 0, rejected = 0;

        quotes.forEach((q) => {
          if (q.status === "Pending") pending++;
          else if (q.status === "Accepted") accepted++;
          else if (q.status === "Rejected") rejected++;
        });

        setQuoteStats({
          total: quotes.length,
          pending,
          accepted,
          rejected
        });

        setError(null);
      } catch (err) {
        console.error("Dashboard Stats Error:", err);
        setError("Unable to connect to the server. Please check your backend.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // 🌀 Premium Loading Skeletons
  if (loading) {
    return (
      <div className="mx-auto space-y-6 max-w-7xl">
        <div className="w-64 h-8 mb-8 bg-gray-200 rounded-lg animate-pulse"></div>
        
        {/* Row 1 Skeletons */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-4 p-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
              <div className="bg-gray-200 w-14 h-14 rounded-xl animate-pulse"></div>
              <div className="flex-1 space-y-2">
                <div className="w-1/2 h-6 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-3/4 h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Row 2 Skeletons (For Quotes) */}
        <div className="w-48 h-6 mt-8 mb-4 bg-gray-200 rounded-lg animate-pulse"></div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[5, 6, 7, 8].map((i) => (
            <div key={i} className="flex items-center gap-4 p-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
              <div className="bg-gray-200 w-14 h-14 rounded-xl animate-pulse"></div>
              <div className="flex-1 space-y-2">
                <div className="w-1/2 h-6 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-3/4 h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto space-y-8 font-sans max-w-7xl pb-10">
      
      {/* 🌟 Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Dashboard Overview</h2>
          <p className="mt-1 text-sm text-gray-500">Monitor your store's performance and analytics.</p>
        </div>
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-xs font-semibold border border-blue-100">
          <span className="relative flex w-2 h-2">
            <span className="absolute inline-flex w-full h-full bg-blue-400 rounded-full opacity-75 animate-ping"></span>
            <span className="relative inline-flex w-2 h-2 bg-blue-500 rounded-full"></span>
          </span>
          Live Synced
        </div>
      </div>
      
      {/* 🚨 Error Banner */}
      {error && (
        <div className="flex items-start gap-3 p-4 border-l-4 border-red-500 rounded-r-lg shadow-sm bg-red-50">
          <FaExclamationTriangle className="text-red-500 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-800">Connection Error</h3>
            <p className="mt-1 text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 🛒 STORE STATS GRID */}
      {/* ========================================================= */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-4">E-Commerce Stats</h3>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          
          {/* Total Products */}
          <div className="relative p-6 overflow-hidden transition-shadow bg-white border border-gray-100 shadow-sm rounded-2xl hover:shadow-md group">
            <div className="absolute w-24 h-24 transition-transform duration-500 ease-in-out rounded-full opacity-50 -right-4 -top-4 bg-blue-50 group-hover:scale-150"></div>
            <div className="relative flex items-center gap-5">
              <div className="flex items-center justify-center text-2xl text-white shadow-lg w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-blue-500/30">
                <FaBox />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Products</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{stats.products}</h3>
              </div>
            </div>
          </div>

          {/* Total Users */}
          <div className="relative p-6 overflow-hidden transition-shadow bg-white border border-gray-100 shadow-sm rounded-2xl hover:shadow-md group">
            <div className="absolute w-24 h-24 transition-transform duration-500 ease-in-out rounded-full opacity-50 -right-4 -top-4 bg-green-50 group-hover:scale-150"></div>
            <div className="relative flex items-center gap-5">
              <div className="flex items-center justify-center text-2xl text-white shadow-lg w-14 h-14 bg-gradient-to-br from-emerald-400 to-green-600 rounded-xl shadow-green-500/30">
                <FaUsers />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Users</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{stats.users}</h3>
              </div>
            </div>
          </div>

          {/* Total Orders */}
          <div className="relative p-6 overflow-hidden transition-shadow bg-white border border-gray-100 shadow-sm rounded-2xl hover:shadow-md group">
            <div className="absolute w-24 h-24 transition-transform duration-500 ease-in-out rounded-full opacity-50 -right-4 -top-4 bg-orange-50 group-hover:scale-150"></div>
            <div className="relative flex items-center gap-5">
              <div className="flex items-center justify-center text-2xl text-white shadow-lg w-14 h-14 bg-gradient-to-br from-orange-400 to-amber-600 rounded-xl shadow-orange-500/30">
                <FaClipboardList />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Orders</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{stats.orders}</h3>
              </div>
            </div>
          </div>

          {/* Total Revenue */}
          <div className="relative p-6 overflow-hidden transition-shadow bg-white border border-gray-100 shadow-sm rounded-2xl hover:shadow-md group">
            <div className="absolute w-24 h-24 transition-transform duration-500 ease-in-out rounded-full opacity-50 -right-4 -top-4 bg-purple-50 group-hover:scale-150"></div>
            <div className="relative flex items-center gap-5">
              <div className="flex items-center justify-center text-2xl text-white shadow-lg w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-purple-500/30">
                <FaRupeeSign />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-0.5">
                  ₹{stats.revenue.toLocaleString('en-IN')}
                </h3>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ========================================================= */}
      {/* 📄 QUOTATION STATS GRID (NEWLY ADDED) */}
      {/* ========================================================= */}
      <div className="mt-8">
        <h3 className="text-lg font-bold text-gray-800 mb-4 border-t pt-8">Quotation Analytics</h3>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          
          {/* Total Quotes */}
          <div className="relative p-6 overflow-hidden transition-shadow bg-white border border-gray-100 shadow-sm rounded-2xl hover:shadow-md group">
            <div className="absolute w-24 h-24 transition-transform duration-500 ease-in-out rounded-full opacity-50 -right-4 -top-4 bg-cyan-50 group-hover:scale-150"></div>
            <div className="relative flex items-center gap-5">
              <div className="flex items-center justify-center text-2xl text-white shadow-lg w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl shadow-cyan-500/30">
                <FaFileInvoiceDollar />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Requests</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{quoteStats.total}</h3>
              </div>
            </div>
          </div>

          {/* Pending Quotes (Attention) */}
          <div className="relative p-6 overflow-hidden transition-shadow bg-white border border-gray-100 shadow-sm rounded-2xl hover:shadow-md group border-l-4 border-l-yellow-400">
            <div className="absolute w-24 h-24 transition-transform duration-500 ease-in-out rounded-full opacity-50 -right-4 -top-4 bg-yellow-50 group-hover:scale-150"></div>
            <div className="relative flex items-center gap-5">
              <div className="flex items-center justify-center text-2xl text-white shadow-lg w-14 h-14 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-xl shadow-yellow-500/30">
                <FaClock />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Pending Action</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{quoteStats.pending}</h3>
              </div>
            </div>
          </div>

          {/* Accepted Quotes */}
          <div className="relative p-6 overflow-hidden transition-shadow bg-white border border-gray-100 shadow-sm rounded-2xl hover:shadow-md group">
            <div className="absolute w-24 h-24 transition-transform duration-500 ease-in-out rounded-full opacity-50 -right-4 -top-4 bg-teal-50 group-hover:scale-150"></div>
            <div className="relative flex items-center gap-5">
              <div className="flex items-center justify-center text-2xl text-white shadow-lg w-14 h-14 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-xl shadow-teal-500/30">
                <FaCheckCircle />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Deals Won</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{quoteStats.accepted}</h3>
              </div>
            </div>
          </div>

          {/* Rejected Quotes */}
          <div className="relative p-6 overflow-hidden transition-shadow bg-white border border-gray-100 shadow-sm rounded-2xl hover:shadow-md group">
            <div className="absolute w-24 h-24 transition-transform duration-500 ease-in-out rounded-full opacity-50 -right-4 -top-4 bg-rose-50 group-hover:scale-150"></div>
            <div className="relative flex items-center gap-5">
              <div className="flex items-center justify-center text-2xl text-white shadow-lg w-14 h-14 bg-gradient-to-br from-rose-400 to-red-500 rounded-xl shadow-rose-500/30">
                <FaTimesCircle />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Deals Lost</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{quoteStats.rejected}</h3>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 🟢 System Status */}
      <div className="flex items-center justify-between p-6 bg-white border border-gray-100 shadow-sm rounded-2xl mt-8">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 text-slate-600">
            <FaServer />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">System Status</h3>
            <p className="text-xs text-gray-500 mt-0.5">All services are running normally</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg border border-green-100">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex w-full h-full bg-green-400 rounded-full opacity-75 animate-ping"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
          </span>
          <span className="text-xs font-semibold text-green-700">Backend Connected</span>
        </div>
      </div>

    </div>
  );
};

export default AdminDashboard;