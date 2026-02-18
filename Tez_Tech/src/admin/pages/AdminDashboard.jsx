import { useEffect, useState } from "react";
import axios from "axios";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    products: 0,
    users: 0,
    orders: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");

        const products = await axios.get(
          "http://localhost:5000/api/products?limit=1",
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const users = await axios.get(
          "http://localhost:5000/api/admin/users",
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const orders = await axios.get(
          "http://localhost:5000/api/admin/orders",
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setStats({
          products: products.data.totalProducts,
          users: users.data.totalUsers,
          orders: orders.data.totalOrders,
        });
      } catch (err) {
        console.log(err);
      }
    };

    fetchStats();
  }, []);

  return (
    <div style={{ padding: "40px" }}>
      <h2>Admin Dashboard</h2>

      <div style={{ display: "flex", gap: "30px", marginTop: "30px" }}>
        <div className="card">Total Products: {stats.products}</div>
        <div className="card">Total Users: {stats.users}</div>
        <div className="card">Total Orders: {stats.orders}</div>
      </div>
    </div>
  );
};

export default AdminDashboard;
