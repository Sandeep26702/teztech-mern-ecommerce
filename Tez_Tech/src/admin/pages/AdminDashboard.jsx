import React from 'react';
import AdminSidebar from '../components/AdminSidebar';
import AdminHeader from '../components/AdminHeader';
import AdminStats from '../components/AdminStats';
import SalesChart from '../components/SalesChart';
import RecentOrders from '../components/RecentOrders';
import TopProducts from '../components/TopProducts';
import UserActivity from '../components/UserActivity';
import { AdminProvider } from '../context/AdminContext';
import "../../styles/AdminCss/AdminDashboard.css";


const AdminDashboard = () => {
  return (
    <AdminProvider>
      <div className="admin-layout">
        <AdminSidebar />
        <div className="admin-main">
          <AdminHeader />
          <main className="admin-content">
            <div className="content-header">
              <h1>Dashboard Overview</h1>
              <p>Welcome back! Here's what's happening with your store today.</p>
            </div>

            <AdminStats />

            <div className="charts-section">
              <div className="chart-card large">
                <SalesChart />
              </div>
              <div className="chart-card small">
                <UserActivity />
              </div>
            </div>

            <div className="tables-section">
              <div className="table-card">
                <RecentOrders />
              </div>
              <div className="table-card">
                <TopProducts />
              </div>
            </div>
          </main>
        </div>
      </div>
    </AdminProvider>
  );
};

export default AdminDashboard;