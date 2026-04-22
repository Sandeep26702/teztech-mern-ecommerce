import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaDownload, FaCheckCircle } from "react-icons/fa";
import { getOrderById } from "../services/orderService"; 

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));

const getImageUrl = (path) => {
  if (!path) return "https://placehold.co/100x100?text=No+Image";
  if (path.startsWith("http")) return path;
  const cleanPath = path.replace(/\\/g, "/");
  return `https://sonani-backend.onrender.com${cleanPath.startsWith("/") ? "" : "/"}${cleanPath}`;
};

const getVariations = (item) => {
  let vars = [];

  const variantCombo = item?.variant?.combination || item?.selectedVariant?.combination;
  if (variantCombo) {
    Object.entries(variantCombo).forEach(([k, v]) => vars.push(`${k}: ${v}`));
  }

  const attrs = item?.attributes || item?.selectedAttributes;
  if (attrs) {
    Object.entries(attrs).forEach(([k, v]) => {
      const val = typeof v === 'object' && v !== null ? v.value : v;
      if (val) vars.push(`${k}: ${val}`);
    });
  }

  if (item?.selectedOptions && item.selectedOptions.length > 0) {
    item.selectedOptions.forEach((opt) => vars.push(`${opt.fieldLabel || "Option"}: ${opt.value}`));
  }
  
  if (item?.selectedCustomFields && typeof item.selectedCustomFields === 'object') {
    Object.entries(item.selectedCustomFields).forEach(([key, val]) => {
      if (key.startsWith("_")) return; 
      if (val && !Array.isArray(val)) vars.push(`${key}: ${val}`);
      if (val && Array.isArray(val) && val.length > 0) vars.push(`${key}: ${val.join(", ")}`);
    });
  }

  if (item?.size) vars.push(`Size: ${item.size}`);
  if (item?.color) vars.push(`Color: ${item.color}`);

  return [...new Set(vars)];
};

const ClientOrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const trackingSteps = ["Confirmed", "Processing", "Shipping", "Out for Delivery", "Delivered"];
  const currentStep = trackingSteps.indexOf(order?.orderStatus) !== -1 ? trackingSteps.indexOf(order?.orderStatus) : 0;

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const data = await getOrderById(id);
        if (data.success) setOrder(data.order);
      } catch (error) {
        console.error("Fetch Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="w-10 h-10 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <h2 className="text-2xl font-bold text-slate-800">Order Not Found</h2>
        <button onClick={() => navigate("/orders")} className="px-6 py-3 mt-4 font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700">
          Go to My Orders
        </button>
      </div>
    );
  }

  // 🔥 THE FIX: Subtotal humesha Total me se shipping hata kar dikhayenge, taaki math exactly match ho customer ke liye.
  const displaySubtotal = (order.totalAmount || 0) - (order.shippingAmount || 0);
  const totalGstAmount = order.gstAmount || 0;

  return (
    <div className="min-h-screen px-4 pt-24 pb-12 font-sans bg-slate-50 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <button onClick={() => navigate("/orders")} className="flex items-center gap-2 mb-2 text-sm font-semibold text-slate-500 hover:text-blue-600">
              <FaArrowLeft /> Back to Orders
            </button>
            <h1 className="text-2xl font-black text-slate-900 md:text-3xl">
              Order {order.orderCode || `#${order.orderNumber}`}
            </h1>
            <p className="text-sm font-medium text-slate-500">
              Placed on {new Date(order.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
          <button className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold text-slate-700 bg-white border rounded-xl hover:bg-slate-100 shadow-sm transition-colors">
            <FaDownload /> Download Invoice
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            
            <div className="p-6 bg-white border shadow-sm border-slate-200 rounded-2xl">
              <h2 className="mb-6 text-lg font-bold text-slate-900">Track Order</h2>
              <div className="relative flex items-center justify-between w-full">
                <div className="absolute left-0 w-full h-1 -translate-y-1/2 rounded-full bg-slate-100 top-1/2"></div>
                <div className="absolute left-0 h-1 transition-all duration-500 -translate-y-1/2 bg-green-500 rounded-full top-1/2" style={{ width: `${(currentStep / (trackingSteps.length - 1)) * 100}%` }}></div>
                
                {trackingSteps.map((step, index) => {
                  const isCompleted = index <= currentStep;
                  return (
                    <div key={step} className="relative flex flex-col items-center group">
                      <div className={`w-8 h-8 flex items-center justify-center rounded-full border-2 z-10 transition-all duration-300 ${isCompleted ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-slate-200 text-slate-300'}`}>
                        {isCompleted ? <FaCheckCircle className="w-4 h-4" /> : <div className="w-2.5 h-2.5 rounded-full bg-slate-200"></div>}
                      </div>
                      <span className={`absolute top-10 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-center w-20 -ml-6 ${isCompleted ? 'text-slate-800' : 'text-slate-400'}`}>
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="h-10"></div>
            </div>

            <div className="overflow-hidden bg-white border shadow-sm border-slate-200 rounded-2xl">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <h2 className="text-lg font-bold text-slate-900">Items in this Order</h2>
              </div>
              <div className="p-6 space-y-6">
                {(order.items || []).map((item, index) => {
                  const variations = getVariations(item);
                  return (
                    <div key={index} className="flex flex-col gap-6 pb-6 border-b sm:flex-row border-slate-100 last:border-0 last:pb-0">
                      <div className="flex-shrink-0 w-24 h-24 p-2 border sm:w-28 sm:h-28 bg-slate-50 rounded-xl">
                        <img src={getImageUrl(item.image)} alt={item.name} className="object-contain w-full h-full mix-blend-multiply" />
                      </div>
                      <div className="flex flex-col justify-center flex-1">
                        <h3 className="text-base font-bold leading-tight sm:text-lg text-slate-900">{item.name}</h3>
                        <p className="mt-1 text-sm font-medium text-slate-500">Qty: <span className="text-slate-800">{item.quantity}</span></p>
                        
                        {variations.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {variations.map((v, i) => (
                              <span key={i} className="px-2.5 py-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-600 bg-slate-100 border rounded-md">
                                {v}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col justify-center sm:text-right">
                        <p className="text-lg font-black text-slate-900">{formatCurrency(item.price * item.quantity)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-6 bg-white border shadow-sm border-slate-200 rounded-2xl">
              <h2 className="mb-4 text-lg font-bold text-slate-900">Order Summary</h2>
              <div className="space-y-3 text-sm font-medium">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  {/* 🔥 Update yahan hai */}
                  <span className="text-slate-900">{formatCurrency(displaySubtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Shipping</span>
                  <span className={order.shippingAmount > 0 ? "text-slate-900" : "text-green-600"}>
                    {order.shippingAmount > 0 ? formatCurrency(order.shippingAmount) : "FREE"}
                  </span>
                </div>
                {/* Optional info message for clarity */}
                {totalGstAmount > 0 && (
                  <div className="flex justify-between pb-4 text-xs italic border-b border-dashed text-slate-400">
                    <span>* Total includes GST of {formatCurrency(totalGstAmount)}</span>
                  </div>
                )}
                <div className="flex items-end justify-between pt-4 mt-2">
                  <span className="text-base font-bold text-slate-900">Total</span>
                  <span className="text-2xl font-black text-blue-600">{formatCurrency(order.totalAmount)}</span>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white border shadow-sm border-slate-200 rounded-2xl">
              <h2 className="mb-4 text-sm font-bold tracking-widest uppercase text-slate-400">Payment Details</h2>
              <div className="mb-4">
                <span className={`inline-block px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-md ${
                  order.paymentMethod === "ONLINE" ? "bg-green-100 text-green-700" :
                  order.paymentMethod === "MANUAL" ? "bg-blue-100 text-blue-700" :
                  order.paymentMethod === "STORE_PICKUP" ? "bg-purple-100 text-purple-700" :
                  "bg-yellow-100 text-yellow-800"
                }`}>
                  {order.paymentMethod === "ONLINE" ? "Online Payment" : 
                   order.paymentMethod === "MANUAL" ? "Manual Transfer (UPI)" : 
                   order.paymentMethod === "STORE_PICKUP" ? "Store Pickup" : "Cash on Delivery"}
                </span>
                <span className="ml-2 inline-block px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-md bg-slate-100 text-slate-700">
                  {order.paymentStatus}
                </span>
              </div>
              {order.utrNumber && (
                <div className="mb-4">
                  <p className="mb-1 text-xs font-semibold text-slate-500">UTR / Ref Number</p>
                  <p className="p-2 font-mono text-sm font-bold border rounded-lg text-slate-900 bg-slate-50">{order.utrNumber}</p>
                </div>
              )}
            </div>

            <div className="p-6 bg-white border shadow-sm border-slate-200 rounded-2xl">
              <h2 className="mb-4 text-sm font-bold tracking-widest uppercase text-slate-400">Shipping Address</h2>
              <p className="text-base font-bold text-slate-900">{order.shippingInfo?.fullName}</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {order.shippingInfo?.address}<br/>
                {order.shippingInfo?.city}, {order.shippingInfo?.state ? `${order.shippingInfo.state}, ` : ""}{order.shippingInfo?.pincode}
              </p>
              <div className="flex items-center gap-2 pt-4 mt-4 border-t border-slate-100">
                <p className="text-sm font-bold text-slate-800">Phone: {order.shippingInfo?.phone}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientOrderDetail;