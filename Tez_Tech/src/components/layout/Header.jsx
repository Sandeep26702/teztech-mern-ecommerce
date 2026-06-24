import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext"; 
import { useQuote } from "../../context/QuoteContext"; 
import { useCart } from "../../context/CartContext"; 
import { useTheme } from "../../context/ThemeContext"; 
import myLogo from '../../assets/logo.png';

// 💧 Water Droplet Component
const WaterDroplet = ({ x, y, tx, ty, colorClass }) => {
  const [active, setActive] = useState(false);
  
  useEffect(() => {
    const frame = requestAnimationFrame(() => setActive(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      className={`absolute rounded-full pointer-events-none transition-all duration-500 ease-out z-20 ${colorClass}`}
      style={{
        left: x,
        top: y,
        width: '8px',
        height: '8px',
        opacity: active ? 0 : 0.8,
        transform: active ? `translate(${tx}px, ${ty}px) scale(0)` : `translate(-50%, -50%) scale(1.5)`,
      }}
    />
  );
};

const Header = () => {
  const { theme, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, logout, user } = useAuth();
  
  const isStaff = ["admin", "subadmin", "sales team", "designer", "manufacturing", "purchase", "packing", "dispatch", "feedback tracking", "accounting", "marketing"].includes(user?.role?.toLowerCase());
  const { clearQuote } = useQuote(); 
  
  const { cartItems } = useCart();
  const cartCount = cartItems?.length || 0;

  const navigate = useNavigate();
  const location = useLocation();

  const [gliderStyle, setGliderStyle] = useState({ opacity: 0, left: 0, width: 0 });
  const [droplets, setDroplets] = useState([]); 
  const tabRefs = useRef([]); 

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      clearQuote(); 
      logout();     
      navigate("/login");
    }
  };

  const navLinks = [
    { path: "/", label: "Home", id: "home" },
    { path: "/products", label: "Products", id: "products" },
    { path: "/categories", label: "Categories", id: "categories" },
    { path: "/quotation", label: "Quotation", id: "quotation" },
    { path: "/about", label: "About", id: "about" },
  ];

  const getActiveIndex = () => {
    const path = location.pathname;
    if (path === "/") return 0;
    if (path.startsWith("/product")) return 1;
    if (path.startsWith("/categor")) return 2;
    if (path.startsWith("/quot")) return 3;
    if (path.startsWith("/about")) return 4;
    return -1; 
  };

  const activeIndex = getActiveIndex();

  useEffect(() => {
    if (activeIndex !== -1 && tabRefs.current[activeIndex]) {
      const activeElement = tabRefs.current[activeIndex];
      setGliderStyle({
        opacity: 1,
        left: activeElement.offsetLeft,
        width: activeElement.offsetWidth,
      });
    } else {
      setGliderStyle({ opacity: 0, left: 0, width: 0 });
    }
  }, [activeIndex, location.pathname]);

  const getWaterColor = () => {
    switch (activeIndex) {
      case 0: return 'from-cyan-400 to-blue-500'; 
      case 1: return 'from-teal-400 to-cyan-500'; 
      case 2: return 'from-sky-400 to-indigo-500'; 
      case 3: return 'from-blue-400 to-violet-500';
      case 4: return 'from-emerald-400 to-teal-500';
      default: return 'from-gray-300 to-gray-400';
    }
  };

  const getDropletColor = (idx) => {
    switch (idx) {
      case 0: return 'bg-cyan-400';
      case 1: return 'bg-teal-400';
      case 2: return 'bg-sky-400';
      case 3: return 'bg-blue-400';
      case 4: return 'bg-emerald-400';
      default: return 'bg-gray-400';
    }
  };

  const handleNavClick = (e, idx) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const parentRect = e.currentTarget.parentElement.getBoundingClientRect();
    const x = rect.left - parentRect.left + rect.width / 2;
    const y = rect.top - parentRect.top + rect.height / 2;

    const newDroplets = Array.from({ length: 6 }).map((_, i) => ({
      id: Date.now() + i + Math.random(),
      x,
      y,
      tx: (Math.random() - 0.5) * 80, 
      ty: (Math.random() - 1) * 50 - 10, 
      colorClass: getDropletColor(idx),
    }));

    setDroplets((prev) => [...prev, ...newDroplets]);
    setTimeout(() => {
      setDroplets((prev) => prev.filter(d => !newDroplets.some(nd => nd.id === d.id)));
    }, 600);
  };

  return (
    <header className="sticky top-0 z-50 w-full font-sans transition-all border-b border-gray-100 bg-white/95 backdrop-blur-md">
      <div className="px-4 w-full sm:px-8 lg:px-12">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo - Updated Section */}
          <div className="flex items-center flex-shrink-0">
            <Link to="/" className="flex items-center gap-2 group">
              <img 
                src={myLogo} 
                alt="TezTech Logo" 
                className="w-auto h-12 transition-transform duration-300 group-hover:scale-105" 
              />
            </Link>
          </div>

          {/* 💻 DESKTOP NAV LINKS */}
          <nav className="items-center hidden md:flex">
            
            <div className="relative flex items-center bg-gray-50/80 backdrop-blur-md border border-gray-200/50 rounded-full p-1.5 shadow-[inset_0_2px_6px_rgba(0,0,0,0.04)]">
              {droplets.map((drop) => (
                <WaterDroplet key={drop.id} {...drop} />
              ))}

              <div
                className={`absolute top-1.5 bottom-1.5 rounded-full transition-all duration-1200 ease-[cubic-bezier(0.4,2.5,0.4,0.8)] z-0 bg-gradient-to-r ${getWaterColor()}`}
                style={{
                  left: `${gliderStyle.left}px`,
                  width: `${gliderStyle.width}px`,
                  opacity: gliderStyle.opacity,
                }}
              ></div>

              {navLinks.map((link, idx) => {
                if (link.id === 'quotation') {
                  return (
                    <div
                      key={link.id}
                      ref={(el) => (tabRefs.current[idx] = el)}
                      className="relative z-10 group"
                    >
                      <button
                        className={`px-5 py-1.5 text-[15px] font-bold text-center transition-colors duration-300 focus:outline-none flex items-center gap-1 cursor-pointer ${
                          activeIndex === idx
                            ? 'text-white drop-shadow-sm'
                            : 'text-gray-500 hover:text-cyan-700'
                        }`}
                      >
                        {link.label}
                        <svg
                          className={`w-3.5 h-3.5 transition-transform duration-300 group-hover:rotate-180 ${
                            activeIndex === idx ? 'text-white' : 'text-gray-400'
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>

                      {/* Dropdown Menu */}
                      <div className="absolute left-1/2 -translate-x-1/2 mt-1.5 z-50 invisible w-48 pt-1 transition-all duration-300 opacity-0 group-hover:visible group-hover:opacity-100">
                        <div className="py-1 bg-slate-950/95 backdrop-blur-xl border border-slate-800 shadow-[0_12px_30px_rgba(0,0,0,0.5)] rounded-none text-left">
                          <Link
                            to="/quotation"
                            onClick={(e) => handleNavClick(e, idx)}
                            className="block px-4 py-2.5 text-sm font-bold text-slate-300 hover:bg-slate-900 hover:text-cyan-400 transition-colors border-l-2 border-transparent hover:border-cyan-500"
                          >
                            Product Quote
                          </Link>
                          <Link
                            to="/custom-design-quotation"
                            onClick={(e) => handleNavClick(e, idx)}
                            className="block px-4 py-2.5 text-sm font-bold text-slate-300 hover:bg-slate-900 hover:text-cyan-400 transition-colors border-l-2 border-transparent hover:border-cyan-500"
                          >
                            Custom Quote
                          </Link>
                          <Link
                            to="/quote-inquiries"
                            onClick={(e) => handleNavClick(e, idx)}
                            className="block px-4 py-2.5 text-sm font-bold text-slate-300 hover:bg-slate-900 hover:text-cyan-400 transition-colors border-l-2 border-transparent hover:border-cyan-500"
                          >
                            My Inquiries
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                }
                return (
                  <Link
                    key={link.id}
                    to={link.path}
                    onClick={(e) => handleNavClick(e, idx)}
                    ref={(el) => (tabRefs.current[idx] = el)}
                    className={`relative z-10 px-5 py-1.5 text-[15px] font-bold text-center transition-colors duration-300 ${
                      activeIndex === idx
                        ? 'text-white drop-shadow-sm'
                        : 'text-gray-500 hover:text-cyan-700'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>

            {isStaff && (
              <Link to="/admin/dashboard" className="px-3 py-1.5 text-xs font-bold text-cyan-800 bg-cyan-100 rounded-full hover:bg-cyan-200 transition-colors ml-4 uppercase tracking-wide">
                Admin Panel
              </Link>
            )}

            {/* Auth & Cart Section (Desktop) */}
            <div className="flex items-center gap-4 pl-4 ml-4 border-l border-gray-200">
              <button 
                onClick={toggleTheme}
                className="flex items-center justify-center w-10 h-10 transition-all duration-300 bg-white border border-gray-200 rounded-full hover:border-cyan-300 hover:shadow-md hover:bg-cyan-50 text-gray-600 dark:text-gray-300 cursor-pointer"
                title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
              >
                {theme === "light" ? (
                  <svg className="w-5 h-5 transition-transform duration-300 hover:scale-110 hover:-rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 transition-transform duration-300 hover:scale-110 hover:rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 7a5 5 0 100 10 5 5 0 000-10z" />
                  </svg>
                )}
              </button>

              {isAuthenticated ? (
                <>
                  <Link 
                    to="/cart" 
                    className="relative flex items-center justify-center w-10 h-10 transition-all duration-300 bg-white border border-gray-200 rounded-full hover:border-cyan-300 hover:shadow-md hover:bg-cyan-50 group"
                  >
                    <svg className="w-5 h-5 text-gray-600 transition-transform duration-300 group-hover:text-cyan-600 group-hover:scale-110 group-hover:-rotate-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    
                    {cartCount > 0 && (
                      <span className="absolute flex items-center justify-center w-5 h-5 text-[10px] font-extrabold text-white transition-transform duration-300 border-2 border-white rounded-full bg-gradient-to-br from-rose-500 to-red-600 -top-1.5 -right-1.5 shadow-sm group-hover:scale-110">
                        {cartCount}
                      </span>
                    )}
                  </Link>

                  {/* Profile Dropdown */}
                  <div className="relative group">
                    <button className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 hover:border-cyan-300 hover:bg-cyan-50 transition-all text-sm font-medium text-gray-700 cursor-pointer">
                      <div className="flex items-center justify-center w-6 h-6 text-xs text-white rounded-full bg-gradient-to-br from-cyan-500 to-blue-600">
                        {user?.name?.charAt(0).toUpperCase() || "U"}
                      </div>
                      <span className="max-w-[100px] truncate">{user?.name || "Account"}</span>
                    </button>

                    <div className="absolute right-0 z-50 invisible w-56 pt-3 transition-all duration-300 opacity-0 group-hover:visible group-hover:opacity-100">
                      <div className="py-2 overflow-hidden bg-white border border-gray-100 shadow-xl rounded-xl">
                        {isStaff && (
                          <Link to="/admin/dashboard" className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-cyan-700 bg-cyan-50/50 hover:bg-cyan-50">Admin Panel</Link>
                        )}
                        <Link to="/profile" className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-cyan-50 hover:text-cyan-600">My Profile</Link>
                        <Link to="/orders" className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-cyan-50 hover:text-cyan-600">My Orders</Link>
                        <hr className="my-1 border-gray-100" />
                        <button onClick={handleLogout} className="flex items-center w-full gap-3 px-5 py-3 text-sm font-medium text-left text-red-600 transition-colors hover:bg-red-50">
                          <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                          Logout
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <Link to="/login" className="px-5 py-2.5 text-sm font-bold text-white transition-all bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full hover:from-cyan-600 hover:to-blue-700 hover:shadow-md">
                  Login
                </Link>
              )}
            </div>
          </nav>

          {/* 📱 MOBILE ACTIONS */}
          <div className="flex items-center gap-3 md:hidden">
            <button 
              onClick={toggleTheme}
              className="flex items-center justify-center w-10 h-10 transition-all duration-300 border border-gray-200 rounded-full bg-gray-50 active:scale-95 text-gray-600 dark:text-gray-300 cursor-pointer"
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
            >
              {theme === "light" ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 7a5 5 0 100 10 5 5 0 000-10z" />
                </svg>
              )}
            </button>

            {isAuthenticated && (
              <Link 
                to="/cart" 
                className="relative flex items-center justify-center w-10 h-10 transition-all duration-300 border border-gray-200 rounded-full bg-gray-50 active:scale-95 group"
              >
                <svg className="w-5 h-5 text-gray-600 transition-colors group-hover:text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                
                {cartCount > 0 && (
                  <span className="absolute flex items-center justify-center w-5 h-5 text-[10px] font-extrabold text-white border-2 border-white rounded-full bg-gradient-to-br from-rose-500 to-red-600 -top-1.5 -right-1 shadow-sm">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}
            
            <button onClick={toggleMenu} className="flex items-center justify-center w-10 h-10 text-gray-600 transition-colors border border-transparent rounded-full hover:text-cyan-600 hover:bg-gray-100 focus:outline-none">
              {isMenuOpen ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div 
        className={`md:hidden absolute left-0 w-full bg-white border-t border-gray-100 shadow-xl transition-all duration-500 origin-top overflow-hidden z-50 ${
          isMenuOpen ? "max-h-[calc(100vh-4rem)] opacity-100 visible scale-y-100" : "max-h-0 opacity-0 invisible scale-y-95"
        }`}
      >
        <div className="px-5 py-6 space-y-2 overflow-y-auto max-h-[calc(100vh-4rem)]">
          {navLinks.map((link, idx) => {
            if (link.id === 'quotation') {
              return (
                <div key={idx} className="space-y-1 bg-gray-50/50 p-2 border border-gray-100 rounded-none">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Quotation Services
                  </div>
                  <Link
                    to="/quotation"
                    onClick={toggleMenu}
                    className="relative flex items-center justify-between px-4 py-2.5 overflow-hidden transition-all duration-200 bg-transparent rounded-none group hover:bg-cyan-50"
                  >
                    <span className="relative z-10 text-sm font-extrabold text-gray-700 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-cyan-600">
                      Product Quote
                    </span>
                  </Link>
                  <Link
                    to="/custom-design-quotation"
                    onClick={toggleMenu}
                    className="relative flex items-center justify-between px-4 py-2.5 overflow-hidden transition-all duration-200 bg-transparent rounded-none group hover:bg-cyan-50"
                  >
                    <span className="relative z-10 text-sm font-extrabold text-gray-700 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-cyan-600">
                      Custom Quote
                    </span>
                  </Link>
                  <Link
                    to="/quote-inquiries"
                    onClick={toggleMenu}
                    className="relative flex items-center justify-between px-4 py-2.5 overflow-hidden transition-all duration-200 bg-transparent rounded-none group hover:bg-cyan-50"
                  >
                    <span className="relative z-10 text-sm font-extrabold text-gray-700 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-cyan-600">
                      My Inquiries
                    </span>
                  </Link>
                </div>
              );
            }
            return (
              <Link
                key={idx}
                to={link.path}
                onClick={toggleMenu}
                className="relative flex items-center justify-between px-4 py-3.5 overflow-hidden transition-all duration-300 bg-transparent rounded-2xl group hover:bg-cyan-50"
              >
                <span className="relative z-10 text-base font-bold text-gray-700 transition-transform duration-300 group-hover:translate-x-2 group-hover:text-cyan-700">
                  {link.label}
                </span>
              </Link>
            );
          })}

          {isStaff && (
            <Link to="/admin/dashboard" onClick={toggleMenu} className="block px-5 py-4 mt-4 font-bold text-center text-white uppercase bg-gradient-to-r from-cyan-600 to-blue-600 rounded-2xl">
              Admin Panel ✨
            </Link>
          )}

          {/* Mobile Menu Theme Toggle switch */}
          <div className="flex items-center justify-between p-4 border border-gray-200 bg-gray-50 rounded-2xl mb-4">
            <span className="text-sm font-bold text-gray-700">Dark Mode</span>
            <button
              onClick={toggleTheme}
              className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-300 focus:outline-none ${theme === 'dark' ? 'bg-cyan-600' : 'bg-gray-300'}`}
            >
              <span
                className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-300 ${
                  theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="pt-6 mt-6 border-t border-gray-100">
            {isAuthenticated ? (
              <div className="flex flex-col gap-3 p-4 border border-gray-200 bg-gray-50 rounded-2xl">
                <p className="mb-2 font-bold text-center text-gray-700">Welcome, {user?.name || "User"}</p>
                
                <div className="grid grid-cols-2 gap-3 mb-2">
                  <Link 
                    to="/profile" 
                    onClick={toggleMenu}
                    className="flex items-center justify-center gap-2 py-3 text-sm font-bold transition-colors text-cyan-700 bg-cyan-100 rounded-xl hover:bg-cyan-200"
                  >
                    👤 My Profile
                  </Link>
                  <Link 
                    to="/orders" 
                    onClick={toggleMenu}
                    className="flex items-center justify-center gap-2 py-3 text-sm font-bold text-blue-700 transition-colors bg-blue-100 rounded-xl hover:bg-blue-200"
                  >
                    📦 My Orders
                  </Link>
                </div>

                <button onClick={handleLogout} className="w-full py-3 font-bold text-white transition-colors bg-red-500 rounded-xl hover:bg-red-600">
                  Logout
                </button>
              </div>
            ) : (
              <Link to="/login" onClick={toggleMenu} className="block w-full py-4 font-bold text-center text-white uppercase bg-gray-900 rounded-2xl hover:bg-gray-800">
                Login / Register
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;