import React from 'react';
//import { useAdmin } from './context/AdminContext';
import { useAdmin } from "../context/AdminContext"; 

import '../../styles/AdminCss/RecentOrders.css';

const RecentOrders = () => {
  const { recentOrders } = useAdmin();

  const getStatusColor = (status) => {
    switch(status.toLowerCase()) {
      case 'delivered': return '#10b981';
      case 'processing': return '#3b82f6';
      case 'pending': return '#f59e0b';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div className="recent-orders">
      <div className="table-header">
        <h3>Recent Orders</h3>
        <button className="view-all">View All →</button>
      </div>
      
      <div className="orders-table">
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map(order => (
              <tr key={order.id}>
                <td>#{order.id.toString().padStart(5, '0')}</td>
                <td>{order.customer}</td>
                <td>${order.amount.toFixed(2)}</td>
                <td>
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: `${getStatusColor(order.status)}20`, color: getStatusColor(order.status) }}
                  >
                    {order.status}
                  </span>
                </td>
                <td>{order.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentOrders;