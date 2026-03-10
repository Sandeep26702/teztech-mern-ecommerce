import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaSearch, FaSyncAlt } from "react-icons/fa";
import { fetchAdminOrders, updateAdminOrderStatus } from "../../services/orderService";

const ORDER_STATUS_OPTIONS = ["Confirmed", "Processing", "Shipping", "Out for Delivery", "Delivered", "Cancelled", "Returned"];
const PAYMENT_STATUS_OPTIONS = ["Pending", "Paid", "Failed", "Refunded"];

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));

const getOrderIdentity = (order) => order.orderCode || `#${order.orderNumber || order._id.slice(-8)}`;

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await fetchAdminOrders();
      if (data.success) setOrders(data.orders || []);
    } catch (error) {
      console.error(error);
      alert("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleUpdateStatus = async (orderId, patch) => {
    try {
      setUpdatingId(orderId);
      const data = await updateAdminOrderStatus(orderId, patch);
      if (!data.success) return;
      setOrders((prev) =>
        prev.map((order) =>
          order._id === orderId
            ? {
                ...order,
                orderStatus: patch.orderStatus || order.orderStatus,
                paymentStatus: patch.paymentStatus || order.paymentStatus,
              }
            : order
        )
      );
    } catch (error) {
      console.error(error);
      alert("Status update failed");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((order) => {
      if (!q) return true;
      const text = [
        getOrderIdentity(order),
        order.user?.name || "",
        order.user?.email || "",
        order.shippingInfo?.phone || "",
      ]
        .join(" ")
        .toLowerCase();
      return text.includes(q);
    });
  }, [orders, search]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
            <p className="mt-1 text-sm text-gray-600">Order image card pe click karke full details khol sakte ho.</p>
          </div>
          <button
            onClick={loadOrders}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100"
          >
            <FaSyncAlt /> Refresh
          </button>
        </div>

        <div className="relative mt-4">
          <FaSearch className="absolute text-gray-400 left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order id, customer, email, phone"
            className="w-full py-2.5 pl-10 pr-3 text-sm border border-gray-200 rounded-xl"
          />
        </div>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="p-6 text-sm text-center text-gray-500 bg-white border border-gray-200 rounded-xl">Loading orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-6 text-sm text-center text-gray-500 bg-white border border-gray-200 rounded-xl">No orders found.</div>
        ) : (
          filteredOrders.map((order) => {
            const firstItem = (order.items || [])[0];
            return (
              <div key={order._id} className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row">
                  <button
                    onClick={() => navigate(`/admin/orders/${order._id}`)}
                    className="flex items-start gap-3 text-left flex-1"
                  >
                    <img
                      src={firstItem?.image || "https://placehold.co/100x100?text=Order"}
                      alt={firstItem?.name || "Order"}
                      className="object-contain w-24 h-24 border rounded-lg bg-slate-50"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900">{getOrderIdentity(order)}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(order.createdAt).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <p className="mt-1 text-sm text-gray-800 truncate">
                        {firstItem?.name || "Product"} {order.items?.length > 1 ? `+ ${order.items.length - 1} more` : ""}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {order.shippingInfo?.fullName} | {order.shippingInfo?.phone}
                      </p>
                      {firstItem?.productId && (
                        <Link
                          to={`/products/${firstItem.productId?._id || firstItem.productId}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-block mt-2 text-xs font-semibold text-blue-600 hover:underline"
                        >
                          Open Product Details
                        </Link>
                      )}
                    </div>
                  </button>

                  <div className="w-full space-y-2 lg:w-72">
                    <p className="text-lg font-black text-orange-600">{formatCurrency(order.totalAmount)}</p>
                    <div className="flex flex-wrap gap-2">
                      <span className={`px-2 py-1 text-xs font-bold rounded ${order.paymentMethod === "ONLINE" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-800"}`}>
                        {order.paymentMethod === "ONLINE" ? "ONLINE PAYMENT" : "CASH ON DELIVERY"}
                      </span>
                      <span className="px-2 py-1 text-xs font-bold text-blue-700 bg-blue-100 rounded">
                        {order.paymentStatus}
                      </span>
                    </div>
                    <select
                      value={order.paymentStatus}
                      onChange={(e) => handleUpdateStatus(order._id, { paymentStatus: e.target.value })}
                      disabled={updatingId === order._id}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
                    >
                      {PAYMENT_STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          Payment: {status}
                        </option>
                      ))}
                    </select>
                    <select
                      value={order.orderStatus}
                      onChange={(e) => handleUpdateStatus(order._id, { orderStatus: e.target.value })}
                      disabled={updatingId === order._id}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
                    >
                      {ORDER_STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          Order: {status}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AdminOrders;
