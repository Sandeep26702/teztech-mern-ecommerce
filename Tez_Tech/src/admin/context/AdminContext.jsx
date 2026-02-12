import React, { createContext, useState, useContext } from 'react';

const AdminContext = createContext();

export const AdminProvider = ({ children }) => {
  const [adminStats, setAdminStats] = useState({
    totalRevenue: 45231.89,
    totalOrders: 2350,
    totalProducts: 154,
    totalUsers: 892,
    revenueGrowth: 12.5,
    orderGrowth: 8.2,
    userGrowth: 5.7,
    conversionRate: 3.2
  });

  const [recentOrders] = useState([
    { id: 1, customer: "John Doe", amount: 299.99, status: "Delivered", date: "2024-02-06" },
    { id: 2, customer: "Jane Smith", amount: 159.50, status: "Processing", date: "2024-02-06" },
    { id: 3, customer: "Robert Johnson", amount: 89.99, status: "Pending", date: "2024-02-05" },
    { id: 4, customer: "Emily Davis", amount: 450.00, status: "Delivered", date: "2024-02-05" },
    { id: 5, customer: "Michael Brown", amount: 199.99, status: "Cancelled", date: "2024-02-04" }
  ]);

  const [topProducts] = useState([
    { id: 1, name: "LED Display Board", sales: 234, revenue: 23400 },
    { id: 2, name: "LED Controller", sales: 189, revenue: 15120 },
    { id: 3, name: "RGB LED Strip", sales: 156, revenue: 10920 },
    { id: 4, name: "Scrolling Display", sales: 143, revenue: 17160 },
    { id: 5, name: "LED Panel Light", sales: 128, revenue: 7680 }
  ]);

  const [salesData] = useState([
    { month: 'Jan', sales: 4000, revenue: 24000 },
    { month: 'Feb', sales: 3000, revenue: 22100 },
    { month: 'Mar', sales: 5000, revenue: 22900 },
    { month: 'Apr', sales: 2780, revenue: 20090 },
    { month: 'May', sales: 1890, revenue: 21810 },
    { month: 'Jun', sales: 2390, revenue: 25000 },
    { month: 'Jul', sales: 3490, revenue: 21000 }
  ]);

  const [userActivity] = useState([
    { time: '9:00', active: 40 },
    { time: '10:00', active: 65 },
    { time: '11:00', active: 85 },
    { time: '12:00', active: 70 },
    { time: '13:00', active: 90 },
    { time: '14:00', active: 75 },
    { time: '15:00', active: 60 }
  ]);

  const updateStats = (newStats) => {
    setAdminStats(prev => ({ ...prev, ...newStats }));
  };

  return (
    <AdminContext.Provider value={{
      adminStats,
      recentOrders,
      topProducts,
      salesData,
      userActivity,
      updateStats
    }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => useContext(AdminContext);