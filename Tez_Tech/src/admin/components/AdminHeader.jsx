import React, { useState } from 'react';
import "../../styles/AdminCss/AdminDashboard.css";



const AdminHeader = () => {
  const [notifications] = useState([
    { id: 1, message: 'New order received', time: '5 min ago' },
    { id: 2, message: 'Product stock low', time: '1 hour ago' },
    { id: 3, message: 'New user registered', time: '2 hours ago' }
  ]);

  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="admin-header">
      <div className="header-left">
        <div className="search-bar">
          <input type="text" placeholder="Search admin panel..." />
          <button>🔍</button>
        </div>
      </div>

      <div className="header-right">
        <div className="notification-container">
          <button 
            className="notification-btn"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            🔔
            <span className="notification-badge">3</span>
          </button>
          
          {showNotifications && (
            <div className="notification-dropdown">
              <div className="notification-header">
                <h4>Notifications</h4>
                <button className="mark-read">Mark all as read</button>
              </div>
              <div className="notification-list">
                {notifications.map(notif => (
                  <div key={notif.id} className="notification-item">
                    <div className="notification-content">
                      <p>{notif.message}</p>
                      <span className="notification-time">{notif.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="user-profile">
          <div className="avatar">A</div>
          <div className="user-info">
            <span className="user-name">Admin User</span>
            <span className="user-role">Super Admin</span>
          </div>
          <button className="logout-btn">🚪</button>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;