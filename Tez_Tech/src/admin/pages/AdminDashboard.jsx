import { useEffect, useState } from "react";
import axios from "axios";
import { FaBox, FaCheckCircle, FaTimesCircle, FaClipboardList } from "react-icons/fa";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    outOfStockProducts: 0,
    totalOrders: 0,
    recentOrders: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const config = { headers: { Authorization: `Bearer ${token}` } };

        const res = await axios.get("http://localhost:5000/api/admin/dashboard", config);
        if (res.data.success) {
          setStats({
            totalProducts: res.data.totalProducts || 0,
            activeProducts: res.data.activeProducts || 0,
            outOfStockProducts: res.data.outOfStockProducts || 0,
            totalOrders: res.data.totalOrders || 0,
            recentOrders: res.data.recentOrders || [],
          });
        }
        setError("");
      } catch (err) {
        console.error("Dashboard Stats Error:", err);
        setError("Unable to connect to the server. Please check your backend.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="mx-auto space-y-6 max-w-7xl">
        <div className="w-64 h-8 mb-8 bg-gray-200 rounded-lg animate-pulse"></div>
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
      </div>
    );
  }

  return (
    <div className="mx-auto space-y-8 font-sans max-w-7xl pb-10">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Dashboard Overview</h2>
          <p className="mt-1 text-sm text-gray-500">Quick snapshot of catalog and orders.</p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 border-l-4 border-red-500 rounded-r-lg shadow-sm bg-red-50">
          <FaTimesCircle className="text-red-500 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-800">Connection Error</h3>
            <p className="mt-1 text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-4">Catalog Stats</h3>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative p-6 overflow-hidden transition-shadow bg-white border border-gray-100 shadow-sm rounded-2xl hover:shadow-md">
            <div className="flex items-center gap-5">
              <div className="flex items-center justify-center text-2xl text-white shadow-lg w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-blue-500/30">
                <FaBox />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Products</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{stats.totalProducts}</h3>
              </div>
            </div>
          </div>

          <div className="relative p-6 overflow-hidden transition-shadow bg-white border border-gray-100 shadow-sm rounded-2xl hover:shadow-md">
            <div className="flex items-center gap-5">
              <div className="flex items-center justify-center text-2xl text-white shadow-lg w-14 h-14 bg-gradient-to-br from-emerald-400 to-green-600 rounded-xl shadow-green-500/30">
                <FaCheckCircle />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Active Products</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{stats.activeProducts}</h3>
              </div>
            </div>
          </div>

          <div className="relative p-6 overflow-hidden transition-shadow bg-white border border-gray-100 shadow-sm rounded-2xl hover:shadow-md">
            <div className="flex items-center gap-5">
              <div className="flex items-center justify-center text-2xl text-white shadow-lg w-14 h-14 bg-gradient-to-br from-rose-400 to-red-600 rounded-xl shadow-red-500/30">
                <FaTimesCircle />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Out Of Stock</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{stats.outOfStockProducts}</h3>
              </div>
            </div>
          </div>

          <div className="relative p-6 overflow-hidden transition-shadow bg-white border border-gray-100 shadow-sm rounded-2xl hover:shadow-md">
            <div className="flex items-center gap-5">
              <div className="flex items-center justify-center text-2xl text-white shadow-lg w-14 h-14 bg-gradient-to-br from-orange-400 to-amber-600 rounded-xl shadow-orange-500/30">
                <FaClipboardList />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Orders</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{stats.totalOrders}</h3>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Recent Orders</h3>
          <p className="text-sm text-gray-500">Latest 5 orders with shipping details.</p>
        </div>
        <div className="divide-y divide-gray-100">
          {stats.recentOrders.length === 0 ? (
            <div className="px-6 py-6 text-sm text-gray-500">No recent orders.</div>
          ) : (
            stats.recentOrders.map((order) => (
              <div key={order._id} className="px-6 py-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {order.orderCode || `#${order.orderNumber || order._id.slice(-6)}`}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(order.createdAt).toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="text-sm text-gray-700">
                  {order.shippingInfo?.fullName} | {order.shippingInfo?.phone}
                </div>
                <div className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-3 py-1">
                  {order.orderStatus || "Confirmed"}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
