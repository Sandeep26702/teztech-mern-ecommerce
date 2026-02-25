import React, { useEffect, useState } from 'react';
import { fetchAdminOrders, updateAdminOrderStatus } from '../../services/orderService';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const data = await fetchAdminOrders();
      if (data.success) setOrders(data.orders);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      // API call to update status
      const data = await updateAdminOrderStatus(orderId, { orderStatus: newStatus });
      if (data.success) {
        // UI me turant update dikhane ke liye
        setOrders(orders.map(order => order._id === orderId ? { ...order, orderStatus: newStatus } : order));
      }
    } catch (error) {
      alert("Status update failed");
    }
  };

  if (loading) return <div className="p-6 font-bold text-center">Loading Orders...</div>;

  return (
    <div className="min-h-screen p-4 md:p-6 bg-gray-50">
      <h2 className="mb-6 text-2xl font-bold text-gray-800">Order Management</h2>
      
      <div className="overflow-hidden bg-white rounded-lg shadow">
        {/* Mobile responsive table wrapper */}
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="text-white bg-gray-800">
              <tr>
                <th className="p-4 font-medium">Order ID</th>
                <th className="p-4 font-medium">Customer Details</th>
                <th className="p-4 font-medium">Total Amount</th>
                <th className="p-4 font-medium">Payment</th>
                <th className="p-4 font-medium">Status Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order._id} className="hover:bg-gray-50">
                  <td className="p-4 text-sm text-gray-600">{order._id.slice(-6)}</td>
                  <td className="p-4">
                    <p className="font-semibold">{order.shippingInfo?.fullName || 'N/A'}</p>
                    <p className="text-xs text-gray-500">{order.shippingInfo?.city} - {order.shippingInfo?.phone}</p>
                  </td>
                  <td className="p-4 font-bold text-gray-700">₹{order.totalAmount}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${order.paymentMethod === 'ONLINE' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {order.paymentMethod} ({order.paymentStatus})
                    </span>
                  </td>
                  <td className="p-4">
                    {/* Status Update Dropdown */}
                    <select 
                      value={order.orderStatus}
                      onChange={(e) => handleStatusChange(order._id, e.target.value)}
                      className="p-1 text-sm border rounded outline-none cursor-pointer focus:ring focus:ring-blue-200"
                    >
                      <option value="Processing">Processing</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr><td colSpan="5" className="p-6 text-center text-gray-500">No orders found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminOrders;