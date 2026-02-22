import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getOrderById } from "../services/orderService";
import { FaArrowLeft, FaMapMarkerAlt, FaBoxOpen, FaReceipt, FaCalendarAlt } from "react-icons/fa";

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const { data } = await getOrderById(id);
      if (data && data.order) {
        setOrder(data.order);
      }
    } catch (error) {
      console.error("Failed to load order:", error);
    } finally {
      setLoading(false);
    }
  };

  // Status Styling Logic
  const getStatusStyle = (status) => {
    switch (status) {
      case "Delivered":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "Shipped":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-200"; // Pending
    }
  };

  // Loading Skeleton
  if (loading) {
    return (
      <div className="max-w-5xl p-4 mx-auto sm:p-6 lg:p-8 animate-pulse">
        <div className="w-24 h-6 mb-6 bg-gray-200 rounded"></div>
        <div className="h-32 mb-6 bg-gray-200 rounded-2xl"></div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="h-64 bg-gray-200 md:col-span-2 rounded-2xl"></div>
          <div className="h-64 bg-gray-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  // Not Found State
  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <h2 className="mb-2 text-2xl font-bold text-gray-800">Order Not Found</h2>
        <p className="mb-4 text-gray-500">We couldn't find the details for this order.</p>
        <button onClick={() => navigate(-1)} className="px-4 py-2 text-white bg-orange-600 rounded-lg hover:bg-orange-700">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl p-4 mx-auto font-sans text-gray-800 sm:p-6 lg:p-8">
      
      {/* Back Button */}
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center gap-2 mb-6 text-sm font-semibold text-gray-500 transition-colors hover:text-orange-600"
      >
        <FaArrowLeft /> Back to Orders
      </button>

      {/* Header Card */}
      <div className="flex flex-col items-start justify-between gap-4 p-6 mb-8 bg-white border border-gray-100 shadow-sm rounded-2xl md:flex-row md:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold text-gray-900">
            Order <span className="text-orange-600">#{order._id.slice(-8).toUpperCase()}</span>
          </h1>
          <p className="flex items-center gap-1 mt-1 text-sm text-gray-500">
            <FaCalendarAlt className="text-gray-400" />
            Placed on {new Date(order.createdAt).toLocaleDateString("en-IN", {
              day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
            })}
          </p>
        </div>
        <div className={`px-4 py-1.5 rounded-full border text-sm font-bold tracking-wide ${getStatusStyle(order.status)}`}>
          {order.status}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        
        {/* Left Col: Items List */}
        <div className="space-y-6 lg:col-span-2">
          <h2 className="flex items-center gap-2 mb-4 text-lg font-bold text-gray-900">
            <FaBoxOpen className="text-orange-500" /> Items in your Order
          </h2>
          
          <div className="overflow-hidden bg-white border border-gray-100 shadow-sm rounded-2xl">
            <ul className="divide-y divide-gray-100">
              {order.items.map((item, index) => (
                <li key={index} className="flex items-center gap-4 p-4 transition-colors sm:p-6 hover:bg-gray-50">
                  {/* Item Image */}
                  <div className="flex-shrink-0 w-20 h-20 overflow-hidden bg-gray-100 border border-gray-200 sm:w-24 sm:h-24 rounded-xl">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="object-cover w-full h-full" />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full text-gray-400">
                        <FaBoxOpen className="text-2xl opacity-50" />
                      </div>
                    )}
                  </div>

                  {/* Item Details */}
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-gray-900 sm:text-lg line-clamp-2">{item.name}</h3>
                    <p className="mt-1 text-sm text-gray-500">Qty: {item.quantity}</p>
                  </div>

                  {/* Item Price */}
                  <div className="text-right">
                    <p className="text-lg font-extrabold text-gray-900">
                      ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      ₹{item.price.toLocaleString("en-IN")} each
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Col: Address & Summary */}
        <div className="space-y-6">
          
          {/* Shipping Address */}
          <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
            <h2 className="flex items-center gap-2 mb-4 text-lg font-bold text-gray-900">
              <FaMapMarkerAlt className="text-orange-500" /> Shipping Address
            </h2>
            <div className="space-y-1 text-sm text-gray-600">
              <p className="text-base font-bold text-gray-900">{order.shippingAddress.fullName}</p>
              <p className="mt-2">{order.shippingAddress.address}</p>
              <p>{order.shippingAddress.city} – {order.shippingAddress.pincode}</p>
              <p className="pt-2 mt-2 border-t border-gray-100">
                <span className="text-gray-400">Phone:</span> {order.shippingAddress.phone}
              </p>
            </div>
          </div>

          {/* Order Summary */}
          <div className="p-6 border border-gray-200 shadow-sm bg-gray-50 rounded-2xl">
            <h2 className="flex items-center gap-2 mb-4 text-lg font-bold text-gray-900">
              <FaReceipt className="text-orange-500" /> Order Summary
            </h2>
            
            <div className="mb-4 space-y-3 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Payment Method</span>
                <span className="font-semibold text-gray-900">{order.paymentMethod || "COD"}</span>
              </div>
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-gray-900">₹{order.totalAmount?.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="font-semibold text-emerald-600">Free</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <span className="text-base font-bold text-gray-900">Total Paid</span>
              <span className="text-2xl font-extrabold text-orange-600">
                ₹{order.totalAmount?.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default OrderDetail;