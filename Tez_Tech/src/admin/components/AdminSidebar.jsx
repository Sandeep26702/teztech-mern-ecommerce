import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../../styles/AdminCss/AdminSidebar.css';

const AdminSidebar = () => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { path: '/admin', icon: '📊', label: 'Dashboard' },
    { path: '/admin/products', icon: '📦', label: 'Products' },
    { path: '/admin/orders', icon: '📋', label: 'Orders' },
    { path: '/admin/users', icon: '👥', label: 'Users' },
    { path: '/admin/analytics', icon: '📈', label: 'Analytics' },
    { path: '/admin/settings', icon: '⚙️', label: 'Settings' },
    { path: '/admin/careers', icon: '💼', label: 'Careers' },
    { path: '/admin/quotations', icon: '💰', label: 'Quotations' }
  ];

  return (
    <div className={`admin-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        {!isCollapsed && <h2 className="admin-logo">Tez_Tech Admin</h2>}
        <button 
          className="collapse-btn"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? '→' : '←'}
        </button>
      </div>

      <div className="sidebar-menu">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`menu-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            <span className="menu-icon">{item.icon}</span>
            {!isCollapsed && <span className="menu-label">{item.label}</span>}
          </Link>
        ))}
      </div>

      <div className="sidebar-footer">
        <Link to="/" className="back-to-site">
          <span className="menu-icon">🏠</span>
          {!isCollapsed && <span className="menu-label">Back to Site</span>}
        </Link>
      </div>
    </div>
  );
};

export default AdminSidebar;