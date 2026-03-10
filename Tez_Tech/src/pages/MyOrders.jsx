import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const { api } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const getMyOrders = async () => {
      try {
        const { data } = await api.get("/orders/my-orders");
        if (data.success) setOrders(data.orders || []);
      } catch (err) {
        console.error("Fetch Orders Error:", err);
      }
    };
    getMyOrders();
  }, [api]);

  return (
    <div className="min-h-screen pt-24 pb-16 bg-slate-50">
      <div className="max-w-5xl px-4 mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">My Orders</h1>
          <p className="text-sm text-slate-500">Click any order to open full details.</p>
        </div>

        {orders.length === 0 ? (
          <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl">
            <p className="font-medium text-slate-500">No orders yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const firstItem = (order.items || [])[0];
              const previewImage = firstItem?.image || "https://placehold.co/100x100?text=Order";
              return (
                <button
                  key={order._id}
                  onClick={() => navigate(`/orders/${order._id}`)}
                  className="w-full text-left bg-white border border-slate-200 rounded-xl p-3 hover:shadow-sm transition"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={previewImage}
                      alt={firstItem?.name || "Order item"}
                      className="object-contain w-20 h-20 border rounded-lg bg-slate-50"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900">
                        {order.orderCode || `#${order.orderNumber || order._id.slice(-8)}`}
                      </p>
                      <p className="mt-1 text-sm text-slate-700 truncate">
                        {firstItem?.name || "Product"} {order.items?.length > 1 ? `+ ${order.items.length - 1} more` : ""}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {new Date(order.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900">{formatCurrency(order.totalAmount)}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-600">{order.orderStatus}</p>
                      <p className={`mt-1 inline-block px-2 py-0.5 text-[11px] font-bold rounded ${order.paymentMethod === "ONLINE" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-800"}`}>
                        {order.paymentMethod === "ONLINE" ? "ONLINE" : "COD"}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrders;
