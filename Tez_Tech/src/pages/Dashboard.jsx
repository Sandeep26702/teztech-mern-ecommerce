import "../styles/components/Dashboard.css";

const Dashboard = () => {
  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Dashboard</h1>
      <div className="dashboard-content">
        <div className="dashboard-cards">
          <div className="dashboard-card">
            <h3>📊 Analytics</h3>
            <p>View your statistics and reports</p>
          </div>
          <div className="dashboard-card">
            <h3>📦 Orders</h3>
            <p>Manage your orders and tracking</p>
          </div>
          <div className="dashboard-card">
            <h3>⚙️ Settings</h3>
            <p>Configure your preferences</p>
          </div>
          <div className="dashboard-card">
            <h3>📈 Reports</h3>
            <p>Generate detailed reports</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;