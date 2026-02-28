import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext"; 
import { useQuote } from "../../context/QuoteContext"; // 👈 1. Quote Context Import Kiya

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, logout, user } = useAuth();
  const { clearQuote } = useQuote(); // 👈 2. clearQuote function nikaala
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  // 🚀 UPDATED LOGOUT LOGIC
  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      clearQuote(); // 👈 3. Pehle Quote list clear hogi (Very Important)
      logout();     // 4. Phir User Logout hoga
      navigate("/login");
    }
  };

  const navLinkClass = "relative group px-3 py-2 text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors flex items-center gap-1";

  return (
    <header className="sticky top-0 z-50 w-full font-sans transition-all border-b border-gray-100 shadow-sm bg-white/80 backdrop-blur-md">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* 🚀 LEFT: Brand Logo */}
          <div className="flex items-center flex-shrink-0">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="flex items-center justify-center w-8 h-8 font-bold text-white transition-transform rounded-lg shadow-md bg-gradient-to-br from-blue-600 to-cyan-400 group-hover:rotate-12">
                SE
              </div>
              <h1 className="text-xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-blue-800">
                SONANI ELECTRONICS
              </h1>
            </Link>
          </div>

          {/* 💻 DESKTOP NAV LINKS */}
          <nav className="items-center hidden space-x-2 md:flex">
            <Link to="/" className={navLinkClass}>Home</Link>
            <Link to="/products" className={navLinkClass}>Products</Link>
            <Link to="/categories" className={navLinkClass}>Categories</Link>
            <Link to="/quotation" className={navLinkClass}>Quotation</Link>
            <Link to="/about" className={navLinkClass}>About</Link>

            {(user?.role === "admin" || user?.role === "subadmin") && (
              <Link to="/admin/dashboard" className="px-3 py-1.5 text-sm font-bold text-purple-700 bg-purple-100 rounded-full hover:bg-purple-200 transition-colors ml-2">
                Admin Panel
              </Link>
            )}

            {/* 👤 AUTH SECTION */}
            <div className="flex items-center gap-4 pl-4 ml-2 border-l border-gray-200">
              {isAuthenticated ? (
                <>
                  <Link to="/cart" className="relative p-2 text-gray-600 transition-colors hover:text-blue-600">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </Link>

                  <div className="relative group">
                    <button className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-sm font-medium text-gray-700 cursor-pointer">
                      <div className="flex items-center justify-center w-6 h-6 text-xs text-white bg-blue-600 rounded-full">
                        {user?.name?.charAt(0).toUpperCase() || "U"}
                      </div>
                      <span className="max-w-[100px] truncate">{user?.name || "Account"}</span>
                      <svg className="w-4 h-4 text-gray-400 transition-transform group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Dropdown Menu */}
                    <div className="absolute right-0 z-50 invisible pt-3 transition-all duration-300 opacity-0 w-60 group-hover:visible group-hover:opacity-100">
                      <div className="py-2 bg-white border border-gray-100 shadow-xl rounded-xl">
                        <Link to="/profile" className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600">My Profile</Link>
                        <Link to="/orders" className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600">Orders</Link>
                        <hr className="my-1 border-gray-100" />
                        
                        {/* 🖱️ LOGOUT ACTION */}
                        <button onClick={handleLogout} className="flex items-center w-full gap-3 px-5 py-3 text-sm font-medium text-left text-red-600 transition-colors hover:bg-red-50">
                          <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                          Logout
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <Link to="/login" className="px-5 py-2 text-sm font-bold text-white transition-all bg-blue-600 rounded-lg hover:bg-blue-700 hover:shadow-md">
                  Login
                </Link>
              )}
            </div>
          </nav>

          {/* 📱 MOBILE HAMBURGER MENU */}
          <div className="flex items-center gap-4 md:hidden">
            <button onClick={toggleMenu} className="p-2 text-gray-600 transition-colors rounded-md hover:text-blue-600 hover:bg-gray-100">
              {isMenuOpen ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 📱 MOBILE DROPDOWN */}
      {isMenuOpen && (
        <div className="absolute left-0 w-full bg-white border-t border-gray-100 shadow-lg md:hidden">
          <div className="px-4 pt-2 pb-4 space-y-1">
            <Link to="/" className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-blue-50">Home</Link>
            <Link to="/products" className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-blue-50">Products</Link>
            <Link to="/quotation" className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-blue-50">Quotation</Link>
            {isAuthenticated ? (
              <button onClick={handleLogout} className="flex items-center w-full gap-3 px-3 py-3 text-base font-medium text-red-600 hover:bg-red-50">
                Logout
              </button>
            ) : (
              <Link to="/login" className="block w-full px-4 py-2 font-medium text-center text-white bg-blue-600 rounded-md">Login</Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
