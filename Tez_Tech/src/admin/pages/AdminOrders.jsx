import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { FaTrash, FaSearch, FaBoxOpen, FaFilter, FaEye } from "react-icons/fa";

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const token = localStorage.getItem("token");

  // API Call: Backend mein GET /api/admin/orders route zaroor bana lena!
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get("http://localhost:5000/api/admin/orders", config);
      if (res.data.success) {
        // Fallback added here to prevent undefined error
        setOrders(res.data.orders || []);
      }
    } catch (err) {
      console.error("Orders load error:", err);
      setOrders([]); // Set empty array on error to avoid crash
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Handle Order Status Change 
  const handleStatusUpdate = async (id, newStatus) => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(`http://localhost:5000/api/admin/orders/${id}/status`, { status: newStatus }, config);
      alert(`✅ Order status updated to ${newStatus}!`);
      fetchOrders();
    } catch (err) {
      console.error("Status update error:", err);
      alert("❌ Failed to update status");
    }
  };

  // Handle Order Delete
  const handleDelete = async (id) => {
    if (window.confirm("⚠️ Kya aap waqai is order ko delete karna chahte hain?")) {
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        await axios.delete(`http://localhost:5000/api/admin/orders/${id}`, config);
        alert("✅ Order deleted successfully!");
        fetchOrders(); 
      } catch (err) {
        alert("❌ Error deleting order");
      }
    }
  };

  // Search & Filter Logic (Safe fallback added here)
  const filteredOrders = (orders || []).filter(order => {
    // Schema based search: User ka populated name YA shippingAddress ka fullName
    const customerName = order.user?.name || order.shippingAddress?.fullName || "";
    
    const matchesSearch = 
      order._id?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      customerName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "All" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Dynamic Styles for Schema ENUM Statuses
  const getStatusStyle = (status) => {
    switch(status) {
      case 'Delivered': return "bg-emerald-50 text-emerald-700 border-emerald-200 focus:ring-emerald-500";
      case 'Shipped': return "bg-blue-50 text-blue-700 border-blue-200 focus:ring-blue-500";
      case 'Cancelled': return "bg-red-50 text-red-700 border-red-200 focus:ring-red-500";
      default: return "bg-yellow-50 text-yellow-700 border-yellow-200 focus:ring-yellow-500"; // Pending
    }
  };

  return (
    <div className="mx-auto space-y-6 font-sans max-w-7xl">
      
      {/* 🌟 Header & Actions */}
      <div className="p-6 space-y-4 bg-white border border-gray-100 shadow-sm rounded-2xl sm:space-y-0 sm:flex sm:items-center sm:justify-between">
        
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 text-xl text-orange-600 bg-orange-50 rounded-xl">
            <FaBoxOpen />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Order Management</h2>
            <p className="text-sm text-gray-500">Track and fulfill customer orders</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex items-center">
            <FaFilter className="absolute text-sm text-gray-400 left-3" />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-2 pr-8 text-sm font-medium text-gray-700 border border-gray-200 appearance-none cursor-pointer pl-9 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="relative">
            <FaSearch className="absolute text-sm text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
            <input 
              type="text" 
              placeholder="Search by ID or Name..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-2 pr-4 text-sm transition-all border border-gray-200 sm:w-64 pl-9 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* 📊 Data Table */}
      <div className="overflow-hidden bg-white border border-gray-100 shadow-sm rounded-2xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-6 py-4 text-xs font-bold tracking-wider text-gray-500 uppercase">Order ID & Date</th>
                <th className="px-6 py-4 text-xs font-bold tracking-wider text-gray-500 uppercase">Customer & Items</th>
                <th className="px-6 py-4 text-xs font-bold tracking-wider text-gray-500 uppercase">Total Amount</th>
                <th className="px-6 py-4 text-xs font-bold tracking-wider text-gray-500 uppercase">Status</th>
                <th className="px-6 py-4 text-xs font-bold tracking-wider text-right text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              
              {loading ? (
                [1, 2, 3, 4].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="w-24 h-4 mb-2 bg-gray-200 rounded"></div></td>
                    <td className="px-6 py-4"><div className="w-32 h-4 mb-2 bg-gray-200 rounded"></div></td>
                    <td className="px-6 py-4"><div className="w-16 h-4 bg-gray-200 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-8 bg-gray-200 rounded-lg w-28"></div></td>
                    <td className="px-6 py-4"><div className="w-16 h-8 ml-auto bg-gray-200 rounded-lg"></div></td>
                  </tr>
                ))
              ) : filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr key={order._id} className="transition-colors hover:bg-gray-50/50 group">
                    
                    {/* ID & Date */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-mono text-sm font-bold text-gray-900">#{order._id?.slice(-6).toUpperCase()}</div>
                      <div className="mt-1 text-xs text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                    </td>

                    {/* Customer & Items Count */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {order.shippingAddress?.fullName || order.user?.name || "Guest User"}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {order.items?.length || 0} Item(s)
                      </div>
                    </td>

                    {/* Amount & Payment Method */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-extrabold text-gray-900">
                        ₹{order.totalAmount?.toLocaleString('en-IN') || "0"}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5 font-medium">
                        {order.paymentMethod}
                      </div>
                    </td>

                    {/* Schema Based Status Dropdown */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select 
                        value={order.status || "Pending"} 
                        onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                        className={`text-sm font-bold rounded-lg border px-3 py-1.5 focus:outline-none focus:ring-2 cursor-pointer transition-colors ${getStatusStyle(order.status)}`}
                      >
                        <option value="Pending" className="text-gray-900 bg-white">Pending</option>
                        <option value="Shipped" className="text-gray-900 bg-white">Shipped</option>
                        <option value="Delivered" className="text-gray-900 bg-white">Delivered</option>
                        <option value="Cancelled" className="text-gray-900 bg-white">Cancelled</option>
                      </select>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2 transition-opacity duration-200 sm:opacity-0 group-hover:opacity-100">
                        <button 
                          onClick={() => alert(`Address: ${order.shippingAddress?.address}, ${order.shippingAddress?.city}`)} 
                          className="p-2 text-blue-600 transition-colors rounded-lg bg-blue-50 hover:bg-blue-600 hover:text-white" 
                          title="View Address"
                        >
                          <FaEye />
                        </button>
                        <button 
                          onClick={() => handleDelete(order._id)} 
                          className="p-2 text-red-600 transition-colors rounded-lg bg-red-50 hover:bg-red-600 hover:text-white" 
                          title="Delete Order"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-gray-100 rounded-full">
                      <FaBoxOpen className="text-2xl text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No Orders Found</h3>
                    <p className="mt-1 text-gray-500">Abhi tak koi order match nahi hua hai.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminOrders;