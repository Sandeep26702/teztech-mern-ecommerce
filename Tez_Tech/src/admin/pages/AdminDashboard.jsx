import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FaRupeeSign, FaExclamationTriangle, FaBoxOpen, 
  FaTruck, FaCheckDouble, FaExclamationCircle,
  FaUserAlt, FaClipboardList, FaEye, FaWarehouse,
  FaTags, FaTools, FaGift, FaShippingFast, FaCommentDots,
  FaFileInvoice, FaUsers, FaChartBar
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import api from "../../utils/api";
import SalesDashboard from "./SalesDashboard";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));

const AdminDashboard = () => {
  const { user } = useAuth();
  const userRole = user?.role?.toLowerCase() || "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revenueTab, setRevenueTab] = useState("today");
  
  // 🚀 ROUTING: Dashboard actions
  const navigate = useNavigate();

  // General Store Stats
  const [stats, setStats] = useState({
    revenue: { today: 0, week: 0, month: 0 },
    pendingUPI: 0,
    orderStatus: { processing: 0, shipping: 0, delivered: 0 },
    lowStockItems: [],
    recentOrders: [],
  });

  // Designer Custom Quote Stats
  const [designerStats, setDesignerStats] = useState({
    pendingQuotes: 0,
    respondedQuotes: 0,
    acceptedQuotes: 0,
    assignedToMe: 0,
    recentDesigns: [],
  });

  // Operational Orders List (for Manufacturing, Packing, Dispatch, Feedback)
  const [ordersList, setOrdersList] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError("");

        // 1. Fetch general dashboard stats (opened to all staff roles now)
        const statsRes = await api.get("/admin/dashboard-stats");
        if (statsRes.data.success) {
          setStats(statsRes.data.stats);
        }

        // 2. Fetch designer quotes if the role is designer
        if (userRole === "designer") {
          const res = await api.get("/custom-quote/all");
          if (res.data.success) {
            const quotes = res.data.quotes || [];
            const pending = quotes.filter(q => q.status === "Pending").length;
            const responded = quotes.filter(q => q.status === "Responded" || q.status === "Offered" || q.status === "Updated").length;
            const accepted = quotes.filter(q => q.status === "Accepted").length;
            const assigned = quotes.filter(q => {
              const assigneeId = q.assignedTo?._id || q.assignedTo || "";
              return String(assigneeId) === String(user?._id || "");
            }).length;

            setDesignerStats({
              pendingQuotes: pending,
              respondedQuotes: responded,
              acceptedQuotes: accepted,
              assignedToMe: assigned,
              recentDesigns: quotes.slice(0, 5),
            });
          }
        }

        // 3. Fetch all orders for operational roles
        if (["manufacturing", "packing", "dispatch", "feedback tracking"].includes(userRole)) {
          const ordersRes = await api.get("/order/admin/all");
          if (ordersRes.data.success) {
            setOrdersList(ordersRes.data.orders || []);
          }
        }

      } catch (err) {
        console.error("Dashboard Stats Error:", err);
        setError("Unable to fetch real-time dashboard stats. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (userRole) {
      fetchDashboardData();
    }
  }, [userRole, user?._id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
      </div>
    );
  }

  // =====================================================================
  // 🌟 SALES TEAM WORKSPACE
  // =====================================================================
  if (userRole === "sales team") {
    return <SalesDashboard />;
  }

  // =====================================================================
  // 1. 🎨 DESIGNER WORKSPACE
  // =====================================================================
  if (userRole === "designer") {
    return (
      <div className="min-h-screen px-4 py-8 font-sans sm:px-8 lg:px-12 w-full sm:py-10 bg-slate-50">
        <div className="mb-8">
          <h2 className="text-2xl font-black tracking-tight sm:text-3xl text-slate-900">Designer Workspace</h2>
          <p className="mt-1 text-sm text-slate-500">Manage custom design quotations and respond with offers.</p>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 gap-4 mb-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center gap-4 p-5 bg-white border border-slate-200 shadow-sm rounded-2xl">
            <div className="flex items-center justify-center w-12 h-12 text-yellow-600 bg-yellow-50 rounded-xl">
              <FaClipboardList className="text-xl" />
            </div>
            <div>
              <p className="text-xs font-bold tracking-wider uppercase text-slate-500">Pending Designs</p>
              <h4 className="text-2xl font-black text-slate-900">{designerStats.pendingQuotes}</h4>
            </div>
          </div>

          <div className="flex items-center gap-4 p-5 bg-white border border-slate-200 shadow-sm rounded-2xl">
            <div className="flex items-center justify-center w-12 h-12 text-blue-600 bg-blue-50 rounded-xl">
              <FaEye className="text-xl" />
            </div>
            <div>
              <p className="text-xs font-bold tracking-wider uppercase text-slate-500">Responded</p>
              <h4 className="text-2xl font-black text-slate-900">{designerStats.respondedQuotes}</h4>
            </div>
          </div>

          <div className="flex items-center gap-4 p-5 bg-white border border-slate-200 shadow-sm rounded-2xl">
            <div className="flex items-center justify-center w-12 h-12 text-emerald-600 bg-emerald-50 rounded-xl">
              <FaCheckDouble className="text-xl" />
            </div>
            <div>
              <p className="text-xs font-bold tracking-wider uppercase text-slate-500">Accepted</p>
              <h4 className="text-2xl font-black text-slate-900">{designerStats.acceptedQuotes}</h4>
            </div>
          </div>

          <div className="flex items-center gap-4 p-5 bg-white border border-slate-200 shadow-sm rounded-2xl">
            <div className="flex items-center justify-center w-12 h-12 text-indigo-600 bg-indigo-50 rounded-xl">
              <FaUserAlt className="text-xl" />
            </div>
            <div>
              <p className="text-xs font-bold tracking-wider uppercase text-slate-500">Assigned To Me</p>
              <h4 className="text-2xl font-black text-slate-900">{designerStats.assignedToMe}</h4>
            </div>
          </div>
        </div>

        {/* RECENT CUSTOM DESIGN REQUESTS */}
        <div className="flex flex-col overflow-hidden bg-white border border-slate-200 shadow-sm rounded-2xl">
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Recent Custom Design Requests</h3>
              <p className="mt-1 text-xs text-slate-500">Latest custom drawings and specifications.</p>
            </div>
            <button 
              onClick={() => navigate('/admin/quotes')} 
              className="px-4 py-2 text-xs font-bold text-blue-600 transition-colors rounded-lg bg-blue-50 hover:bg-blue-100"
            >
              Manage All
            </button>
          </div>
          
          <div className="divide-y divide-slate-100">
            {designerStats.recentDesigns.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <FaClipboardList className="mb-3 text-4xl text-slate-350" />
                <p className="font-medium text-slate-500">No custom design requests found.</p>
              </div>
            ) : (
              designerStats.recentDesigns.map((quote) => (
                <div key={quote._id} className="flex flex-col justify-between gap-4 p-4 transition-colors sm:flex-row sm:items-center sm:px-6 hover:bg-slate-50/50 group">
                  <div className="flex-1">
                    <p className="text-sm font-black text-slate-900">
                      {quote.quoteNumber || `#${quote._id.slice(-6)}`}
                    </p>
                    <p className="mt-1 text-xs text-slate-505 font-semibold">
                      Created {new Date(quote.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center flex-1 gap-2 text-sm font-bold text-slate-700">
                    <span className="truncate">{quote.userDetails?.name || "Client"}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-full uppercase ${
                      quote.status === "Pending" ? "bg-yellow-100 text-yellow-800" :
                      quote.status === "Accepted" ? "bg-green-100 text-green-800" :
                      "bg-blue-100 text-blue-800"
                    }`}>
                      {quote.status}
                    </span>
                    <button 
                      onClick={() => navigate('/admin/quotes')} 
                      className="flex items-center gap-2 text-xs font-bold text-blue-600 bg-white border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50"
                    >
                      View & Respond
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // =====================================================================
  // 2. 🛒 PURCHASE & INVENTORY MANAGEMENT
  // =====================================================================
  if (userRole === "purchase") {
    const lowStockAlerts = stats.lowStockItems || [];
    const outOfStockCount = lowStockAlerts.filter(i => i.stock === 0).length;

    return (
      <div className="min-h-screen px-4 py-8 font-sans sm:px-8 lg:px-12 w-full sm:py-10 bg-slate-50">
        <div className="mb-8">
          <h2 className="text-2xl font-black tracking-tight sm:text-3xl text-slate-900">Purchase Dashboard</h2>
          <p className="mt-1 text-sm text-slate-500">Monitor raw material sheets, stock levels, and vendor purchases.</p>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-1 gap-4 mb-8 sm:grid-cols-3">
          <div className="flex items-center gap-4 p-5 bg-white border border-slate-200 shadow-sm rounded-2xl">
            <div className="flex items-center justify-center w-12 h-12 text-red-600 bg-red-50 rounded-xl animate-pulse">
              <FaExclamationTriangle className="text-xl" />
            </div>
            <div>
              <p className="text-xs font-bold tracking-wider uppercase text-slate-500">Out of Stock</p>
              <h4 className="text-2xl font-black text-slate-900">{outOfStockCount} Items</h4>
            </div>
          </div>

          <div className="flex items-center gap-4 p-5 bg-white border border-slate-200 shadow-sm rounded-2xl">
            <div className="flex items-center justify-center w-12 h-12 text-amber-600 bg-amber-50 rounded-xl">
              <FaExclamationCircle className="text-xl" />
            </div>
            <div>
              <p className="text-xs font-bold tracking-wider uppercase text-slate-500">Low Stock Warning</p>
              <h4 className="text-2xl font-black text-slate-900">{lowStockAlerts.length - outOfStockCount} Items</h4>
            </div>
          </div>

          <div className="flex items-center gap-4 p-5 bg-white border border-slate-200 shadow-sm rounded-2xl">
            <div className="flex items-center justify-center w-12 h-12 text-blue-600 bg-blue-50 rounded-xl">
              <FaWarehouse className="text-xl" />
            </div>
            <div>
              <p className="text-xs font-bold tracking-wider uppercase text-slate-500">Stock Inventory</p>
              <h4 className="text-2xl font-black text-slate-900">Active Sheets</h4>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* LOW STOCK LIST */}
          <div className="flex flex-col overflow-hidden bg-white border border-slate-200 shadow-sm lg:col-span-2 rounded-2xl">
            <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100 bg-slate-50/50">
              <FaExclamationCircle className="text-xl text-red-500" />
              <h3 className="text-lg font-bold text-slate-900">Material Depletion Alerts</h3>
            </div>
            <div className="divide-y divide-slate-150 flex-1">
              {lowStockAlerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 h-full text-center">
                  <p className="font-semibold text-slate-500">All materials and sheets are fully stocked!</p>
                </div>
              ) : (
                lowStockAlerts.map((item) => (
                  <div key={item._id} className="flex items-center justify-between p-4 px-6 hover:bg-slate-55">
                    <p className="font-bold text-sm text-slate-800 line-clamp-2">{item.name}</p>
                    <span className={`px-3 py-1 text-xs font-extrabold rounded-md ${
                      item.stock === 0 ? "bg-red-150 text-red-700" : "bg-amber-150 text-amber-700"
                    }`}>
                      {item.stock} Sheets Left
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* QUICK ACTIONS */}
          <div className="flex flex-col p-6 bg-white border border-slate-200 shadow-sm rounded-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Stock Controls</h3>
            <div className="space-y-4">
              <button 
                onClick={() => navigate('/admin/products')} 
                className="w-full flex items-center justify-center gap-2 px-4 py-3 font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200"
              >
                <FaWarehouse /> Manage Catalog
              </button>
              <button 
                onClick={() => navigate('/admin/products/csv-management')} 
                className="w-full flex items-center justify-center gap-2 px-4 py-3 font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-sm"
              >
                <FaTags /> CSV Import/Export
              </button>
              <button 
                onClick={() => navigate('/admin/products/add')} 
                className="w-full flex items-center justify-center gap-2 px-4 py-3 font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 shadow-sm"
              >
                <FaTools /> Add Raw Sheets
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================================
  // 3. ⚙️ MANUFACTURING & PRODUCTION
  // =====================================================================
  if (userRole === "manufacturing") {
    const awaitingProduction = ordersList.filter(o => o.orderStatus === "Awaiting Processing");
    const inProduction = ordersList.filter(o => o.orderStatus === "Processing");

    return (
      <div className="min-h-screen px-4 py-8 font-sans sm:px-8 lg:px-12 w-full sm:py-10 bg-slate-50">
        <div className="mb-8">
          <h2 className="text-2xl font-black tracking-tight sm:text-3xl text-slate-900">Manufacturing Terminal</h2>
          <p className="mt-1 text-sm text-slate-500">Monitor fabrication queues and auto-deduct raw sheet stocks.</p>
        </div>

        {/* METRICS */}
        <div className="grid grid-cols-1 gap-4 mb-8 sm:grid-cols-3">
          <div className="flex items-center gap-4 p-5 bg-white border border-slate-200 shadow-sm rounded-2xl">
            <div className="flex items-center justify-center w-12 h-12 text-yellow-600 bg-yellow-50 rounded-xl">
              <FaClipboardList className="text-xl" />
            </div>
            <div>
              <p className="text-xs font-bold tracking-wider uppercase text-slate-500">Awaiting Production</p>
              <h4 className="text-2xl font-black text-slate-900">{awaitingProduction.length} Orders</h4>
            </div>
          </div>

          <div className="flex items-center gap-4 p-5 bg-white border border-slate-200 shadow-sm rounded-2xl">
            <div className="flex items-center justify-center w-12 h-12 text-blue-600 bg-blue-50 rounded-xl animate-spin-slow">
              <FaTools className="text-xl" />
            </div>
            <div>
              <p className="text-xs font-bold tracking-wider uppercase text-slate-500">In Production</p>
              <h4 className="text-2xl font-black text-slate-900">{inProduction.length} Orders</h4>
            </div>
          </div>

          <div className="flex items-center gap-4 p-5 bg-emerald-55 border border-emerald-200 shadow-sm rounded-2xl">
            <div className="flex items-center justify-center w-12 h-12 text-emerald-700 bg-emerald-100 rounded-xl">
              <FaCheckDouble className="text-xl" />
            </div>
            <div>
              <p className="text-xs font-bold tracking-wider uppercase text-emerald-800">Stock Integration</p>
              <h4 className="text-sm font-extrabold text-emerald-900">Linked to HDPE/PP sheets</h4>
            </div>
          </div>
        </div>

        {/* PRODUCTION QUEUE */}
        <div className="flex flex-col overflow-hidden bg-white border border-slate-200 shadow-sm rounded-2xl">
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-lg font-bold text-slate-900">Production Queue</h3>
            <button 
              onClick={() => navigate('/admin/orders')} 
              className="px-4 py-2 text-xs font-bold text-blue-600 transition-colors rounded-lg bg-blue-50 hover:bg-blue-100"
            >
              Open Full Order Board
            </button>
          </div>
          
          <div className="divide-y divide-slate-100">
            {[...inProduction, ...awaitingProduction].length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <FaClipboardList className="mb-3 text-4xl text-slate-300" />
                <p className="font-semibold text-slate-500">No active production work currently.</p>
              </div>
            ) : (
              [...inProduction, ...awaitingProduction].slice(0, 8).map((order) => (
                <div key={order._id} className="flex flex-col justify-between gap-4 p-4 transition-colors sm:flex-row sm:items-center sm:px-6 hover:bg-slate-50/50">
                  <div className="flex-1">
                    <p className="text-sm font-black text-slate-900">
                      {order.orderCode || `#${order._id.slice(-6)}`}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 font-semibold">
                      Created {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center flex-1 gap-2 text-sm font-bold text-slate-705">
                    <span className="truncate">{order.shippingInfo?.fullName || "Guest User"}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-full uppercase ${
                      order.orderStatus === "Processing" ? "bg-blue-100 text-blue-800" : "bg-yellow-100 text-yellow-800"
                    }`}>
                      {order.orderStatus}
                    </span>
                    <button 
                      onClick={() => navigate(`/admin/orders/${order._id}`)} 
                      className="px-3 py-1.5 text-xs font-bold text-blue-600 bg-white border border-blue-250 rounded-lg hover:bg-blue-50"
                    >
                      Update Step
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // =====================================================================
  // 4. 📦 PACKING TERMINAL
  // =====================================================================
  if (userRole === "packing") {
    const needingPacking = ordersList.filter(o => o.orderStatus === "Processing");
    const packedReady = ordersList.filter(o => o.orderStatus === "Ready For Pickup");

    return (
      <div className="min-h-screen px-4 py-8 font-sans sm:px-8 lg:px-12 w-full sm:py-10 bg-slate-50">
        <div className="mb-8">
          <h2 className="text-2xl font-black tracking-tight sm:text-3xl text-slate-900">Packaging Station</h2>
          <p className="mt-1 text-sm text-slate-500">Box and wrap orders, generate printing labels, and mark as packed.</p>
        </div>

        {/* METRICS */}
        <div className="grid grid-cols-1 gap-4 mb-8 sm:grid-cols-2">
          <div className="flex items-center gap-4 p-5 bg-white border border-slate-200 shadow-sm rounded-2xl">
            <div className="flex items-center justify-center w-12 h-12 text-yellow-600 bg-yellow-50 rounded-xl">
              <FaBoxOpen className="text-xl" />
            </div>
            <div>
              <p className="text-xs font-bold tracking-wider uppercase text-slate-500">Needing Packaging</p>
              <h4 className="text-2xl font-black text-slate-900">{needingPacking.length} Orders</h4>
            </div>
          </div>

          <div className="flex items-center gap-4 p-5 bg-white border border-slate-200 shadow-sm rounded-2xl">
            <div className="flex items-center justify-center w-12 h-12 text-emerald-600 bg-emerald-50 rounded-xl">
              <FaGift className="text-xl" />
            </div>
            <div>
              <p className="text-xs font-bold tracking-wider uppercase text-slate-500">Packed & Ready for Courier</p>
              <h4 className="text-2xl font-black text-slate-900">{packedReady.length} Orders</h4>
            </div>
          </div>
        </div>

        {/* QUEUE */}
        <div className="flex flex-col overflow-hidden bg-white border border-slate-200 shadow-sm rounded-2xl">
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-lg font-bold text-slate-900">Orders to Pack</h3>
            <button 
              onClick={() => navigate('/admin/orders')} 
              className="px-4 py-2 text-xs font-bold text-blue-600 bg-blue-50 rounded-lg"
            >
              Open Full List
            </button>
          </div>
          
          <div className="divide-y divide-slate-100">
            {needingPacking.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <FaBoxOpen className="mb-3 text-4xl text-slate-300" />
                <p className="font-semibold text-slate-550">Everything is packed! Good job.</p>
              </div>
            ) : (
              needingPacking.slice(0, 8).map((order) => (
                <div key={order._id} className="flex flex-col justify-between gap-4 p-4 sm:flex-row sm:items-center sm:px-6 hover:bg-slate-50/50">
                  <div className="flex-1">
                    <p className="text-sm font-black text-slate-900">
                      {order.orderCode || `#${order._id.slice(-6)}`}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 font-semibold">
                      {order.items?.length || 0} product(s) to pack
                    </p>
                  </div>
                  <div className="flex items-center flex-1 gap-2 text-sm font-bold text-slate-700">
                    <span className="truncate">{order.shippingInfo?.fullName} ({order.shippingInfo?.city})</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <button 
                      onClick={() => navigate(`/admin/orders/print-label/${order._id}`)} 
                      className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                    >
                      Print Label
                    </button>
                    <button 
                      onClick={() => navigate(`/admin/orders/${order._id}`)} 
                      className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                    >
                      Mark Packed
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // =====================================================================
  // 5. 🚚 DISPATCH & SHIPPING
  // =====================================================================
  if (userRole === "dispatch") {
    const readyToShip = ordersList.filter(o => o.orderStatus === "Ready For Pickup");
    const activeTransit = ordersList.filter(o => o.orderStatus === "Shipped" || o.orderStatus === "Out for Delivery");
    const completedDelivered = ordersList.filter(o => o.orderStatus === "Delivered");

    return (
      <div className="min-h-screen px-4 py-8 font-sans sm:px-8 lg:px-12 w-full sm:py-10 bg-slate-50">
        <div className="mb-8">
          <h2 className="text-2xl font-black tracking-tight sm:text-3xl text-slate-900">Dispatch & Shipping Terminal</h2>
          <p className="mt-1 text-sm text-slate-500">Manage courier integration, print invoices, and update shipping tracking IDs.</p>
        </div>

        {/* METRICS */}
        <div className="grid grid-cols-1 gap-4 mb-8 sm:grid-cols-3">
          <div className="flex items-center gap-4 p-5 bg-white border border-slate-200 shadow-sm rounded-2xl">
            <div className="flex items-center justify-center w-12 h-12 text-blue-600 bg-blue-50 rounded-xl">
              <FaWarehouse className="text-xl" />
            </div>
            <div>
              <p className="text-xs font-bold tracking-wider uppercase text-slate-500">Ready to Ship</p>
              <h4 className="text-2xl font-black text-slate-900">{readyToShip.length} Orders</h4>
            </div>
          </div>

          <div className="flex items-center gap-4 p-5 bg-white border border-slate-200 shadow-sm rounded-2xl">
            <div className="flex items-center justify-center w-12 h-12 text-indigo-600 bg-indigo-50 rounded-xl animate-pulse">
              <FaShippingFast className="text-xl" />
            </div>
            <div>
              <p className="text-xs font-bold tracking-wider uppercase text-slate-500">In Transit</p>
              <h4 className="text-2xl font-black text-slate-900">{activeTransit.length} Orders</h4>
            </div>
          </div>

          <div className="flex items-center gap-4 p-5 bg-white border border-slate-200 shadow-sm rounded-2xl">
            <div className="flex items-center justify-center w-12 h-12 text-emerald-600 bg-emerald-50 rounded-xl">
              <FaCheckDouble className="text-xl" />
            </div>
            <div>
              <p className="text-xs font-bold tracking-wider uppercase text-slate-500">Delivered</p>
              <h4 className="text-2xl font-black text-slate-900">{completedDelivered.length} Orders</h4>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* DISPATCH QUEUE */}
          <div className="flex flex-col overflow-hidden bg-white border border-slate-200 shadow-sm lg:col-span-2 rounded-2xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-900">Awaiting Shipments</h3>
            </div>
            <div className="divide-y divide-slate-100 flex-1">
              {readyToShip.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 h-full text-center">
                  <FaTruck className="mb-3 text-4xl text-slate-300" />
                  <p className="font-semibold text-slate-500">No shipments currently awaiting dispatch.</p>
                </div>
              ) : (
                readyToShip.slice(0, 8).map((order) => (
                  <div key={order._id} className="flex flex-col justify-between gap-4 p-4 sm:flex-row sm:items-center sm:px-6 hover:bg-slate-50">
                    <div className="flex-1">
                      <p className="text-sm font-black text-slate-900">
                        {order.orderCode || `#${order._id.slice(-6)}`}
                      </p>
                      <p className="mt-1 text-xs text-slate-500 font-semibold">
                        Weight: {order.shippingWeightKg || 0} kg | City: {order.shippingInfo?.city}
                      </p>
                    </div>
                    <div className="flex items-center flex-1 gap-2 text-sm font-semibold text-slate-700">
                      <span>Courier: {order.courierPartner || order.selectedShippingProvider || "Not Assigned"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 sm:justify-end">
                      <button 
                        onClick={() => navigate(`/admin/orders/tax-invoice/${order._id}`)} 
                        className="px-3 py-1.5 text-xs font-bold text-slate-650 bg-slate-100 hover:bg-slate-200 rounded-lg"
                      >
                        Print Invoice
                      </button>
                      <button 
                        onClick={() => navigate(`/admin/orders/${order._id}`)} 
                        className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                      >
                        Assign Tracking
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* DISPATCH ACTIONS */}
          <div className="flex flex-col p-6 bg-white border border-slate-200 shadow-sm rounded-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Logistics Panel</h3>
            <div className="space-y-4">
              <button 
                onClick={() => navigate('/admin/shipping')} 
                className="w-full flex items-center justify-center gap-2 px-4 py-3 font-semibold text-white bg-blue-650 rounded-xl hover:bg-blue-700 shadow-sm"
              >
                <FaShippingFast /> Shipping Providers
              </button>
              <button 
                onClick={() => navigate('/admin/orders')} 
                className="w-full flex items-center justify-center gap-2 px-4 py-3 font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200"
              >
                <FaClipboardList /> Track Transit Board
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================================
  // 6. 📞 FEEDBACK & CRM TRACKING
  // =====================================================================
  if (userRole === "feedback tracking") {
    const delivered = ordersList.filter(o => o.orderStatus === "Delivered");
    const returned = ordersList.filter(o => o.orderStatus === "Returned");

    return (
      <div className="min-h-screen px-4 py-8 font-sans sm:px-8 lg:px-12 w-full sm:py-10 bg-slate-50">
        <div className="mb-8">
          <h2 className="text-2xl font-black tracking-tight sm:text-3xl text-slate-900">CRM & Feedback Tracking</h2>
          <p className="mt-1 text-sm text-slate-500">Follow up with clients on delivered orders and log timeline notes.</p>
        </div>

        {/* METRICS */}
        <div className="grid grid-cols-1 gap-4 mb-8 sm:grid-cols-2">
          <div className="flex items-center gap-4 p-5 bg-white border border-slate-200 shadow-sm rounded-2xl">
            <div className="flex items-center justify-center w-12 h-12 text-emerald-600 bg-emerald-50 rounded-xl">
              <FaCheckDouble className="text-xl" />
            </div>
            <div>
              <p className="text-xs font-bold tracking-wider uppercase text-slate-500">Completed Deliveries</p>
              <h4 className="text-2xl font-black text-slate-900">{delivered.length} Clients</h4>
            </div>
          </div>

          <div className="flex items-center gap-4 p-5 bg-white border border-slate-200 shadow-sm rounded-2xl">
            <div className="flex items-center justify-center w-12 h-12 text-red-600 bg-red-50 rounded-xl">
              <FaExclamationCircle className="text-xl" />
            </div>
            <div>
              <p className="text-xs font-bold tracking-wider uppercase text-slate-500">Returns / Disputes</p>
              <h4 className="text-2xl font-black text-slate-900">{returned.length} Orders</h4>
            </div>
          </div>
        </div>

        {/* DELIVERED ORDER FOLLOW UP */}
        <div className="flex flex-col overflow-hidden bg-white border border-slate-200 shadow-sm rounded-2xl">
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-lg font-bold text-slate-900">Customer Support Call Board</h3>
            <button 
              onClick={() => navigate('/admin/quotes/notes')} 
              className="px-4 py-2 text-xs font-bold text-blue-600 transition-colors rounded-lg bg-blue-50 hover:bg-blue-100"
            >
              CRM Notes Timeline
            </button>
          </div>
          
          <div className="divide-y divide-slate-100">
            {delivered.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <FaCommentDots className="mb-3 text-4xl text-slate-300" />
                <p className="font-semibold text-slate-500">No completed orders ready for feedback yet.</p>
              </div>
            ) : (
              delivered.slice(0, 8).map((order) => (
                <div key={order._id} className="flex flex-col justify-between gap-4 p-4 sm:flex-row sm:items-center sm:px-6 hover:bg-slate-50/50">
                  <div className="flex-1">
                    <p className="text-sm font-black text-slate-900">
                      {order.orderCode || `#${order._id.slice(-6)}`}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 font-semibold">
                      Client: {order.shippingInfo?.fullName} | City: {order.shippingInfo?.city}
                    </p>
                  </div>
                  <div className="flex items-center flex-1 gap-2 text-sm font-semibold text-slate-700">
                    <span>Phone: {order.shippingInfo?.phone}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <button 
                      onClick={() => navigate(`/admin/orders/${order._id}`)} 
                      className="px-3 py-1.5 text-xs font-bold text-slate-650 bg-slate-100 hover:bg-slate-200 rounded-lg"
                    >
                      View Order Details
                    </button>
                    <button 
                      onClick={() => navigate('/admin/quotes/notes')} 
                      className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                    >
                      Log CRM Remark
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // =====================================================================
  // 7. 💵 ACCOUNTING & FINANCIALS
  // =====================================================================
  if (userRole === "accounting") {
    return (
      <div className="min-h-screen px-4 py-8 font-sans sm:px-8 lg:px-12 w-full sm:py-10 bg-slate-50">
        <div className="mb-8">
          <h2 className="text-2xl font-black tracking-tight sm:text-3xl text-slate-900">Accounting Workspace</h2>
          <p className="mt-1 text-sm text-slate-500">Approve pending manual UPI transactions and monitor sales revenues.</p>
        </div>

        {/* STATS ROW */}
        <div className="grid grid-cols-1 gap-6 mb-8 lg:grid-cols-3">
          {/* REVENUE */}
          <div className="flex flex-col p-6 bg-white border shadow-sm lg:col-span-2 border-slate-250 rounded-2xl">
            <div className="flex flex-col justify-between gap-4 mb-6 sm:flex-row sm:items-center">
              <h3 className="text-lg font-bold text-slate-900">Revenues & Invoices</h3>
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
                  {revenueTab === 'today' ? "Today's Bookings" : revenueTab === 'week' ? "Weekly Revenue" : "Monthly Revenue"}
                </p>
                <h4 className="text-4xl font-black text-slate-900">
                  {formatCurrency(stats.revenue[revenueTab])}
                </h4>
              </div>
            </div>
          </div>

          {/* MANUAL UPI TRANSACTIONS TO VERIFY */}
          <div className="relative flex flex-col p-6 overflow-hidden bg-white border border-amber-250 shadow-sm rounded-2xl">
            <h3 className="text-lg font-bold text-amber-900 mb-2">Awaiting Payments</h3>
            <p className="text-sm font-semibold text-amber-700 mb-6">Verify UPI receipts and approve orders.</p>
            <div className="flex flex-col gap-4 mt-auto">
              <h4 className="text-5xl font-black text-amber-600">{stats.pendingUPI}</h4>
              <button 
                onClick={() => navigate('/admin/orders')} 
                className="w-full px-4 py-3 text-sm font-bold text-white bg-amber-500 rounded-xl hover:bg-amber-600 active:scale-95 transition-all shadow-sm"
              >
                Approve UPI Receipts
              </button>
            </div>
          </div>
        </div>

        {/* INVOICE REVIEWS */}
        <div className="flex flex-col overflow-hidden bg-white border border-slate-200 shadow-sm rounded-2xl">
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-105 bg-slate-50/50">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FaFileInvoice className="text-blue-600" /> Recent Bookings & Invoices
            </h3>
          </div>
          
          <div className="divide-y divide-slate-100">
            {stats.recentOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <FaClipboardList className="mb-3 text-4xl text-slate-300" />
                <p className="font-semibold text-slate-500">No recent transactions logged.</p>
              </div>
            ) : (
              stats.recentOrders.map((order) => (
                <div key={order._id} className="flex flex-col justify-between gap-4 p-4 sm:flex-row sm:items-center sm:px-6 hover:bg-slate-50/50">
                  <div className="flex-1">
                    <p className="text-sm font-black text-slate-900">
                      {order.orderCode || `#${order._id.slice(-6)}`}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 font-semibold">
                      Payment: {order.paymentMethod} | Status: <span className="text-amber-700 font-bold">{order.paymentStatus}</span>
                    </p>
                  </div>
                  <div className="flex items-center flex-1 gap-2 text-sm font-bold text-slate-900 sm:justify-end">
                    <span>{formatCurrency(order.totalAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <button 
                      onClick={() => navigate(`/admin/orders/tax-invoice/${order._id}`)} 
                      className="px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 rounded-lg"
                    >
                      Tax Invoice
                    </button>
                    <button 
                      onClick={() => navigate(`/admin/orders/${order._id}`)} 
                      className="px-3 py-1.5 text-xs font-bold text-slate-750 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                    >
                      Review
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // =====================================================================
  // 8. 📈 MARKETING & CONVERSIONS
  // =====================================================================
  if (userRole === "marketing") {
    return (
      <div className="min-h-screen px-4 py-8 font-sans sm:px-8 lg:px-12 w-full sm:py-10 bg-slate-50">
        <div className="mb-8">
          <h2 className="text-2xl font-black tracking-tight sm:text-3xl text-slate-900">Marketing Analytics</h2>
          <p className="mt-1 text-sm text-slate-500">Track registered leads, conversions, and site activity metrics.</p>
        </div>

        {/* METRICS */}
        <div className="grid grid-cols-1 gap-6 mb-8 lg:grid-cols-3">
          
          {/* USERS */}
          <div className="flex items-center gap-4 p-6 bg-white border border-slate-200 shadow-sm rounded-2xl">
            <div className="flex items-center justify-center w-14 h-14 text-2xl text-blue-600 bg-blue-100 rounded-full">
              <FaUsers />
            </div>
            <div>
              <p className="text-xs font-bold tracking-wider uppercase text-slate-500">Registered Leads</p>
              <h4 className="text-2xl font-black text-slate-900">Customer Base</h4>
              <p className="text-xs text-slate-400 mt-1">Manage user interactions on the platform.</p>
            </div>
          </div>

          {/* CONVERSION MOCK */}
          <div className="flex items-center gap-4 p-6 bg-white border border-slate-200 shadow-sm rounded-2xl">
            <div className="flex items-center justify-center w-14 h-14 text-2xl text-emerald-600 bg-emerald-100 rounded-full">
              <FaChartBar />
            </div>
            <div>
              <p className="text-xs font-bold tracking-wider uppercase text-slate-500">Traffic conversion</p>
              <h4 className="text-2xl font-black text-slate-900">Healthy (2.8%)</h4>
              <p className="text-xs text-slate-400 mt-1">Simulated click conversion rates.</p>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex flex-col justify-center p-6 bg-white border border-slate-200 shadow-sm rounded-2xl">
            <button 
              onClick={() => navigate('/admin/quotes')} 
              className="w-full flex items-center justify-center gap-2 px-4 py-3 font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-750 shadow-sm"
            >
              <FaClipboardList /> View Quotation Leads
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================================
  // 👑 GENERAL / ADMIN STORE OVERVIEW
  // =====================================================================
  return (
    <div className="min-h-screen px-4 py-8 font-sans sm:px-8 lg:px-12 w-full sm:py-10 bg-slate-50">
      
      <div className="mb-8">
        <h2 className="text-2xl font-black tracking-tight sm:text-3xl text-slate-900">Store Overview</h2>
        <p className="mt-1 text-sm text-slate-500">Monitor your real-time sales, orders, and take actions.</p>
      </div>

      {error && (
        <div className="p-4 mb-6 border-l-4 border-red-500 rounded-lg bg-red-55">
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
          <h3 className="relative z-10 mb-2 text-lg font-bold text-amber-905">Action Required</h3>
          <p className="relative z-10 mb-6 text-sm font-medium text-amber-750">Manual UPI verifications pending.</p>
          
          <div className="relative z-10 flex flex-col gap-4 mt-auto">
            <h4 className="text-5xl font-black text-amber-600">{stats.pendingUPI}</h4>
            <button 
              onClick={() => navigate('/admin/orders')} 
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
            <p className="text-xs font-bold tracking-wider uppercase text-slate-505 group-hover:text-blue-600">Processing</p>
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

      {/* BOTTOM ROW: RECENT ORDERS & LOW STOCK */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* RECENT ORDERS */}
        <div className="flex flex-col overflow-hidden bg-white border shadow-sm lg:col-span-2 border-slate-200 rounded-2xl">
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Recent Orders</h3>
              <p className="mt-1 text-xs text-slate-505">Latest 5 orders requiring attention.</p>
            </div>
            <button 
              onClick={() => navigate('/admin/orders')} 
              className="px-4 py-2 text-xs font-bold text-blue-600 transition-colors rounded-lg bg-blue-50 hover:bg-blue-100"
            >
              View All
            </button>
          </div>
          
          <div className="flex-1 divide-y divide-slate-150">
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
                    <p className="mt-1 text-xs text-slate-505">
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
                      onClick={() => navigate(`/admin/orders/${order._id}`)} 
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