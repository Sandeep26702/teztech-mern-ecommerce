import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Jab bhi page change ho, mobile menu automatically band ho jaye
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      logout();
      navigate("/login");
    }
  };

  // Common link styling function to keep code clean
  const navLinkClass = "relative group px-3 py-2 text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors";

  return (
    // Glassmorphism Header (Sticky, Blur Background)
    <header className="sticky top-0 z-50 w-full font-sans transition-all border-b border-gray-100 shadow-sm bg-white/80 backdrop-blur-md">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* 🚀 LEFT: Brand Logo */}
          <div className="flex items-center flex-shrink-0">
            <Link to="/" className="flex items-center gap-2 group">
              {/* Optional: Add an icon or logo image here later */}
              <div className="flex items-center justify-center w-8 h-8 font-bold text-white transition-transform rounded-lg shadow-md bg-gradient-to-br from-blue-600 to-cyan-400 group-hover:rotate-12">
                SE
              </div>
              <h1 className="text-xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-blue-800">
                SONANI ELECTRONICS
              </h1>
            </Link>
          </div>

          {/* 💻 DESKTOP NAV LINKS (Hidden on Mobile) */}
          <nav className="items-center hidden space-x-2 md:flex">
            <Link to="/" className={navLinkClass}>
              Home
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
            </Link>
            <Link to="/products" className={navLinkClass}>
              Products
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
            </Link>
            <Link to="/quotation" className={navLinkClass}>
              Quotation
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
            </Link>
            <Link to="/about" className={navLinkClass}>
              About
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
            </Link>

            {/* 🛡️ Admin Role Logic Fix (Inside Return now) */}
            {user?.role === "admin" && (
              <Link to="/admin/dashboard" className="px-3 py-1.5 text-sm font-bold text-purple-700 bg-purple-100 rounded-full hover:bg-purple-200 transition-colors">
                Admin Panel
              </Link>
            )}

            {/* User Auth Links */}
            <div className="flex items-center gap-3 pl-4 ml-2 border-l border-gray-200">
              {isAuthenticated ? (
                <>
                  <Link to="/cart" className="relative p-2 text-gray-600 transition-colors hover:text-blue-600">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </Link>
                  <Link to="/profile" className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-sm font-medium text-gray-700">
                    <div className="flex items-center justify-center w-6 h-6 text-xs text-white bg-blue-600 rounded-full">
                      {user?.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                    {user?.name || "Profile"}
                  </Link>
                  <button onClick={handleLogout} className="text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-md transition-colors">
                    Logout
                  </button>
                </>
              ) : (
                <Link to="/login" className="px-5 py-2 text-sm font-bold text-white transition-all bg-blue-600 rounded-lg hover:bg-blue-700 hover:shadow-md">
                  Login
                </Link>
              )}
            </div>
          </nav>

          {/* 📱 MOBILE HAMBURGER MENU BUTTON */}
          <div className="flex items-center gap-4 md:hidden">
            {isAuthenticated && (
              <Link to="/cart" className="text-gray-600 hover:text-blue-600">
                 <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
              </Link>
            )}
            <button
              onClick={toggleMenu}
              className="p-2 text-gray-600 transition-colors rounded-md hover:text-blue-600 focus:outline-none hover:bg-gray-100"
            >
              {isMenuOpen ? (
                // Close (X) Icon
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                // Menu (Hamburger) Icon
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 📱 MOBILE DROPDOWN MENU */}
      {isMenuOpen && (
        <div className="absolute left-0 w-full duration-200 bg-white border-t border-gray-100 shadow-lg md:hidden animate-in slide-in-from-top-2">
          <div className="px-4 pt-2 pb-4 space-y-1">
            <Link to="/" className="block px-3 py-2 text-base font-medium text-gray-700 transition-colors rounded-md hover:text-blue-600 hover:bg-blue-50">Home</Link>
            <Link to="/products" className="block px-3 py-2 text-base font-medium text-gray-700 transition-colors rounded-md hover:text-blue-600 hover:bg-blue-50">Products</Link>
            <Link to="/quotation" className="block px-3 py-2 text-base font-medium text-gray-700 transition-colors rounded-md hover:text-blue-600 hover:bg-blue-50">Quotation</Link>
            <Link to="/about" className="block px-3 py-2 text-base font-medium text-gray-700 transition-colors rounded-md hover:text-blue-600 hover:bg-blue-50">About</Link>
            
            {user?.role === "admin" && (
              <Link to="/admin/dashboard" className="block px-3 py-2 text-base font-bold text-purple-700 transition-colors rounded-md bg-purple-50 hover:bg-purple-100">
                Admin Panel
              </Link>
            )}
          </div>

          {/* Mobile Auth Section */}
          <div className="px-4 pt-4 pb-4 border-t border-gray-200">
            {isAuthenticated ? (
              <div className="space-y-3">
                <Link to="/profile" className="flex items-center gap-3 px-3 py-2 text-base font-medium text-gray-700">
                  <div className="flex items-center justify-center w-8 h-8 font-bold text-white bg-blue-600 rounded-full">
                    {user?.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  {user?.name || "Profile"}
                </Link>
                <button onClick={handleLogout} className="block w-full px-3 py-2 text-base font-medium text-left text-red-600 transition-colors rounded-md hover:bg-red-50">
                  Logout
                </button>
              </div>
            ) : (
              <Link to="/login" className="block w-full px-4 py-2 text-base font-medium text-center text-white transition-colors bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700">
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;