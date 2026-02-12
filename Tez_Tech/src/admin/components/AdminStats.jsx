import React from 'react';
import { useAdmin } from '../context/AdminContext';
import '../../styles/AdminCss/AdminStats.css';

const AdminStats = () => {
  const { adminStats } = useAdmin();

  const stats = [
    {
      title: 'Total Revenue',
      value: `$${adminStats.totalRevenue.toLocaleString()}`,
      change: `${adminStats.revenueGrowth}%`,
      icon: '💰',
      color: '#4CAF50'
    },
    {
      title: 'Total Orders',
      value: adminStats.totalOrders.toLocaleString(),
      change: `${adminStats.orderGrowth}%`,
      icon: '📦',
      color: '#2196F3'
    },
    {
      title: 'Total Products',
      value: adminStats.totalProducts,
      change: '+12',
      icon: '🛒',
      color: '#FF9800'
    },
    {
      title: 'Total Users',
      value: adminStats.totalUsers,
      change: `${adminStats.userGrowth}%`,
      icon: '👥',
      color: '#9C27B0'
    }
  ];

  return (
    <div className="admin-stats-grid">
      {stats.map((stat, index) => (
        <div key={index} className="stat-card" style={{ borderLeft: `4px solid ${stat.color}` }}>
          <div className="stat-icon" style={{ backgroundColor: `${stat.color}20` }}>
            <span style={{ color: stat.color }}>{stat.icon}</span>
          </div>
          <div className="stat-content">
            <h3>{stat.title}</h3>
            <div className="stat-value">{stat.value}</div>
            <div className="stat-change">
              <span className={`change-indicator ${parseFloat(stat.change) >= 0 ? 'positive' : 'negative'}`}>
                {parseFloat(stat.change) >= 0 ? '↑' : '↓'} {stat.change}
              </span>
              <span className="change-text">from last month</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminStats;