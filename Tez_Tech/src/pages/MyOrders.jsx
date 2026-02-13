import { useEffect, useState } from "react";
import { getMyOrders } from "../services/orderService";

const MyOrders = () => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    const { data } = await getMyOrders();
    setOrders(data.orders);
  };

  if (orders.length === 0)
    return <h4 className="text-center mt-4">No orders found</h4>;

  return (
    <div className="container mt-4">
      <h3>My Orders</h3>

      {orders.map((order) => (
        <div key={order._id} className="border p-3 mb-4">
          <p>
            <strong>Order ID:</strong> {order._id}
          </p>

          <p>
            <strong>Status:</strong>{" "}
            <span className="badge bg-warning text-dark">
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
        </div>
      ))}
    </div>
  );
};

export default MyOrders;
