import React, { useEffect, useState } from "react";
import axios from "axios";
import { 
  FaSearch, FaEye, FaFilter, FaThLarge, FaListUl, 
  FaArrowRight, FaCheckCircle, FaTruck, FaBoxOpen, FaExclamationTriangle
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // UI States
  const [viewMode, setViewMode] = useState("board"); // 'board' or 'list'
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  
  const navigate = useNavigate();

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get("http://localhost:5000/api/admin/orders", config);
      if (res.data.success) {
        setOrders(res.data.orders);
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError("Failed to load orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // 🔥 QUICK ACTION: Move Order to Next Stage
  const handleQuickAction = async (orderId, newOrderStatus, newPaymentStatus = null) => {
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const payload = { orderStatus: newOrderStatus };
      if (newPaymentStatus) payload.paymentStatus = newPaymentStatus;

      const res = await axios.put(`http://localhost:5000/api/admin/orders/${orderId}/status`, payload, config);
      if (res.data.success) {
        // Update local state smoothly without full reload
        setOrders(orders.map(o => o._id === orderId ? { ...o, orderStatus: newOrderStatus, paymentStatus: newPaymentStatus || o.paymentStatus } : o));
      }
    } catch (err) {
      alert("Failed to update status. Please try again.");
    }
  };

  // Filters
  const filteredOrders = orders.filter((order) => {
    const matchesSearch = 
      order.orderCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.shippingInfo?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.shippingInfo?.phone?.includes(searchTerm);
    const matchesStatus = statusFilter === "All" || order.orderStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Board Columns Logic
  const pendingOrders = filteredOrders.filter(o => o.paymentStatus === "Pending" || o.orderStatus === "Confirmed");
  const processingOrders = filteredOrders.filter(o => o.orderStatus === "Processing" && o.paymentStatus === "Paid");
  const shippingOrders = filteredOrders.filter(o => o.orderStatus === "Shipping");
  const deliveredOrders = filteredOrders.filter(o => o.orderStatus === "Delivered");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 mx-auto font-sans sm:px-6 lg:px-8 max-w-[1400px] sm:py-10 bg-slate-50 min-h-screen">
      
      {/* HEADER & VIEW TOGGLE */}
      <div className="flex flex-col gap-4 mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight sm:text-3xl text-slate-900">Order Management</h2>
          <p className="mt-1 text-sm text-slate-500">Manage your order workflow and pipeline.</p>
        </div>
        <div className="flex p-1 bg-slate-200/60 rounded-xl w-max">
          <button 
            onClick={() => setViewMode("board")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-all ${viewMode === "board" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            <FaThLarge /> Pipeline
          </button>
          <button 
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-all ${viewMode === "list" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            <FaListUl /> List View
          </button>
        </div>
      </div>

      {error && <div className="p-4 mb-6 text-sm font-bold text-red-700 border-l-4 border-red-500 rounded-lg bg-red-50">{error}</div>}

      {/* SEARCH BAR */}
      <div className="flex flex-col gap-4 p-4 mb-8 bg-white border shadow-sm sm:flex-row sm:items-center rounded-2xl border-slate-200">
        <div className="relative flex-1">
          <FaSearch className="absolute -translate-y-1/2 text-slate-400 left-4 top-1/2" />
          <input 
            type="text" 
            placeholder="Search by Order ID, Customer Name, or Phone..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full py-2.5 pl-10 pr-4 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* =========================================
          PIPELINE VIEW (KANBAN BOARD)
      ========================================= */}
      {viewMode === "board" && (
        <div className="grid items-start grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          
          {/* COLUMN 1: PENDING / NEW */}
          <div className="flex flex-col bg-slate-100/50 border border-slate-200 rounded-2xl p-4 min-h-[500px]">
            <div className="flex items-center justify-between px-1 mb-4">
              <h3 className="flex items-center gap-2 text-sm font-black tracking-widest uppercase text-slate-700">
                <FaExclamationTriangle className="text-amber-500" /> Action Required
              </h3>
              <span className="px-2 py-1 text-xs font-bold rounded-lg bg-slate-200 text-slate-600">{pendingOrders.length}</span>
            </div>
            <div className="flex flex-col gap-4">
              {pendingOrders.map(order => (
                <div key={order._id} className="p-5 transition-all bg-white border shadow-sm rounded-xl border-amber-200 hover:shadow-md">
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-sm font-black text-slate-900">{order.orderCode || `#${order.orderNumber}`}</p>
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded border border-amber-200 uppercase tracking-widest">
                      {order.paymentStatus === "Pending" ? "Verify UPI" : "New"}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-slate-800">{order.shippingInfo?.fullName}</p>
                  <p className="mb-3 text-xs text-slate-500">{formatCurrency(order.totalAmount)} • {order.items?.length || 0} Items</p>
                  
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => navigate(`/admin/orders/${order._id}`)} className="flex-1 py-2 text-xs font-bold transition-colors rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200">Details</button>
                    <button onClick={() => handleQuickAction(order._id, "Processing", "Paid")} className="flex items-center justify-center flex-1 gap-1 py-2 text-xs font-bold text-white transition-colors rounded-lg bg-amber-500 hover:bg-amber-600">
                      Approve <FaArrowRight />
                    </button>
                  </div>
                </div>
              ))}
              {pendingOrders.length === 0 && <p className="py-10 text-sm font-medium text-center border-2 border-dashed text-slate-400 border-slate-200 rounded-xl">No pending orders</p>}
            </div>
          </div>

          {/* COLUMN 2: PROCESSING */}
          <div className="flex flex-col bg-slate-100/50 border border-slate-200 rounded-2xl p-4 min-h-[500px]">
            <div className="flex items-center justify-between px-1 mb-4">
              <h3 className="flex items-center gap-2 text-sm font-black tracking-widest uppercase text-slate-700">
                <FaBoxOpen className="text-blue-500" /> Processing
              </h3>
              <span className="px-2 py-1 text-xs font-bold rounded-lg bg-slate-200 text-slate-600">{processingOrders.length}</span>
            </div>
            <div className="flex flex-col gap-4">
              {processingOrders.map(order => (
                <div key={order._id} className="p-5 transition-all bg-white border border-l-4 shadow-sm rounded-xl border-slate-200 hover:shadow-md border-l-blue-500">
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-sm font-black text-slate-900">{order.orderCode || `#${order.orderNumber}`}</p>
                  </div>
                  <p className="text-sm font-bold text-slate-800">{order.shippingInfo?.fullName}</p>
                  <p className="mb-3 text-xs text-slate-500">{formatCurrency(order.totalAmount)}</p>
                  
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => navigate(`/admin/orders/${order._id}`)} className="flex-1 py-2 text-xs font-bold transition-colors rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200">Pack Items</button>
                    <button onClick={() => handleQuickAction(order._id, "Shipping")} className="flex items-center justify-center flex-1 gap-1 py-2 text-xs font-bold text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700">
                      Dispatch <FaArrowRight />
                    </button>
                  </div>
                </div>
              ))}
              {processingOrders.length === 0 && <p className="py-10 text-sm font-medium text-center border-2 border-dashed text-slate-400 border-slate-200 rounded-xl">No processing orders</p>}
            </div>
          </div>

          {/* COLUMN 3: SHIPPING */}
          <div className="flex flex-col bg-slate-100/50 border border-slate-200 rounded-2xl p-4 min-h-[500px]">
            <div className="flex items-center justify-between px-1 mb-4">
              <h3 className="flex items-center gap-2 text-sm font-black tracking-widest uppercase text-slate-700">
                <FaTruck className="text-indigo-500" /> Shipping
              </h3>
              <span className="px-2 py-1 text-xs font-bold rounded-lg bg-slate-200 text-slate-600">{shippingOrders.length}</span>
            </div>
            <div className="flex flex-col gap-4">
              {shippingOrders.map(order => (
                <div key={order._id} className="p-5 transition-all bg-white border border-l-4 shadow-sm rounded-xl border-slate-200 hover:shadow-md border-l-indigo-500">
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-sm font-black text-slate-900">{order.orderCode || `#${order.orderNumber}`}</p>
                  </div>
                  <p className="text-sm font-bold text-slate-800">{order.shippingInfo?.fullName}</p>
                  <p className="mb-3 text-xs text-slate-500">{order.shippingInfo?.city}, {order.shippingInfo?.state}</p>
                  
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => handleQuickAction(order._id, "Delivered")} className="flex items-center justify-center w-full gap-1 py-2 text-xs font-bold text-indigo-700 transition-colors border border-indigo-200 rounded-lg bg-indigo-50 hover:bg-indigo-100">
                      <FaCheckCircle /> Mark Delivered
                    </button>
                  </div>
                </div>
              ))}
              {shippingOrders.length === 0 && <p className="py-10 text-sm font-medium text-center border-2 border-dashed text-slate-400 border-slate-200 rounded-xl">No shipping orders</p>}
            </div>
          </div>

          {/* COLUMN 4: DELIVERED */}
          <div className="flex flex-col bg-slate-100/50 border border-slate-200 rounded-2xl p-4 min-h-[500px]">
            <div className="flex items-center justify-between px-1 mb-4">
              <h3 className="flex items-center gap-2 text-sm font-black tracking-widest uppercase text-slate-700">
                <FaCheckCircle className="text-emerald-500" /> Delivered
              </h3>
              <span className="px-2 py-1 text-xs font-bold rounded-lg bg-slate-200 text-slate-600">{deliveredOrders.length}</span>
            </div>
            <div className="flex flex-col gap-4">
              {deliveredOrders.slice(0, 10).map(order => ( // Show only last 10 delivered in pipeline view to save space
                <div key={order._id} className="flex items-center justify-between p-4 transition-opacity bg-white border shadow-sm rounded-xl border-emerald-100 opacity-80 hover:opacity-100">
                  <div>
                    <p className="text-xs font-black line-through text-slate-900">{order.orderCode || `#${order.orderNumber}`}</p>
                    <p className="text-[10px] font-bold text-slate-500">{order.shippingInfo?.fullName}</p>
                  </div>
                  <button onClick={() => navigate(`/admin/orders/${order._id}`)} className="p-2 text-blue-500 rounded-lg hover:bg-blue-50"><FaEye /></button>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* =========================================
          LIST VIEW (TABLE)
      ========================================= */}
      {viewMode === "list" && (
        <div className="overflow-hidden bg-white border shadow-sm border-slate-200 rounded-[2rem]">
          <div className="hidden grid-cols-12 gap-4 px-8 py-4 text-xs font-bold tracking-wider uppercase border-b lg:grid bg-slate-50/80 border-slate-100 text-slate-500">
            <div className="col-span-3">Order Details</div>
            <div className="col-span-3">Customer</div>
            <div className="col-span-2">Amount</div>
            <div className="col-span-3">Status</div>
            <div className="col-span-1 text-right">Action</div>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredOrders.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-lg font-bold text-slate-400">No orders found.</p>
              </div>
            ) : (
              filteredOrders.map((order) => (
                <div key={order._id} className="flex flex-col items-start gap-4 p-5 transition-colors lg:grid lg:grid-cols-12 lg:px-8 lg:py-5 hover:bg-slate-50/50 lg:items-center">
                  <div className="col-span-3">
                    <p className="text-sm font-black text-slate-900">{order.orderCode || `#${order.orderNumber || order._id.slice(-6)}`}</p>
                    <p className="mt-1 text-xs font-medium text-slate-500">{new Date(order.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                  <div className="col-span-3">
                    <p className="text-sm font-bold text-slate-800">{order.shippingInfo?.fullName || "Guest User"}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{order.shippingInfo?.phone}</p>
                  </div>
                  <div className="hidden col-span-2 lg:block">
                    <p className="text-base font-black text-slate-900">{formatCurrency(order.totalAmount)}</p>
                  </div>
                  <div className="flex flex-wrap items-center w-full col-span-3 gap-2">
                    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg border ${order.paymentStatus === "Paid" ? "bg-green-50 text-green-700 border-green-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                      {order.paymentStatus}
                    </span>
                    <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg bg-slate-100 text-slate-600 border border-slate-200">
                      {order.orderStatus || "Confirmed"}
                    </span>
                  </div>
                  <div className="w-full col-span-1 mt-2 lg:w-auto lg:mt-0 lg:text-right">
                    <button onClick={() => navigate(`/admin/orders/${order._id}`)} className="flex items-center justify-center w-full gap-2 px-4 py-2 text-xs font-bold text-blue-600 transition-colors border border-blue-100 lg:w-auto bg-blue-50 rounded-xl hover:bg-blue-100">
                      <FaEye /> View
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;