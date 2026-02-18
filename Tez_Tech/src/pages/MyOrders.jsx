import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getMyOrders,
  cancelOrder,
} from "../services/orderService";

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    const { data } = await getMyOrders();
    setOrders(data.orders);
  };

  const handleCancel = async (orderId) => {
    const confirm = window.confirm(
      "Are you sure you want to cancel this order?"
    );
    if (!confirm) return;

    await cancelOrder(orderId);
    loadOrders(); // 🔄 refresh orders
  };

  if (orders.length === 0)
    return <h4 className="text-center mt-4">No orders found</h4>;

  return (
    <div className="container mt-4">
      <h3>My Orders</h3>

      {orders.map((order) => (
        <div key={order._id} className="border p-3 mb-4 rounded">
          <p>
            <strong>Order ID:</strong> {order._id}
          </p>

          <p>
            <strong>Status:</strong>{" "}
            <span
              className={`badge ${
                order.status === "Cancelled"
                  ? "bg-danger"
                  : order.status === "Delivered"
                  ? "bg-success"
                  : "bg-warning text-dark"
              }`}
            >
              {order.status}
            </span>
          </p>

          <p>
            <strong>Total:</strong> ₹ {order.totalAmount}
          </p>

          <p>
            <strong>Placed On:</strong>{" "}
            {new Date(order.createdAt).toLocaleDateString()}
          </p>

          <hr />

          {order.items.map((item, index) => (
            <div key={index} className="d-flex mb-2">
              <img
                src={item.image}
                alt={item.name}
                width="60"
                className="me-3 rounded"
              />
              <div>
                <p className="mb-0">{item.name}</p>
                <small>
                  ₹ {item.price} × {item.quantity}
                </small>
              </div>
            </div>
          ))}

          {/* 🔍 VIEW DETAILS */}
          <button
            className="btn btn-outline-dark btn-sm mt-2 me-2"
            onClick={() => navigate(`/orders/${order._id}`)}
          >
            View Details
          </button>

          {/* ❌ CANCEL ORDER */}
          {order.status === "Pending" && (
            <button
              className="btn btn-danger btn-sm mt-2"
              onClick={() => handleCancel(order._id)}
            >
              Cancel Order
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default MyOrders;