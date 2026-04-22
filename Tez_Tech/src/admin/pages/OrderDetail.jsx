import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  FaArrowLeft, FaUserAlt, FaMapMarkerAlt, FaTruck, 
  FaCheckCircle, FaBoxOpen, FaFileInvoice, FaRupeeSign
} from "react-icons/fa";

// 💰 Currency Formatter
const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));

// 🖼️ Image URL Fixer
const getImageUrl = (path) => {
  if (!path) return "https://placehold.co/100x100?text=No+Image";
  if (path.startsWith("http")) return path;
  const cleanPath = path.replace(/\\/g, "/");
  return `http://localhost:5000${cleanPath.startsWith("/") ? "" : "/"}${cleanPath}`;
};

// 🏷️ Variations Parser (For factory instructions)
const getVariations = (item) => {
  let vars = [];
  if (item?.selectedCustomFields && typeof item.selectedCustomFields === 'object') {
    Object.entries(item.selectedCustomFields).forEach(([key, val]) => {
      if (key.startsWith("_")) return; // Hide internal tags
      if (val && !Array.isArray(val)) vars.push(`${key}: ${val}`);
      if (val && Array.isArray(val) && val.length > 0) vars.push(`${key}: ${val.join(", ")}`);
    });
  }
  if (item?.size) vars.push(`Size: ${item.size}`);
  if (item?.color) vars.push(`Color: ${item.color}`);
  return vars;
};

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // States for updating Order Workflow
  const [newOrderStatus, setNewOrderStatus] = useState("");
  const [newPaymentStatus, setNewPaymentStatus] = useState("");

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const res = await axios.get(`http://localhost:5000/api/admin/orders/${id}`, config);
      if (res.data.success) {
        setOrder(res.data.order);
        setNewOrderStatus(res.data.order.orderStatus);
        setNewPaymentStatus(res.data.order.paymentStatus);
      }
    } catch (err) {
      console.error("Fetch Order Error:", err);
      setError("Failed to load order details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  // 🔥 ACTION: Update Order Workflow & Payment Status
  const handleUpdateStatus = async () => {
    try {
      setIsUpdating(true);
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const res = await axios.put(
        `http://localhost:5000/api/admin/orders/${id}/status`, 
        { orderStatus: newOrderStatus, paymentStatus: newPaymentStatus },
        config
      );

      if (res.data.success) {
        alert("Order updated successfully!");
        fetchOrderDetails(); // Reload fresh data
      }
    } catch (err) {
      console.error("Update Error:", err);
      alert("Failed to update status. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (!order) return <div className="p-10 font-bold text-center text-red-500">Order not found.</div>;

  // 🔥 THE ONLY FIX ADDED: Live Subtotal Calculation
  const calculatedSubtotal = order.items?.reduce((sum, item) => {
    const itemPrice = Number(item.unitPrice) || Number(item.price) || 0;
    return sum + (itemPrice * item.quantity);
  }, 0);

  return (
    <div className="min-h-screen px-4 py-8 mx-auto font-sans sm:px-6 lg:px-8 max-w-7xl sm:py-10 bg-slate-50">
      
      {/* HEADER */}
      <div className="flex flex-col gap-4 mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 mb-2 text-sm font-semibold text-slate-500 hover:text-blue-600">
            <FaArrowLeft /> Back to Orders
          </button>
          <h2 className="text-2xl font-black tracking-tight sm:text-3xl text-slate-900">
            Order {order.orderCode || `#${order.orderNumber}`}
          </h2>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Placed on {new Date(order.createdAt).toLocaleString("en-IN", { dateStyle: 'medium', timeStyle: 'short' })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg border ${
            order.paymentStatus === "Paid" ? "bg-green-50 text-green-700 border-green-200" : "bg-amber-50 text-amber-700 border-amber-200"
          }`}>
            Payment: {order.paymentStatus}
          </span>
          <span className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
            Status: {order.orderStatus || "Confirmed"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        
        {/* LEFT COLUMN: Items & Payment Verification */}
        <div className="space-y-8 lg:col-span-2">
          
          {/* 🔥 1. PAYMENT VERIFICATION PANEL */}
          <div className="overflow-hidden bg-white border shadow-sm border-slate-200 rounded-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                <FaFileInvoice className="text-blue-500" /> Payment Verification
              </h3>
              <span className="px-3 py-1 text-xs font-bold tracking-wide uppercase rounded-md sm:text-sm bg-slate-200 text-slate-700">
                {order.paymentMethod === "MANUAL" ? "Manual Transfer (UPI)" : order.paymentMethod}
              </span>
            </div>
            <div className="p-6">
              {order.paymentMethod === "MANUAL" ? (
                <div className="flex flex-col items-start gap-6 md:flex-row">
                  {/* UTR Details */}
                  <div className="flex-1 w-full space-y-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-500">UTR / Reference Number</p>
                      <p className="p-3 mt-1 font-mono text-lg font-bold break-all border rounded-lg text-slate-900 bg-slate-50 border-slate-200">
                        {order.utrNumber || "Not Provided"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-500">Amount to Verify</p>
                      <p className="mt-1 text-2xl font-black text-blue-600">{formatCurrency(order.totalAmount)}</p>
                    </div>
                  </div>
                  
                  {/* Screenshot View */}
                  <div className="flex-shrink-0 w-full md:w-48">
                    <p className="mb-2 text-sm font-semibold text-slate-500">Payment Screenshot</p>
                    {order.paymentScreenshot ? (
                      <a href={getImageUrl(order.paymentScreenshot)} target="_blank" rel="noopener noreferrer" className="relative block overflow-hidden transition-colors border-2 border-dashed group rounded-xl border-slate-300 hover:border-blue-500">
                        <img 
                          src={getImageUrl(order.paymentScreenshot)} 
                          alt="UPI Screenshot" 
                          className="object-cover w-full h-48"
                        />
                        <div className="absolute inset-0 flex items-center justify-center transition-opacity opacity-0 bg-black/60 group-hover:opacity-100">
                          <span className="text-white text-xs font-bold uppercase tracking-widest bg-blue-600 px-3 py-1.5 rounded-lg shadow-lg">Click to Zoom</span>
                        </div>
                      </a>
                    ) : (
                      <div className="flex items-center justify-center w-full h-48 text-sm font-medium border-2 border-dashed bg-slate-50 border-slate-200 rounded-xl text-slate-400">
                        No Screenshot
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center">
                  <FaCheckCircle className="mx-auto mb-3 text-4xl text-green-500" />
                  <p className="font-bold text-slate-800">Online Payment / COD Selected.</p>
                  <p className="mt-1 text-sm text-slate-500">Manual UPI verification is not required.</p>
                </div>
              )}
            </div>
          </div>

          {/* 📦 2. ORDER ITEMS & VARIATIONS (Factory Instructions) */}
          <div className="overflow-hidden bg-white border shadow-sm border-slate-200 rounded-2xl">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                <FaBoxOpen className="text-blue-500" /> Order Items ({order.items?.length || 0})
              </h3>
            </div>
            <div className="p-6 space-y-6">
              {(order.items || []).map((item, index) => {
                const variations = getVariations(item);
                return (
                  <div key={index} className="flex flex-col gap-6 pb-6 border-b sm:flex-row border-slate-100 last:border-0 last:pb-0">
                    <div className="flex-shrink-0 w-24 h-24 p-2 overflow-hidden border bg-slate-50 border-slate-200 rounded-xl">
                      <img src={getImageUrl(item.image)} alt={item.name} className="object-contain w-full h-full mix-blend-multiply" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-bold leading-tight text-slate-900">{item.name}</h3>
                      <div className="flex items-center gap-4 mt-2">
                        <p className="text-sm font-medium text-slate-500">Qty: <span className="font-bold text-slate-800">{item.quantity}</span></p>
                        <p className="text-sm font-medium text-slate-500">Unit: <span className="font-bold text-slate-800">{formatCurrency(item.unitPrice)}</span></p>
                      </div>
                      
                      {/* 🔥 VERY IMPORTANT: Factory Variations Output */}
                      {variations.length > 0 && (
                        <div className="p-3 mt-3 border border-blue-100 bg-blue-50/50 rounded-xl">
                          <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-2">Customer Selected Options:</p>
                          <div className="flex flex-wrap gap-2">
                            {variations.map((v, i) => (
                              <span key={i} className="px-2.5 py-1 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg shadow-sm">
                                {v}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col justify-center mt-4 sm:text-right sm:mt-0">
                      <p className="mb-1 text-xs font-semibold tracking-wide uppercase text-slate-400">Line Total</p>
                      <p className="text-lg font-black text-slate-900">{formatCurrency(item.price * item.quantity)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Notes Section */}
          {order.orderNotes && (
            <div className="p-6 border bg-amber-50 border-amber-200 rounded-2xl">
              <h3 className="mb-2 text-sm font-black tracking-widest uppercase text-amber-800">Customer Notes / Special Instructions</h3>
              <p className="font-medium text-slate-700">{order.orderNotes}</p>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: Sidebar (Shipping, Summary, Actions) */}
        <div className="space-y-8">
          
          {/* ⚡ 3. ADMIN ACTION: STATUS CONTROLS */}
          <div className="p-6 border shadow-xl bg-slate-900 rounded-2xl border-slate-800">
            <h2 className="flex items-center gap-2 mb-5 text-lg font-black text-white">
              Action Panel
            </h2>
            
            <div className="space-y-5">
              {/* Payment Status Dropdown */}
              <div>
                <label className="block mb-2 text-xs font-bold tracking-widest uppercase text-slate-400">Payment Verification</label>
                <select 
                  value={newPaymentStatus} 
                  onChange={(e) => setNewPaymentStatus(e.target.value)}
                  className="w-full px-4 py-3 text-sm font-bold text-white border bg-slate-800 border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="Pending">Pending (Wait for verification)</option>
                  <option value="Paid">Paid (Verified successfully)</option>
                  <option value="Failed">Failed / Rejected</option>
                </select>
              </div>

              {/* Order Pipeline Dropdown */}
              <div>
                <label className="block mb-2 text-xs font-bold tracking-widest uppercase text-slate-400">Order Pipeline Stage</label>
                <select 
                  value={newOrderStatus} 
                  onChange={(e) => setNewOrderStatus(e.target.value)}
                  className="w-full px-4 py-3 text-sm font-bold text-white border bg-slate-800 border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="Confirmed">Confirmed (New Order)</option>
                  <option value="Processing">Processing (Manufacturing/Packing)</option>
                  <option value="Shipping">Shipping (Handed to courier)</option>
                  <option value="Delivered">Delivered (Completed)</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <button 
                onClick={handleUpdateStatus}
                disabled={isUpdating}
                className="w-full px-4 py-3 mt-2 text-sm font-black transition-colors bg-blue-400 text-slate-900 rounded-xl hover:bg-blue-300 disabled:opacity-50"
              >
                {isUpdating ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>

          {/* 🚚 4. SHIPPING & CUSTOMER DETAILS */}
          <div className="p-6 bg-white border shadow-sm border-slate-200 rounded-2xl">
            <h2 className="flex items-center gap-2 mb-5 text-sm font-black tracking-widest uppercase text-slate-400">
              <FaMapMarkerAlt /> Delivery Details
            </h2>
            
            <p className="text-base font-bold text-slate-900">{order.shippingInfo?.fullName}</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {order.shippingInfo?.address}<br/>
              {order.shippingInfo?.city}, {order.shippingInfo?.state ? `${order.shippingInfo.state}, ` : ""}{order.shippingInfo?.pincode}
            </p>
            <p className="flex items-center gap-2 mt-3 text-sm font-bold text-slate-800">
              <FaUserAlt className="text-xs text-slate-400" /> {order.shippingInfo?.phone}
            </p>

            <div className="pt-5 mt-5 border-t border-slate-100">
              <p className="mb-2 text-xs font-bold tracking-widest uppercase text-slate-400">Courier Partner</p>
              <div className="flex items-center gap-2 p-3 text-sm font-bold border text-slate-800 bg-slate-50 border-slate-200 rounded-xl">
                <FaTruck className="text-blue-500" /> 
                {order.courierPartner || "Standard Courier"}
              </div>
            </div>
          </div>

          {/* 🧾 5. FINANCIAL SUMMARY */}
          <div className="p-6 bg-white border shadow-sm border-slate-200 rounded-2xl">
            <h2 className="mb-5 text-sm font-black tracking-widest uppercase text-slate-400">Order Summary</h2>
            <div className="space-y-3 text-sm font-medium">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal (Items)</span>
                {/* 🔥 YAHAN CHANGE KIYA HAI - order.subtotalAmount ki jagah calculatedSubtotal */}
                <span className="text-slate-900">{formatCurrency(calculatedSubtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Shipping Cost</span>
                <span className={order.shippingAmount > 0 ? "text-slate-900" : "text-green-600"}>
                  {order.shippingAmount > 0 ? formatCurrency(order.shippingAmount) : "FREE"}
                </span>
              </div>
              <div className="flex items-end justify-between pt-4 mt-2 border-t border-dashed border-slate-200">
                <span className="text-base font-black text-slate-900">Grand Total</span>
                <span className="text-2xl font-black text-blue-600">{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default OrderDetail;