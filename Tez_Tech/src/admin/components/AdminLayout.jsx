import { useState } from "react";
import { Link, useNavigate, Outlet, useLocation } from "react-router-dom";
import { 
  FaBox, FaUsers, FaClipboardList, FaChartLine, 
  FaSignOutAlt, FaBars, FaTimes, FaUserShield 
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";

const AdminLayout = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation(); // To highlight active menu

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const menuItems = [
    { name: "Dashboard", path: "/admin/dashboard", icon: <FaChartLine size={20} /> },
    { name: "Products", path: "/admin/products", icon: <FaBox size={20} /> },
    { name: "Orders", path: "/admin/orders", icon: <FaClipboardList size={20} /> },
    { name: "Users", path: "/admin/users", icon: <FaUsers size={20} /> },
    { name: "Sub Admins", path: "/admin/subadmins", icon: <FaUserShield size={20} /> },
  ];

  return (
    <div className="flex h-screen overflow-hidden font-sans bg-gray-50">
      
      {/* 🌑 Premium Dark Sidebar */}
      <aside 
        className={`bg-slate-900 text-slate-300 flex flex-col transition-all duration-300 ease-in-out z-20 shadow-2xl ${
          isSidebarOpen ? "w-64" : "w-20"
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-center h-16 px-4 border-b border-slate-800">
          <div className="flex items-center justify-center w-full gap-3">
            <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 text-xl font-bold text-white rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
              S
            </div>
            {isSidebarOpen && (
              <h2 className="overflow-hidden text-xl font-bold tracking-wide text-white transition-opacity duration-300 whitespace-nowrap">
                Sonani Admin
              </h2>
            )}
          </div>
        </div>
        
        {/* Sidebar Nav */}
        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const isActive = location.pathname.includes(item.path);
            return (
              <Link 
                key={item.name} 
                to={item.path} 
                className={`flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? "bg-blue-600 text-white shadow-md shadow-blue-900/20" 
                    : "hover:bg-slate-800 hover:text-white"
                }`}
              >
                <span className={`flex-shrink-0 ${isActive ? "text-white" : "text-slate-400 group-hover:text-blue-400"}`}>
                  {item.icon}
                </span>
                {isSidebarOpen && (
                  <span className="overflow-hidden font-medium whitespace-nowrap">
                    {item.name}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={handleLogout}
            className={`flex items-center gap-4 px-3 py-3 w-full rounded-xl transition-all duration-200 text-red-400 hover:bg-red-500/10 hover:text-red-300 group ${
              !isSidebarOpen && "justify-center"
            }`}
          >
            <span className="flex-shrink-0"><FaSignOutAlt size={20} /></span>
            {isSidebarOpen && <span className="font-medium whitespace-nowrap">Logout</span>}
          </button>
        </div>
      </aside>

      {/* ⚪ Main Content Area */}
      <main className="flex flex-col flex-1 min-w-0 overflow-hidden">
        
        {/* Glassmorphism Header */}
        <header className="z-10 flex items-center justify-between h-16 px-4 border-b border-gray-200 bg-white/80 backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-4">
            <button 
              className="p-2 text-gray-500 transition-colors rounded-lg hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={() => setSidebarOpen(!isSidebarOpen)}
            >
              {isSidebarOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
            </button>
            <h1 className="hidden text-xl font-bold text-gray-800 sm:block">
              {menuItems.find(item => location.pathname.includes(item.path))?.name || "Dashboard"}
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-gray-900">{user?.name || "Admin User"}</p>
              <p className="text-xs text-gray-500">{user?.role || "Administrator"}</p>
            </div>
            {/* Admin Avatar */}
            <div className="flex items-center justify-center w-10 h-10 font-bold text-blue-700 border-2 border-white rounded-full shadow-sm bg-gradient-to-tr from-blue-100 to-indigo-100">
              {user?.name?.charAt(0).toUpperCase() || 'A'}
            </div>
          </div>
        </header>

        {/* 📄 Dynamic Content (Outlet) */}
        <section className="flex-1 p-4 overflow-x-hidden overflow-y-auto bg-gray-50 sm:p-6 lg:p-8">
          <Outlet /> {/* Har page ka content mast bg-gray-50 par load hoga */}
        </section>
        
      </main>
      
    </div>
  );
};

export default AdminLayout;