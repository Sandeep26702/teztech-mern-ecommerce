import React, { useState, useEffect } from "react";
import { Link, useNavigate, Outlet, useLocation } from "react-router-dom";
import {
  FaBox, FaUsers, FaClipboardList, FaChartLine,
  FaSignOutAlt, FaBars, FaTimes, FaUserShield, FaFileInvoiceDollar, FaLayerGroup,
  FaCog, FaTruck, FaDesktop, FaShieldAlt, FaRegStickyNote,
  FaBullhorn, FaPalette, FaCubes, FaIndustry, FaGift, FaCommentAlt, FaCalculator,
  FaSearch, FaPlus, FaBell, FaUser, FaTools, FaImage, FaComments, FaHistory,
  FaUserClock, FaSun, FaMoon, FaBoxOpen
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import api from "../../utils/api";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));

const AdminLayout = () => {
  const { theme, toggleTheme } = useTheme();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const userRole = user?.role?.toLowerCase() || "";

  // Global Sales States (for Header Actions)
  const [leads, setLeads] = useState([]);
  const [orders, setOrders] = useState([]);
  const [designRequests, setDesignRequests] = useState([]);
  
  // Modals / Dropdowns
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [showQuickAddDropdown, setShowQuickAddDropdown] = useState(false);
  const [universalSearchQuery, setUniversalSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchHistoryDetail, setSearchHistoryDetail] = useState(null);

  // Forms
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [leadForm, setLeadForm] = useState({ name: "", phone: "", email: "", requirement: "", source: "Global Header" });
  
  const [showDesignModal, setShowDesignModal] = useState(false);
  const [designForm, setDesignForm] = useState({ designName: "", dimensions: "", materialSpecs: "", leadId: "", orderId: "" });

  const [notifications, setNotifications] = useState([]);

  const shiftMetrics = {
    callsMade: 7,
    callsTarget: 10,
    salesClosed: 18500,
    salesTarget: 30005
  };

  useEffect(() => {
    if (userRole === "sales team" || userRole === "designer" || userRole === "admin" || userRole === "subadmin") {
      fetchGlobalSearchData();
      fetchNotifications();
      
      // Auto-poll notifications every 20 seconds to keep designer/sales updated
      const interval = setInterval(() => {
        fetchNotifications();
        fetchGlobalSearchData();
      }, 20000);
      return () => clearInterval(interval);
    }
  }, [userRole, location.pathname]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications");
      if (res.data.success) {
        setNotifications(res.data.notifications || []);
      }
    } catch (err) {
      console.error("Error loading notifications in layout:", err);
    }
  };

  const markAsRead = async (id) => {
    try {
      const res = await api.put(`/notifications/${id}/read`);
      if (res.data.success) {
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      }
    } catch (err) {
      toast.error("Failed to mark alert as read");
    }
  };

  const deleteNotificationItem = async (id) => {
    try {
      const res = await api.delete(`/notifications/${id}`);
      if (res.data.success) {
        setNotifications(prev => prev.filter(n => n._id !== id));
      }
    } catch (err) {
      toast.error("Failed to delete alert");
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await api.put("/notifications/read-all");
      if (res.data.success) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        toast.success("All alerts marked read");
      }
    } catch (err) {
      toast.error("Failed to mark alerts as read");
    }
  };

  const fetchGlobalSearchData = async () => {
    try {
      const promises = [];
      
      if (["admin", "subadmin", "sales team", "marketing"].includes(userRole)) {
        promises.push(api.get("/leads").then(res => setLeads(res.data.leads || [])).catch(() => {}));
      }
      
      if (["admin", "subadmin", "sales team", "manufacturing", "purchase", "packing", "dispatch", "feedback tracking", "accounting", "marketing"].includes(userRole)) {
        promises.push(api.get("/order/admin/all").then(res => setOrders(res.data.orders || [])).catch(() => {}));
      }
      
      if (["admin", "subadmin", "sales team", "designer"].includes(userRole)) {
        promises.push(api.get("/design-requests").then(res => setDesignRequests(res.data.designRequests || [])).catch(() => {}));
      }

      await Promise.all(promises);
    } catch (err) {
      console.error("Error loading search lists in layout:", err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // --- Search Actions ---
  const handleUniversalSearch = (e) => {
    const query = e.target.value;
    setUniversalSearchQuery(query);
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }

    const q = query.toLowerCase();
    const matchedLeads = leads.filter(l => 
      l.leadCode?.toLowerCase().includes(q) ||
      l.name?.toLowerCase().includes(q) ||
      l.phone?.includes(q) ||
      l.requirement?.toLowerCase().includes(q)
    );
    const matchedOrders = orders.filter(o => 
      o.orderCode?.toLowerCase().includes(q) ||
      o.shippingInfo?.fullName?.toLowerCase().includes(q) ||
      o.shippingInfo?.phone?.includes(q) ||
      o.utrNumber?.toLowerCase().includes(q)
    );
    const matchedDesigns = designRequests.filter(d => 
      d.requestCode?.toLowerCase().includes(q) ||
      d.designName?.toLowerCase().includes(q) ||
      d.dimensions?.toLowerCase().includes(q)
    );

    setSearchResults({
      leads: matchedLeads,
      orders: matchedOrders,
      designs: matchedDesigns
    });
    setShowSearchModal(true);
  };

  const handleViewCustomerHistory = (item, type) => {
    let phoneNum = "";
    let customerName = "";

    if (type === "lead") {
      phoneNum = item.phone;
      customerName = item.name;
    } else if (type === "order") {
      phoneNum = item.shippingInfo?.phone;
      customerName = item.shippingInfo?.fullName;
    }

    const relatedLeads = leads.filter(l => l.phone === phoneNum || l.name === customerName);
    const relatedOrders = orders.filter(o => o.shippingInfo?.phone === phoneNum || o.shippingInfo?.fullName === customerName);
    const relatedDesigns = designRequests.filter(d => 
      (d.lead && relatedLeads.some(l => l._id === d.lead._id)) || 
      (d.order && relatedOrders.some(o => o._id === d.order._id))
    );

    setSearchHistoryDetail({
      customerName,
      phoneNum,
      type,
      mainItem: item,
      leads: relatedLeads,
      orders: relatedOrders,
      designs: relatedDesigns
    });
  };

  // --- Form Actions ---
  const handleCreateLead = async (e) => {
    e.preventDefault();
    if (!leadForm.name || !leadForm.phone) {
      toast.error("Name and Phone are required!");
      return;
    }
    try {
      const res = await api.post("/leads", leadForm);
      if (res.data.success) {
        toast.success("Lead Inquiry created successfully!");
        setLeadForm({ name: "", phone: "", email: "", requirement: "", source: "Global Header" });
        setShowLeadModal(false);
        fetchGlobalSearchData();
      }
    } catch (err) {
      toast.error("Failed to create lead");
    }
  };

  const handleCreateDesignTicket = async (e) => {
    e.preventDefault();
    if (!designForm.designName) {
      toast.error("Design Name is required!");
      return;
    }
    try {
      const res = await api.post("/design-requests", designForm);
      if (res.data.success) {
        toast.success("Design Request ticket raised!");
        setDesignForm({ designName: "", dimensions: "", materialSpecs: "", leadId: "", orderId: "" });
        setShowDesignModal(false);
        fetchGlobalSearchData();
      }
    } catch (err) {
      toast.error("Failed to submit design request");
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const menuItems = [
    { name: "Dashboard", path: "/admin/dashboard", icon: <FaChartLine size={20} />, roles: ["admin", "subadmin", "sales team", "designer", "manufacturing", "purchase", "packing", "dispatch", "feedback tracking", "accounting", "marketing"] },
    { name: "Product Catalog", path: "/admin/catalog", icon: <FaBoxOpen size={20} />, roles: ["admin", "subadmin", "sales team", "designer", "manufacturing", "purchase", "packing", "dispatch", "feedback tracking", "accounting", "marketing"] },
    { name: "Leads", path: "/admin/leads", icon: <FaBullhorn size={20} />, roles: ["admin", "subadmin", "sales team", "marketing"] },
    { name: "Design Requests", path: "/admin/designs", icon: <FaPalette size={20} />, roles: ["admin", "subadmin", "sales team", "designer"] },
    { name: "Materials", path: "/admin/materials", icon: <FaCubes size={20} />, roles: ["admin", "subadmin", "purchase", "sales team"] },
    { name: "Job Cards", path: "/admin/job-cards", icon: <FaIndustry size={20} />, roles: ["admin", "subadmin", "manufacturing"] },
    { name: "Packing", path: "/admin/packing", icon: <FaGift size={20} />, roles: ["admin", "subadmin", "packing"] },
    { name: "Dispatch Queue", path: "/admin/dispatch", icon: <FaTruck size={20} />, roles: ["admin", "subadmin", "dispatch"] },
    { name: "Feedback & Upsell", path: "/admin/feedback", icon: <FaCommentAlt size={20} />, roles: ["admin", "subadmin", "feedback tracking", "sales team"] },
    { name: "Accounting Logs", path: "/admin/accounting", icon: <FaCalculator size={20} />, roles: ["admin", "subadmin", "accounting"] },
    { name: "Products", path: "/admin/products", icon: <FaBox size={20} />, roles: ["admin", "subadmin", "purchase"] },
    { name: "Categories", path: "/admin/categories", icon: <FaLayerGroup size={20} />, roles: ["admin", "subadmin", "purchase"] },
    { name: "Quotations", path: "/admin/quotes", icon: <FaFileInvoiceDollar size={20} />, roles: ["admin", "subadmin", "sales team", "designer"] },
    { name: "Client Notes", path: "/admin/quotes/notes", icon: <FaRegStickyNote size={20} />, roles: ["admin", "subadmin", "sales team", "designer", "feedback tracking"] },
    { name: "Orders", path: "/admin/orders", icon: <FaClipboardList size={20} />, roles: ["admin", "subadmin", "sales team", "manufacturing", "purchase", "packing", "dispatch", "feedback tracking", "accounting", "marketing"] },
    { name: "Users", path: "/admin/users", icon: <FaUsers size={20} />, roles: ["admin", "subadmin"] },
    { name: "Sub Admins", path: "/admin/subadmins", icon: <FaUserShield size={20} />, roles: ["admin"] },
    { name: "Shipping", path: "/admin/shipping", icon: <FaTruck size={20} />, roles: ["admin", "subadmin", "dispatch"] },
    { name: "Layout", path: "/admin/layout", icon: <FaDesktop size={20} />, roles: ["admin", "subadmin"] },
    { name: "Security Logs", path: "/admin/logs", icon: <FaShieldAlt size={20} />, roles: ["admin"] },
  ];

  const filteredMenuItems = menuItems.filter(item => item.roles.includes(userRole));

  return (
    <div className="flex h-screen overflow-hidden font-sans bg-gray-50 print:h-auto print:overflow-visible print:bg-white">
      
      {/* 🌑 Premium Dark Sidebar */}
      <aside 
        className={`print:hidden bg-slate-900 text-slate-300 flex flex-col transition-all duration-300 ease-in-out z-20 shadow-2xl ${
          isSidebarOpen ? "w-64" : "w-20"
        }`}
      >
        <div className="flex items-center justify-center h-16 px-4 border-b border-slate-800">
          <div className="flex items-center justify-center w-full gap-3">
            <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 text-xl font-bold text-white rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
              S
            </div>
            {isSidebarOpen && (
              <h2 className="overflow-hidden text-xl font-bold tracking-wide text-white transition-opacity duration-300 whitespace-nowrap">
                TezTech Admin
              </h2>
            )}
          </div>
        </div>
        
        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto custom-scrollbar">
          {filteredMenuItems.map((item) => {
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
      <main className="flex flex-col flex-1 min-w-0 overflow-hidden print:overflow-visible">
        
        {/* Urgent Priority Ticker */}
        {designRequests.filter(d => d.priority === "Urgent" && ["Pending", "In Progress", "Rejected"].includes(d.status)).length > 0 && (
          <div className="bg-red-600 text-white py-2 px-4 flex items-center gap-2 text-xs font-bold select-none z-50 print:hidden shrink-0 animate-pulse border-b border-red-700">
            <span className="bg-white text-red-700 px-1.5 py-0.5 rounded font-black text-[9px] uppercase tracking-wider shrink-0">🚨 URGENT REQUIREMENT</span>
            <div className="flex-1 overflow-hidden relative h-4">
              <div className="absolute whitespace-nowrap animate-marquee flex gap-8">
                {designRequests.filter(d => d.priority === "Urgent" && ["Pending", "In Progress", "Rejected"].includes(d.status)).map(t => (
                  <span key={t._id} className="hover:underline cursor-pointer" onClick={() => navigate("/admin/designs")}>
                    Ticket {t.requestCode} : "{t.designName}" is marked URGENT by Sales! Dimensions: {t.dimensions || "N/A"}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            DYNAMIC GLOBAL HEADER (FOR SALES & DESIGNER ROLES)
        ========================================== */}
        {userRole === "sales team" || userRole === "designer" ? (
          <header className="z-30 flex flex-col md:flex-row items-center justify-between gap-4 p-4 border-b border-slate-200 bg-white shadow-sm print:hidden">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <button 
                className="p-2 text-gray-500 transition-colors rounded-lg hover:bg-gray-100 hover:text-gray-900 focus:outline-none"
                onClick={() => setSidebarOpen(!isSidebarOpen)}
              >
                {isSidebarOpen ? <FaTimes size={18} /> : <FaBars size={18} />}
              </button>
              
              {/* Global Universal Search */}
              <div className="relative w-full md:w-80">
                <FaSearch className="absolute text-slate-400 -translate-y-1/2 left-3.5 top-1/2" />
                <input
                  type="text"
                  value={universalSearchQuery}
                  onChange={handleUniversalSearch}
                  placeholder="Search Ticket, Lead, Customer, Design..."
                  className="w-full py-2 pl-10 pr-4 text-xs border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/25 bg-slate-50 hover:bg-slate-100/50 transition-all font-medium text-slate-800"
                />
              </div>
            </div>

            {/* Right side controls */}
            <div className="flex items-center justify-end w-full md:w-auto gap-4 flex-wrap text-xs">
              
              {/* Daily Shift Target (Sales Only) */}
              {userRole === "sales team" && (
                <div className="hidden lg:flex items-center gap-3 px-3 py-1 border border-slate-200 rounded-xl bg-slate-50/50 text-[10px] font-semibold">
                  <div>
                    <span className="text-slate-400 uppercase font-black text-[8px] block">Call Target</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="font-bold text-slate-800">{shiftMetrics.callsMade}/{shiftMetrics.callsTarget}</span>
                      <div className="w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 rounded-full" style={{ width: `${(shiftMetrics.callsMade/shiftMetrics.callsTarget)*105}%` }}></div>
                      </div>
                    </div>
                  </div>
                  <div className="w-px h-6 bg-slate-200"></div>
                  <div>
                    <span className="text-slate-400 uppercase font-black text-[8px] block">Today's Revenue</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="font-bold text-emerald-600">{formatCurrency(shiftMetrics.salesClosed)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Global Quick Add dropdown (Sales Only) */}
              {["admin", "subadmin", "sales team"].includes(userRole) && (
                <div className="relative">
                  <button
                    onClick={() => setShowQuickAddDropdown(!showQuickAddDropdown)}
                    className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 text-xs"
                  >
                    <FaPlus size={10} /> Quick Add
                  </button>
                  {showQuickAddDropdown && (
                    <div className="absolute right-0 mt-2 w-44 bg-white border border-slate-200 shadow-xl rounded-2xl p-1.5 z-50 animate-fade-in text-[11px]">
                      <button
                        onClick={() => { setShowLeadModal(true); setShowQuickAddDropdown(false); }}
                        className="w-full text-left px-2.5 py-1.5 font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <FaUser /> Add inquiry Lead
                      </button>
                      <button
                        onClick={() => { navigate("/admin/orders/create"); setShowQuickAddDropdown(false); }}
                        className="w-full text-left px-2.5 py-1.5 font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <FaClipboardList /> Create New Order
                      </button>
                      <button
                        onClick={() => { setShowDesignModal(true); setShowQuickAddDropdown(false); }}
                        className="w-full text-left px-2.5 py-1.5 font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <FaTools /> Raise Design Ticket
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Global Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                  className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
                >
                  <FaBell size={16} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-black text-white ring-1 ring-white animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>
                {showNotificationDropdown && (
                  <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 shadow-xl rounded-2xl overflow-hidden z-50 text-[11px]">
                    <div className="p-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between font-bold text-slate-850">
                      <span>Recent Alerts</span>
                      <button onClick={markAllAsRead} className="text-[9px] text-blue-600 hover:underline">
                        Mark all read
                      </button>
                    </div>
                    <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-slate-400 italic text-[11px]">No alerts found</div>
                      ) : (
                        notifications.map(n => (
                          <div key={n._id} className={`p-2.5 hover:bg-slate-50 flex items-start justify-between gap-3 ${!n.read ? "bg-blue-50/20" : ""}`}>
                            <p className={`text-slate-750 flex-1 leading-tight ${!n.read ? "font-bold text-slate-900" : ""}`}>{n.text}</p>
                            <div className="flex flex-col gap-1 items-end shrink-0">
                              <span className="text-[8px] text-slate-400">{new Date(n.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                              <div className="flex gap-2">
                                {!n.read && (
                                  <button onClick={() => markAsRead(n._id)} className="text-blue-600 hover:text-blue-800 text-[9px] font-bold">
                                    Read
                                  </button>
                                )}
                                <button onClick={() => deleteNotificationItem(n._id)} className="text-slate-350 hover:text-red-500 text-[9px] font-bold">
                                  ✕
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Theme Toggle Switch */}
              <button
                onClick={toggleTheme}
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
              >
                {theme === "light" ? <FaMoon size={16} /> : <FaSun size={16} />}
              </button>

              {/* Profile Badge */}
              <div className="flex items-center gap-2.5 pl-2 border-l border-slate-250">
                <div className="text-right">
                  <p className="text-[11px] font-black text-slate-900">{user?.name || "User"}</p>
                  <span className="text-[9px] font-extrabold text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                    {userRole === "sales team" ? "Sales" : "Designer"}
                  </span>
                </div>
                <div className="w-8 h-8 flex items-center justify-center font-bold text-blue-700 bg-blue-100 rounded-full border border-blue-200 text-xs">
                  {user?.name?.charAt(0).toUpperCase() || "D"}
                </div>
              </div>

            </div>
          </header>
        ) : (
          /* STANDARD GENERAL HEADER FOR OTHERS */
          <header className="z-10 flex items-center justify-between h-16 px-4 border-b border-gray-200 bg-white/80 backdrop-blur-md sm:px-6 print:hidden">
            <div className="flex items-center gap-4">
              <button 
                className="p-2 text-gray-500 transition-colors rounded-lg hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={() => setSidebarOpen(!isSidebarOpen)}
              >
                {isSidebarOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
              </button>
              <h1 className="hidden text-xl font-bold text-gray-800 sm:block">
                {filteredMenuItems.find(item => location.pathname.includes(item.path))?.name || "Dashboard"}
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Theme Toggle Switch */}
              <button
                onClick={toggleTheme}
                className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
                title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
              >
                {theme === "light" ? <FaMoon size={18} /> : <FaSun size={18} />}
              </button>

              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-gray-900">{user?.name || "Admin User"}</p>
                <p className="text-xs text-gray-500">{user?.role || "Administrator"}</p>
              </div>
              <div className="flex items-center justify-center w-10 h-10 font-bold text-blue-700 border-2 border-white rounded-full shadow-sm bg-gradient-to-tr from-blue-100 to-indigo-100 text-sm">
                {user?.name?.charAt(0).toUpperCase() || 'A'}
              </div>
            </div>
          </header>
        )}

        {/* 📄 Dynamic Content (Outlet) */}
        <section className="flex-1 p-4 overflow-x-hidden overflow-y-auto bg-gray-50 sm:p-6 lg:p-8 print:p-0 print:m-0 print:overflow-visible print:bg-white">
          <Outlet />
        </section>
        
      </main>

      {/* ==========================================================
          GLOBAL SUPPORT MODALS (FOR QUICK ACTIONS & SEARCH)
      ========================================================== */}
      {userRole === "sales team" && (
        <>
          {/* 1. Universal Search Results Modal */}
          {showSearchModal && searchResults && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white p-6 rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-150 overflow-hidden flex flex-col h-[520px] animate-scale-up">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3 flex-shrink-0">
                  <h3 className="text-base font-black text-slate-900">Universal Search Results: "{universalSearchQuery}"</h3>
                  <button onClick={() => { setShowSearchModal(false); setSearchResults(null); }} className="text-slate-400 hover:text-slate-700 font-bold">
                    ✕ Close
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto py-4 space-y-6">
                  {/* Leads */}
                  <div>
                    <h4 className="text-[10px] font-black uppercase text-slate-450 tracking-wider mb-2">Leads Inquiries ({searchResults.leads.length})</h4>
                    {searchResults.leads.length === 0 ? (
                      <p className="text-xs text-slate-350 italic pl-2">No matching leads</p>
                    ) : (
                      <div className="space-y-2">
                        {searchResults.leads.map(lead => (
                          <div key={lead._id} className="p-3 border border-slate-150 rounded-2xl flex justify-between items-center bg-slate-50/30 hover:border-slate-305 transition-colors text-xs">
                            <div>
                              <p className="font-bold text-slate-900">{lead.name} ({lead.leadCode || "LD"})</p>
                              <p className="text-[10px] text-slate-500">Phone: {lead.phone} | Req: {lead.requirement}</p>
                            </div>
                            <button
                              onClick={() => { handleViewCustomerHistory(lead, "lead"); setShowSearchModal(false); }}
                              className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold rounded-lg transition-all text-[11px]"
                            >
                              View Profile
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Orders */}
                  <div>
                    <h4 className="text-[10px] font-black uppercase text-slate-450 tracking-wider mb-2">Orders Bookings ({searchResults.orders.length})</h4>
                    {searchResults.orders.length === 0 ? (
                      <p className="text-xs text-slate-350 italic pl-2">No matching orders</p>
                    ) : (
                      <div className="space-y-2">
                        {searchResults.orders.map(order => (
                          <div key={order._id} className="p-3 border border-slate-150 rounded-2xl flex justify-between items-center bg-slate-50/30 hover:border-slate-300 transition-colors text-xs">
                            <div>
                              <p className="font-bold text-slate-900">{order.orderCode || "Order"} ({formatCurrency(order.totalAmount)})</p>
                              <p className="text-[10px] text-slate-550">Recipient: {order.shippingInfo?.fullName} | Phone: {order.shippingInfo?.phone}</p>
                            </div>
                            <button
                              onClick={() => { handleViewCustomerHistory(order, "order"); setShowSearchModal(false); }}
                              className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold rounded-lg transition-all text-[11px]"
                            >
                              View Profile
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. Complete Customer Interaction History Profile Modal */}
          {searchHistoryDetail && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
              <div className="bg-white p-6 rounded-3xl w-full max-w-3xl shadow-2xl border border-slate-150 overflow-hidden flex flex-col h-[550px] animate-scale-up">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3 flex-shrink-0">
                  <div>
                    <h3 className="text-base font-black text-slate-900">Unified Profile: {searchHistoryDetail.customerName}</h3>
                    <p className="text-[10px] text-slate-500 font-bold block mt-0.5">Mobile: {searchHistoryDetail.phoneNum}</p>
                  </div>
                  <button onClick={() => setSearchHistoryDetail(null)} className="text-slate-450 hover:text-slate-700 font-bold">
                    ✕ Close
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto py-4 space-y-6">
                  {/* Lead details */}
                  <div>
                    <h4 className="text-[10px] font-black uppercase text-slate-450 tracking-wider mb-2 border-b pb-1">Leads Inquiries history</h4>
                    {searchHistoryDetail.leads.length === 0 ? (
                      <p className="text-xs text-slate-350 italic pl-2">No inquiry logs</p>
                    ) : (
                      searchHistoryDetail.leads.map(l => (
                        <div key={l._id} className="p-3 border border-slate-150 bg-slate-50/20 rounded-2xl mb-2 text-xs">
                          <div className="flex justify-between font-bold text-slate-800">
                            <span>Inquiry {l.leadCode} ({l.status})</span>
                            <span className="text-[10px] text-slate-400">{new Date(l.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-slate-655 mt-1">Requirement: {l.requirement}</p>
                          {l.notes?.length > 0 && (
                            <div className="mt-2 bg-white border p-2 rounded-xl text-[10px] space-y-1">
                              <p className="font-bold text-slate-450 uppercase text-[8px] tracking-wider border-b pb-0.5 font-black">Interaction notes</p>
                              {l.notes.map((n, idx) => (
                                <p key={idx}>"{n.text}" - <strong className="text-slate-500">{n.author}</strong></p>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                  {/* Custom Design Tickets */}
                  <div>
                    <h4 className="text-[10px] font-black uppercase text-slate-450 tracking-wider mb-2 border-b pb-1">Custom Design Tickets</h4>
                    {searchHistoryDetail.designs.length === 0 ? (
                      <p className="text-xs text-slate-350 italic pl-2">No design requests raised</p>
                    ) : (
                      searchHistoryDetail.designs.map(d => (
                        <div key={d._id} className="p-3 border border-slate-150 bg-slate-50/20 rounded-2xl mb-2 text-xs">
                          <div className="flex justify-between font-bold text-slate-850">
                            <span>Ticket: {d.requestCode} - {d.designName}</span>
                            <span className="text-blue-600">{d.status}</span>
                          </div>
                          <p className="text-slate-600 mt-1">Specs: {d.materialSpecs} ({d.dimensions})</p>
                        </div>
                      ))
                    )}
                  </div>
                  {/* Orders */}
                  <div>
                    <h4 className="text-[10px] font-black uppercase text-slate-450 tracking-wider mb-2 border-b pb-1">Order Bookings</h4>
                    {searchHistoryDetail.orders.length === 0 ? (
                      <p className="text-xs text-slate-350 italic pl-2">No orders placed</p>
                    ) : (
                      searchHistoryDetail.orders.map(o => (
                        <div key={o._id} className="p-3 border border-slate-150 bg-slate-50/20 rounded-2xl mb-2 text-xs space-y-1">
                          <div className="flex justify-between font-bold text-slate-800">
                            <span>Order: {o.orderCode || `#${o._id.slice(-6)}`} - {o.orderStatus}</span>
                            <span>{formatCurrency(o.totalAmount)} ({o.paymentStatus})</span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-semibold">Address: {o.shippingInfo?.address}, {o.shippingInfo?.city}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. Global Add Lead Modal */}
          {showLeadModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white p-6 rounded-3xl w-full max-w-md shadow-2xl border border-slate-150 animate-scale-up">
                <h3 className="text-base font-black text-slate-905 mb-4">Register Inquiry Lead</h3>
                <form onSubmit={handleCreateLead} className="space-y-4 text-xs font-medium">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Customer Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Vikramaditya Dev"
                      value={leadForm.name}
                      onChange={(e) => setLeadForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Mobile Phone *</label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. 9876543210"
                        value={leadForm.phone}
                        onChange={(e) => setLeadForm(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Email</label>
                      <input
                        type="email"
                        placeholder="e.g. vdev@gmail.com"
                        value={leadForm.email}
                        onChange={(e) => setLeadForm(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-505 mb-1">Requirement Details</label>
                    <textarea
                      rows="3"
                      placeholder="Sheet dimensions, thickness, required date, etc..."
                      value={leadForm.requirement}
                      onChange={(e) => setLeadForm(prev => ({ ...prev, requirement: e.target.value }))}
                      className="w-full p-2.5 border border-slate-205 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowLeadModal(false)}
                      className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow"
                    >
                      Create Inquiry
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* 4. Global Add Design Ticket Modal */}
          {showDesignModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white p-6 rounded-3xl w-full max-w-md shadow-2xl border border-slate-150 animate-scale-up">
                <h3 className="text-base font-black text-slate-900 mb-4">Raise Design Request Ticket</h3>
                <form onSubmit={handleCreateDesignTicket} className="space-y-4 text-xs font-medium">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Design Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Laser Cutting Screen Grille"
                      value={designForm.designName}
                      onChange={(e) => setDesignForm(prev => ({ ...prev, designName: e.target.value }))}
                      className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Dimensions (mm)</label>
                      <input
                        type="text"
                        placeholder="e.g. 1000 x 2000"
                        value={designForm.dimensions}
                        onChange={(e) => setDesignForm(prev => ({ ...prev, dimensions: e.target.value }))}
                        className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Material Specs</label>
                      <input
                        type="text"
                        placeholder="e.g. 2mm HDPE Black"
                        value={designForm.materialSpecs}
                        onChange={(e) => setDesignForm(prev => ({ ...prev, materialSpecs: e.target.value }))}
                        className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowDesignModal(false)}
                      className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow"
                    >
                      Submit Ticket
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}

    </div>
  );
};

export default AdminLayout;