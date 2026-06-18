import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  FaArrowLeft, FaEdit, FaUserAlt, FaMapMarkerAlt, FaTruck, 
  FaCheckCircle, FaBoxOpen, FaFileInvoice, FaRupeeSign, FaRegCalendarAlt, FaTimes
} from "react-icons/fa";
import api, { getApiUrl } from "../../utils/api";
import { toast } from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

// 💰 Currency Formatter Helper
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
  const backendOrigin = getApiUrl().replace("/api", "");
  return `${backendOrigin}${cleanPath.startsWith("/") ? "" : "/"}${cleanPath}`;
};

// 🏷️ Variations Parser (For displaying customer custom inputs)
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
  if (item?.selectedVariantInfo) vars.push(item.selectedVariantInfo);
  if (item?.variant) vars.push(item.variant);
  return vars;
};

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const userRole = user?.role?.toLowerCase() || "";

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [zoomScreenshot, setZoomScreenshot] = useState(false);

  const handleSendToProduction = async () => {
    const thickness = prompt("Enter material thickness (mm) for Job Card:", "1");
    if (thickness === null) return;
    const materialType = prompt("Enter material type (e.g. HDPE, PP):", "HDPE");
    if (materialType === null) return;

    try {
      const res = await api.put(`/orders/admin/production/${id}`, {
        thickness: Number(thickness) || 1,
        materialType: materialType || "HDPE"
      });
      if (res.data.success) {
        toast.success("Order successfully sent to Laser Production!");
        fetchOrderDetails();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send to production");
    }
  };

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get(`/admin/orders/${id}`);
      if (res.data.success) {
        setOrder(res.data.order);
      }
    } catch (err) {
      console.error("Fetch Order Details Error:", err);
      setError("Failed to load order details.");
      toast.error("Failed to load order details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-xl p-10 mx-auto mt-10 text-center bg-white rounded-lg shadow border border-red-100">
        <h2 className="text-xl font-bold text-red-500 mb-2">Error Occurred</h2>
        <p className="text-gray-600 mb-6">{error || "Order not found."}</p>
        <button onClick={() => navigate("/admin/orders")} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-500">
          Back to Orders
        </button>
      </div>
    );
  }

  const displayId = order.orderCode || (order.orderNumber ? `#${order.orderNumber}` : `#${id.slice(-6)}`);
  
  // Tax calculations
  const isTaxExempt = order.isTaxExempt || false;
  const stateStr = order.shippingInfo?.state || "";
  const isGujarat = stateStr.toLowerCase().trim() === "gujarat" || stateStr.toLowerCase().trim() === "gj";

  // Timeline Progress mapping
  const timelineStages = [
    { label: "Confirmed", statusName: "Awaiting Processing" },
    { label: "Processing", statusName: "Processing" },
    { label: "Shipped", statusName: "Shipped" },
    { label: "Delivered", statusName: "Delivered" }
  ];

  const getActiveStageIndex = () => {
    const current = order.orderStatus || "";
    if (current === "Cancelled") return -1;
    if (current === "Delivered") return 3;
    if (current === "Shipped" || current === "Out for Delivery") return 2;
    if (current === "Processing" || current === "Ready For Pickup") return 1;
    return 0; // Confirmed
  };

  const activeStageIndex = getActiveStageIndex();

  return (
    <div className="min-h-screen bg-[#f4f6f8] px-4 py-8 mx-auto font-sans sm:px-6 lg:px-8 max-w-7xl sm:py-10 text-[#202223] relative">
      
      {/* 1. HEADER ROW */}
      <div className="flex flex-col gap-4 mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button 
            onClick={() => navigate("/admin/orders")} 
            className="flex items-center gap-2 mb-2 text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors"
          >
            <FaArrowLeft /> Back to Orders
          </button>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-black tracking-tight sm:text-3xl text-slate-900">
              Order {displayId}
            </h2>
            <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg border ${
              order.paymentStatus === "Paid" ? "bg-green-50 text-green-700 border-green-200" : "bg-amber-50 text-amber-700 border-amber-200"
            }`}>
              {order.paymentStatus}
            </span>
            <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
              {order.orderStatus}
            </span>
          </div>
          <p className="mt-1 text-sm font-medium text-slate-500 flex items-center gap-1.5">
            <FaRegCalendarAlt className="text-xs text-slate-400" />
            Placed on {new Date(order.createdAt).toLocaleString("en-IN", { dateStyle: 'medium', timeStyle: 'short' })}
          </p>
        </div>

        {/* Premium Redirection to Edit Page */}
        <div className="flex gap-2 self-start sm:self-center shrink-0">
          {["admin", "subadmin", "sales team"].includes(userRole) && order.productionStatus === "Not Sent" && (
            <button 
              onClick={handleSendToProduction}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg transition-colors shadow-md active:scale-95 cursor-pointer"
            >
              <FaBoxOpen size={14} /> Send to Production
            </button>
          )}
          <button 
            onClick={() => navigate(`/admin/orders/edit/${id}`)}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#2463d1] hover:bg-[#1c51b0] text-white text-sm font-bold rounded-lg transition-colors shadow-md active:scale-95 cursor-pointer"
          >
            <FaEdit size={14} /> Edit Order
          </button>
        </div>
      </div>

      {/* 2. ORDER PROGRESS TIMELINE BAR */}
      {order.orderStatus !== "Cancelled" && (
        <div className="bg-white border border-[#d5dce4] rounded-lg shadow-sm p-6 mb-8">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Fulfillment Progress</h3>
          <div className="relative flex flex-col md:flex-row justify-between items-center gap-8 md:gap-0">
            {/* Horizontal Line background */}
            <div className="absolute top-4 left-[10%] right-[10%] h-1 bg-gray-200 hidden md:block z-0">
              <div 
                className="h-full bg-blue-500 transition-all duration-500" 
                style={{ width: `${(activeStageIndex / 3) * 100}%` }}
              />
            </div>

            {timelineStages.map((stage, idx) => {
              const isCompleted = idx <= activeStageIndex;
              const isCurrent = idx === activeStageIndex;

              return (
                <div key={idx} className="flex flex-col items-center text-center z-10 md:w-1/4">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shadow-sm transition-all duration-300 border-2 ${
                    isCompleted 
                      ? "bg-blue-500 border-blue-500 text-white" 
                      : "bg-white border-gray-300 text-gray-400"
                  } ${isCurrent ? "ring-4 ring-blue-100" : ""}`}>
                    {isCompleted && idx < activeStageIndex ? <FaCheckCircle size={16} /> : idx + 1}
                  </div>
                  <span className={`mt-2 text-xs font-bold uppercase tracking-wider ${
                    isCompleted ? "text-slate-900" : "text-gray-400"
                  }`}>
                    {stage.label}
                  </span>
                  <span className="text-[10px] text-gray-400 mt-0.5">
                    {isCurrent ? "Active Stage" : isCompleted ? "Completed" : "Pending"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. MAIN 2-COLUMN GRID */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        
        {/* LEFT COLUMN: VIEW DETAIL CARDS */}
        <div className="space-y-8 lg:col-span-2">

          {/* CARD A: CUSTOMER OVERVIEW */}
          <div className="bg-white border border-[#d5dce4] rounded shadow-sm p-6">
            <h3 className="text-base font-bold text-gray-800 border-b pb-3 border-gray-100 mb-4 flex items-center gap-2">
              <FaUserAlt className="text-blue-500 text-xs" /> Customer Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase">Name</p>
                <p className="font-bold text-slate-800 mt-1">{order.shippingInfo?.fullName || "Guest"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase">Email Address</p>
                <p className="font-medium text-slate-800 mt-1">{order.user?.email || "No email linked"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase">Phone Number</p>
                <p className="font-bold text-slate-800 mt-1">{order.shippingInfo?.phone || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase">Company Name</p>
                <p className="font-medium text-slate-800 mt-1">{order.billingInfo?.companyName || "N/A"}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isTaxExempt ? 'bg-green-500' : 'bg-gray-400'}`}></span>
              <span className="text-xs font-semibold text-slate-600">
                Order Tax Exemption status: <span className="font-bold text-slate-800">{isTaxExempt ? "Exempted" : "Active (GST Collected)"}</span>
              </span>
            </div>
          </div>

          {/* CARD B: ORDER ITEMS */}
          <div className="bg-white border border-[#d5dce4] rounded shadow-sm p-6">
            <h3 className="text-base font-bold text-gray-800 border-b pb-3 border-gray-100 mb-4 flex items-center gap-2">
              <FaBoxOpen className="text-blue-500" /> Order Items ({order.items?.length || 0})
            </h3>
            
            <div className="divide-y divide-gray-100">
              {(order.items || []).map((item, idx) => {
                const variations = getVariations(item);

                return (
                  <div key={idx} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                    <div className="flex gap-4">
                      {/* Image */}
                      <div className="w-16 h-16 border bg-slate-50 border-slate-200 rounded-lg overflow-hidden flex-shrink-0 p-1">
                        <img src={getImageUrl(item.image)} alt={item.name} className="object-contain w-full h-full" />
                      </div>
                      
                      {/* Name / Details */}
                      <div>
                        <h4 className="text-sm font-bold text-slate-950 leading-tight">{item.name}</h4>
                        <p className="text-xs text-gray-500 mt-0.5">SKU: <span className="font-medium">{item.sku}</span> | Weight: {item.weightKg || 1}kg</p>
                        
                        {variations.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {variations.map((v, i) => (
                              <span key={i} className="px-2.5 py-0.5 text-[10px] font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded">
                                {v}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quantity & Calculations */}
                    <div className="flex items-center gap-6 self-end sm:self-center">
                      <div className="text-right">
                        <p className="text-xs text-gray-400 font-bold uppercase">Pricing</p>
                        <p className="text-sm text-slate-700 font-semibold mt-0.5">
                          {item.quantity} × {formatCurrency(item.unitPrice || item.price)}
                        </p>
                      </div>
                      <div className="text-right min-w-[80px]">
                        <p className="text-xs text-gray-400 font-bold uppercase">Line Total</p>
                        <p className="text-sm font-bold text-slate-900 mt-0.5">
                          {formatCurrency(Number(item.unitPrice || item.price) * Number(item.quantity))}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CARD C: SHIPPING AND DELIVERY INFO */}
          <div className="bg-white border border-[#d5dce4] rounded shadow-sm p-6">
            <h3 className="text-base font-bold text-gray-800 border-b pb-3 border-gray-100 mb-4 flex items-center gap-2">
              <FaTruck className="text-blue-500" /> Delivery Details
            </h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase mb-1">Courier Partner / Method</p>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-lg text-sm font-bold text-slate-800">
                  <FaTruck className="text-blue-500" />
                  {order.selectedShippingProvider || order.courierPartner || "Standard Shipping"}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 text-sm">
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase">Shipping Address</p>
                  <div className="mt-1.5 leading-relaxed text-slate-700 uppercase font-semibold">
                    <p className="font-bold text-slate-900">{order.shippingInfo?.fullName}</p>
                    <p>{order.shippingInfo?.address}</p>
                    <p>{order.shippingInfo?.city}, {order.shippingInfo?.state} - {order.shippingInfo?.pincode}</p>
                    <p>Phone: {order.shippingInfo?.phone}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase">Billing Address</p>
                  <div className="mt-1.5 leading-relaxed text-slate-700 uppercase font-semibold">
                    <p className="font-bold text-slate-900">{order.billingInfo?.fullName || order.shippingInfo?.fullName}</p>
                    <p>{order.billingInfo?.address || order.shippingInfo?.address}</p>
                    <p>{order.billingInfo?.city || order.shippingInfo?.city}, {order.billingInfo?.state || order.shippingInfo?.state} - {order.billingInfo?.pincode || order.shippingInfo?.pincode}</p>
                    <p>Phone: {order.billingInfo?.phone || order.shippingInfo?.phone}</p>
                  </div>
                </div>
              </div>

              {order.trackingId && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-xs text-blue-900 font-extrabold">AWB Tracking ID: <span className="font-mono text-sm">{order.trackingId}</span></p>
                    <p className="text-[10px] text-blue-700 mt-0.5">Status: {order.dispatchStatus} ({order.courierPartner})</p>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(order.trackingUrl || `https://track.courier.com/?awb=${order.trackingId}`);
                      toast.success("Tracking link copied to clipboard!");
                    }}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all active:scale-95 shadow-sm cursor-pointer"
                  >
                    Copy Link
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* CARD E: PAYMENT & VERIFICATION */}
          <div className="bg-white border border-[#d5dce4] rounded shadow-sm p-6">
            <h3 className="text-base font-bold text-gray-800 border-b pb-3 border-gray-100 mb-4 flex items-center gap-2">
              <FaFileInvoice className="text-blue-500" /> Payment & Verification
            </h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase mb-1">Selected Payment Method</p>
                <span className="px-3 py-1 text-xs font-bold tracking-wide uppercase rounded-md bg-slate-200 text-slate-700">
                  {order.paymentMethod === "MANUAL" ? "Manual Transfer (UPI)" : order.paymentMethod}
                </span>
              </div>

              {/* UTR Screenshot display for manual payments */}
              {(order.paymentMethod === "MANUAL TRANSFER" || order.paymentMethod === "MANUAL") && (
                <div className="p-4 bg-slate-50 rounded-xl space-y-4 border border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs text-gray-400 font-bold uppercase">UTR / Reference Number</p>
                      <p className="p-3 mt-1.5 font-mono text-sm font-bold border rounded-lg text-slate-900 bg-white border-slate-200">
                        {order.utrNumber || "Not Provided"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-400 font-bold uppercase mb-1.5">Payment Screenshot</p>
                      {order.paymentScreenshot ? (
                        <div className="relative w-32 h-32 border border-slate-200 rounded-lg overflow-hidden group">
                          <img src={getImageUrl(order.paymentScreenshot)} alt="Receipt" className="object-cover w-full h-full" />
                          <button 
                            onClick={() => setZoomScreenshot(true)}
                            className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity text-white text-[10px] font-bold"
                          >
                            Zoom Screen
                          </button>
                        </div>
                      ) : (
                        <div className="w-32 h-32 bg-gray-100 text-gray-400 flex items-center justify-center text-[10px] font-semibold border rounded-lg border-dashed">
                          No Screenshot
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Customer notes */}
          {order.orderNotes && (
            <div className="p-6 border bg-amber-50 border-amber-200 rounded-2xl">
              <h3 className="mb-2 text-xs font-black tracking-widest uppercase text-amber-800">Customer Notes</h3>
              <p className="font-semibold text-sm text-slate-700 leading-relaxed">{order.orderNotes}</p>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: STICKY FINANCIAL SUMMARY CARD */}
        <div className="space-y-8 lg:col-span-1">
          
          <div className="sticky top-6 space-y-6">

            {/* FINANCIAL CARD */}
            <div className="bg-white border border-[#d5dce4] rounded shadow-sm">
              <div className="p-5 border-b border-[#d5dce4]">
                <h3 className="text-[16px] font-semibold text-[#1a1a1a] mb-4">Summary</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-[14px] text-[#6d7175]">
                    <span>Subtotal</span>
                    <span className="text-[#202223] font-semibold">{formatCurrency(order.subtotalAmount)}</span>
                  </div>

                  {order.discount > 0 && (
                    <div className="flex justify-between text-[14px] text-red-500">
                      <span>Discount</span>
                      <span className="font-semibold">
                        - {formatCurrency(order.discountType === "PERCENTAGE" ? (order.subtotalAmount * order.discount) / 100 : order.discount)}
                      </span>
                    </div>
                  )}

                  {isTaxExempt ? (
                    <div className="flex justify-between text-[14px] text-[#6d7175]">
                      <span>Tax (GST)</span>
                      <span className="font-semibold text-green-600">Exempted</span>
                    </div>
                  ) : isGujarat ? (
                    <>
                      <div className="flex justify-between text-[14px] text-[#6d7175]">
                        <span>CGST (9%)</span>
                        <span className="text-[#202223] font-semibold">{formatCurrency(order.gstAmount / 2)}</span>
                      </div>
                      <div className="flex justify-between text-[14px] text-[#6d7175]">
                        <span>SGST (9%)</span>
                        <span className="text-[#202223] font-semibold">{formatCurrency(order.gstAmount / 2)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between text-[14px] text-[#6d7175]">
                      <span>IGST (18%)</span>
                      <span className="text-[#202223] font-semibold">{formatCurrency(order.gstAmount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-[14px] text-[#6d7175]">
                    <span>Shipping</span>
                    <span className="text-[#202223] font-semibold">{formatCurrency(order.shippingAmount)}</span>
                  </div>
                </div>
              </div>

              <div className="p-5 bg-gray-50/50 rounded-b-lg">
                <div className="flex justify-between items-center text-[16px] font-bold text-[#202223] mb-1">
                  <span>Grand Total</span>
                  <span className="text-lg text-blue-600 font-extrabold">{formatCurrency(order.totalAmount)}</span>
                </div>
                {!isTaxExempt && order.gstAmount > 0 && (
                  <p className="text-right text-[11px] text-gray-500 font-medium italic">
                    Incl. tax {formatCurrency(order.gstAmount)}
                  </p>
                )}
              </div>
            </div>

            {/* PRINT & GENERATION DETAILS CARD */}
            <div className="bg-white border border-[#d5dce4] rounded-lg p-5 space-y-4">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Document Management</h4>
              
              <div className="flex flex-col gap-2 text-xs">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-500">Generate Tax Invoice:</span>
                  <span className={`font-bold ${order.generateTaxInvoice !== false ? 'text-green-600' : 'text-slate-400'}`}>
                    {order.generateTaxInvoice !== false ? "YES" : "NO"}
                  </span>
                </div>
                
                <button 
                  onClick={() => window.open(`/admin/orders/tax-invoice/${id}`, '_blank')}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded text-center transition-colors border border-slate-200 mt-2"
                >
                  Create/View Tax Invoice
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* LIGHTBOX FOR SCREENSHOT ZOOM */}
      {zoomScreenshot && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 cursor-zoom-out"
          onClick={() => setZoomScreenshot(false)}
        >
          <div className="relative max-w-3xl max-h-[90vh]">
            <img 
              src={getImageUrl(order.paymentScreenshot)} 
              alt="UPI Screenshot Zoomed" 
              className="object-contain max-w-full max-h-[85vh] rounded shadow-2xl border border-white/10" 
            />
            <button 
              onClick={() => setZoomScreenshot(false)} 
              className="absolute -top-10 right-0 text-white hover:text-gray-300 text-sm font-bold flex items-center gap-1.5"
            >
              <FaTimes size={16} /> Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default OrderDetail;