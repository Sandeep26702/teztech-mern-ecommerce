import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaDownload, FaCheckCircle } from "react-icons/fa";
import { getOrderById } from "../services/orderService"; 
import TaxInvoice from "../admin/components/TaxInvoice";
import Skeleton from "../components/skeletons/Skeleton";

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

  const getTrackingInfo = (status) => {
    if (!status) return { steps: [], currentIndex: 0, isCancelled: false };
    
    const isCancelled = ["Cancelled", "Delivery Canceled", "Returned"].includes(status);
    
    let steps = [
      { label: "Order Placed", key: "Awaiting Processing" },
      { label: "Processing", key: "Processing" },
      { label: "Shipped", key: "Shipped" },
      { label: "Out for Delivery", key: "Out For Delivery" },
      { label: "Delivered", key: "Delivered" },
    ];

    if (isCancelled) {
      steps = [
        { label: "Order Placed", key: "Awaiting Processing" },
        { label: "Cancelled", key: status },
      ];
    }

    let currentIndex = 0;
    
    if (status === "Awaiting Processing") currentIndex = 0;
    else if (status === "Processing") currentIndex = 1;
    else if (status === "Ready For Pickup" || status === "Shipped") currentIndex = 2;
    else if (status === "Out For Delivery") currentIndex = 3;
    else if (status === "Delivered") currentIndex = 4;
    else if (isCancelled) currentIndex = 1;

    return { steps, currentIndex, isCancelled };
  };

  const { steps: trackingSteps, currentIndex: currentStep, isCancelled } = getTrackingInfo(order?.orderStatus);

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
      <div className="min-h-screen pt-24 pb-16 bg-slate-50">
        <div className="max-w-5xl px-4 mx-auto space-y-6">
          <Skeleton className="h-8 w-48 rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <Skeleton className="h-40 w-full rounded-2xl" />
              <Skeleton className="h-60 w-full rounded-2xl" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-48 w-full rounded-2xl" />
              <Skeleton className="h-32 w-full rounded-2xl" />
            </div>
          </div>
        </div>
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

  // 🔥 THE FIX: Subtotal is calculated by subtracting shipping amount from total to ensure mathematical alignment.
  const displaySubtotal = (order.totalAmount || 0) - (order.shippingAmount || 0);
  const totalGstAmount = order.gstAmount || 0;

  return (
    <>
      <div className="hidden print:block absolute top-0 left-0 w-full bg-white z-[9999]">
        <TaxInvoice order={order} />
      </div>
      <div className="min-h-screen px-4 pt-24 pb-12 font-sans bg-slate-50 sm:px-6 lg:px-8 print:hidden">
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
          <button onClick={() => {
            setTimeout(() => {
              window.print();
            }, 100);
          }} className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold text-slate-700 bg-white border rounded-xl hover:bg-slate-100 shadow-sm transition-colors">
            <FaDownload /> Download Invoice
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            
            <div className="p-6 bg-white border shadow-sm border-slate-200 rounded-2xl">
              <h2 className="mb-6 text-lg font-bold text-slate-900">Track Order</h2>
              <div className="relative flex items-center justify-between w-full">
                <div className="absolute left-0 w-full h-1 -translate-y-1/2 rounded-full bg-slate-100 top-1/2"></div>
                <div className={`absolute left-0 h-1 transition-all duration-500 -translate-y-1/2 rounded-full top-1/2 ${isCancelled ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${trackingSteps.length > 1 ? (currentStep / (trackingSteps.length - 1)) * 100 : 100}%` }}></div>
                
                {trackingSteps.map((step, index) => {
                  const isCompleted = index <= currentStep;
                  const isCurrentCancelled = isCancelled && index === currentStep;
                  
                  return (
                    <div key={step.label} className="relative flex flex-col items-center group">
                      <div className={`w-8 h-8 flex items-center justify-center rounded-full border-2 z-10 transition-all duration-300 ${
                        isCurrentCancelled ? 'bg-red-500 border-red-500 text-white' : 
                        isCompleted ? 'bg-green-500 border-green-500 text-white' : 
                        'bg-white border-slate-200 text-slate-300'
                      }`}>
                        {isCurrentCancelled ? (
                          <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                        ) : isCompleted ? (
                          <FaCheckCircle className="w-4 h-4" />
                        ) : (
                          <div className="w-2.5 h-2.5 rounded-full bg-slate-200"></div>
                        )}
                      </div>
                      <span className={`absolute top-10 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-center w-24 -ml-8 ${
                        isCurrentCancelled ? 'text-red-600' :
                        isCompleted ? 'text-slate-800' : 'text-slate-400'
                      }`}>
                        {step.label}
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
                  {/* 🔥 Subtotal update location */}
                  <span className="text-slate-900">{formatCurrency(displaySubtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Shipping {order.courierPartner ? `(${order.courierPartner})` : ""}</span>
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
                  order.paymentMethod === "MANUAL TRANSFER" ? "bg-blue-100 text-blue-700" :
                  order.paymentMethod === "STORE_PICKUP" ? "bg-purple-100 text-purple-700" :
                  "bg-yellow-100 text-yellow-800"
                }`}>
                  {order.paymentMethod === "ONLINE" ? "Online Payment" : 
                   order.paymentMethod === "MANUAL TRANSFER" ? "Manual Transfer (UPI)" : 
                   order.paymentMethod === "STORE_PICKUP" ? "Store Pickup" : "Cash on Delivery"}
                </span>
                <span className={`ml-2 inline-block px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-md ${
                  order.paymentStatus === "Paid" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                }`}>
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
    </>
  );
};

export default ClientOrderDetail;