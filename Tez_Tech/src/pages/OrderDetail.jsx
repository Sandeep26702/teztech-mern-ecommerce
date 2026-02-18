import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getOrderById } from "../services/orderService";

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    loadOrder();
  }, []);

  const loadOrder = async () => {
    const { data } = await getOrderById(id);
    setOrder(data.order);
  };

  if (!order)
    return <p className="text-center mt-5">Loading...</p>;

  return (
    <div className="container mt-4">
      <button className="btn btn-light mb-3" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <h3>Order Details</h3>

      <div className="border p-3 rounded mb-3">
        <p><strong>Order ID:</strong> {order._id}</p>
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
        <p><strong>Total:</strong> ₹ {order.totalAmount}</p>
        <p>
          <strong>Placed On:</strong>{" "}
          {new Date(order.createdAt).toLocaleString()}
        </p>
      </div>

      <h5>Shipping Address</h5>
      <div className="border p-3 rounded mb-3">
        <p>{order.shippingAddress.fullName}</p>
        <p>{order.shippingAddress.address}</p>
        <p>
          {order.shippingAddress.city} – {order.shippingAddress.pincode}
        </p>
        <p>📞 {order.shippingAddress.phone}</p>
      </div>

      <h5>Items</h5>
      <div className="border p-3 rounded">
        {order.items.map((item, index) => (
          <div key={index} className="d-flex mb-3">
            <img
              src={item.image}
              alt={item.name}
              width="70"
              className="me-3 rounded"
            />
            <div>
              <p className="mb-1">{item.name}</p>
              <small>
                ₹ {item.price} × {item.quantity}
              </small>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderDetail;