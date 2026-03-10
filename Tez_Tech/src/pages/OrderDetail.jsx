import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getOrderById } from "../services/orderService";
import { useLocation } from "react-router-dom";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminView = location.pathname.startsWith("/admin/");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const trackingSteps = ["Order Confirmed", "Processing", "Shipping", "Out for Delivery", "Delivered"];
  const getStepIndex = (status) => {
    if (status === "Confirmed") return 0;
    if (status === "Processing") return 1;
    if (status === "Shipping" || status === "Shipped") return 2;
    if (status === "Out for Delivery") return 3;
    if (status === "Delivered") return 4;
    return 0;
  };
  const currentStepIndex = getStepIndex(order?.orderStatus);

  useEffect(() => {
    const fetchOrderDetail = async () => {
      try {
        const data = await getOrderById(id);
        if (data.success) setOrder(data.order);
      } catch (error) {
        console.error("Detail Fetch Error:", error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchOrderDetail();
  }, [id]);

  const handlePrintLabel = () => {
    window.print();
  };

  if (loading) return <div className="pt-32 font-bold text-center">Loading order...</div>;

  if (!order) {
    return (
      <div className="pt-32 text-center">
        <h2 className="font-bold text-red-500">Order details not found.</h2>
        <button onClick={() => navigate("/orders")} className="px-4 py-2 mt-4 text-white bg-gray-900 rounded">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 pb-12 bg-gray-50 pt-24">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-label-only { display: block !important; }
          body { background: #fff; }
        }
      `}</style>

      <div className="max-w-6xl mx-auto space-y-4">
        <div className="no-print flex items-center justify-between">
          {isAdminView ? (
            <button onClick={() => navigate(-1)} className="px-3 py-2 text-sm font-semibold bg-white border rounded-lg">
              Back
            </button>
          ) : (
            <div />
          )}
          {isAdminView && (
            <button onClick={handlePrintLabel} className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg">
              Print Shipping Label
            </button>
          )}
        </div>

        {isAdminView && (
          <div className="print-label-only hidden p-4 bg-white border-2 border-dashed border-black">
            <p className="text-xs font-bold">SONANI ELECTRONICS - SHIPPING LABEL</p>
            <p className="mt-2 text-sm font-bold">Order: {order.orderCode || `#${order.orderNumber || order._id.slice(-8)}`}</p>
            <p className="text-sm">Name: {order.shippingInfo?.fullName}</p>
            <p className="text-sm">Phone: {order.shippingInfo?.phone}</p>
            <p className="text-sm">
              Address: {order.shippingInfo?.address}, {order.shippingInfo?.city}
              {order.shippingInfo?.state ? `, ${order.shippingInfo.state}` : ""} - {order.shippingInfo?.pincode}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
          <div className="bg-white border border-gray-200 rounded-2xl">
            <div className="p-4 border-b bg-slate-50 rounded-t-2xl">
              <h1 className="text-lg font-bold text-gray-900">
                {order.orderCode || `Order #${order.orderNumber || order._id.slice(-8)}`}
              </h1>
              <p className="text-xs text-gray-500">
                Placed on{" "}
                {new Date(order.createdAt).toLocaleString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>

            <div className="p-4 space-y-3">
              {(order.items || []).map((item, index) => (
                <div key={`${order._id}-${index}`} className="flex gap-3 p-3 border rounded-xl">
                  <img src={item.image} alt={item.name} className="object-contain w-20 h-20 border rounded-lg bg-white" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    <p className="text-xs text-gray-500">Unit: {formatCurrency(item.unitPrice || item.price)}</p>
                    <div className="mt-2">
                      <Link
                        to={`/products/${item.productId?._id || item.productId}`}
                        className="text-xs font-semibold text-blue-600 hover:underline no-print"
                      >
                        View Product Details
                      </Link>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-gray-900">{formatCurrency(item.lineTotal || item.price * item.quantity)}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-3 p-4 border-t md:grid-cols-2">
              <div className="p-3 border rounded-lg bg-gray-50">
                <h3 className="mb-2 text-xs font-bold tracking-wide text-gray-500 uppercase">Shipping Address</h3>
                <p className="text-sm font-bold text-gray-900">{order.shippingInfo?.fullName}</p>
                <p className="text-sm text-gray-700">
                  {order.shippingInfo?.address}, {order.shippingInfo?.city}
                  {order.shippingInfo?.state ? `, ${order.shippingInfo.state}` : ""} - {order.shippingInfo?.pincode}
                </p>
                <p className="mt-1 text-sm text-gray-700">Phone: {order.shippingInfo?.phone}</p>
              </div>
              <div className="p-3 border rounded-lg bg-gray-50 md:text-right">
                <h3 className="mb-2 text-xs font-bold tracking-wide text-gray-500 uppercase">Order Summary</h3>
                <p className="text-sm text-gray-700">Subtotal: {formatCurrency(order.subtotalAmount)}</p>
                <p className="text-sm text-gray-700">GST: {formatCurrency(order.gstAmount)}</p>
                <p className="mt-2 text-xl font-black text-orange-600">{formatCurrency(order.totalAmount)}</p>
                <div className="flex flex-wrap gap-2 mt-2 md:justify-end">
                  <span className={`px-2 py-1 text-xs font-bold rounded ${order.paymentMethod === "ONLINE" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-800"}`}>
                    {order.paymentMethod === "ONLINE" ? "ONLINE PAYMENT" : "CASH ON DELIVERY"}
                  </span>
                  <span className="px-2 py-1 text-xs font-bold text-blue-700 bg-blue-100 rounded">
                    {order.paymentStatus}
                  </span>
                </div>
                <p className="mt-2 text-xs font-semibold text-gray-600">{order.orderStatus}</p>
              </div>
            </div>
          </div>

          <aside className="no-print h-fit bg-white border border-gray-200 rounded-2xl p-4 lg:sticky lg:top-24">
            {order.orderStatus === "Delivered" ? (
              <div>
                <h3 className="text-sm font-bold text-gray-900">Delivery Status</h3>
                <p className="mt-2 text-sm font-semibold text-green-700">
                  Delivered on{" "}
                  {new Date(order.deliveredAt || order.updatedAt || order.createdAt).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
            ) : (
              <>
                <h3 className="text-sm font-bold text-gray-900">Track Your Order</h3>
                <p className="mt-1 text-xs text-gray-500">Order Confirmed to Delivered</p>
                <div className="mt-4 space-y-4">
                  {trackingSteps.map((step, index) => {
                    const done = currentStepIndex >= index;
                    const current = currentStepIndex === index;
                    return (
                      <div key={step} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <span className={`w-3.5 h-3.5 rounded-full ${done ? "bg-green-500" : "bg-gray-300"}`} />
                          {index < trackingSteps.length - 1 && (
                            <span className={`w-0.5 h-8 ${done ? "bg-green-400" : "bg-gray-200"}`} />
                          )}
                        </div>
                        <div>
                          <p className={`text-sm font-semibold ${done ? "text-gray-900" : "text-gray-500"}`}>{step}</p>
                          {current && <p className="text-xs text-green-600">Current status</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
            {(order.orderStatus === "Cancelled" || order.orderStatus === "Returned") && (
              <p className="mt-3 text-xs font-semibold text-red-600">Order {order.orderStatus.toLowerCase()}</p>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
