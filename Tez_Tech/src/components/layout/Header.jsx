import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext"; // Path check kar lijiyega

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
            <Link to="/" className={navLinkClass}>Home<span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span></Link>
            <Link to="/products" className={navLinkClass}>Products<span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span></Link>
            <Link to="/categories" className={navLinkClass}>Categories<span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span></Link>
            <Link to="/quotation" className={navLinkClass}>Quotation<span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span></Link>
            <Link to="/about" className={navLinkClass}>About<span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span></Link>

            {user?.role === "admin" && (
              <Link to="/admin/dashboard" className="px-3 py-1.5 text-sm font-bold text-purple-700 bg-purple-100 rounded-full hover:bg-purple-200 transition-colors ml-2">
                Admin Panel
              </Link>
            )}

            {/* 👤 AUTH SECTION WITH FLIPKART STYLE DROPDOWN */}
            <div className="flex items-center gap-4 pl-4 ml-2 border-l border-gray-200">
              {isAuthenticated ? (
                <>
                  <Link to="/cart" className="relative p-2 text-gray-600 transition-colors hover:text-blue-600">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </Link>

                  {/* 👇 YAHAN MAGIC HAI: Dropdown Wrapper */}
                  <div className="relative group">
                    
                    {/* Trigger Button (User Name) */}
                    <button className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-sm font-medium text-gray-700 cursor-pointer">
                      <div className="flex items-center justify-center w-6 h-6 text-xs text-white bg-blue-600 rounded-full">
                        {user?.name?.charAt(0).toUpperCase() || "U"}
                      </div>
                      <span className="max-w-[100px] truncate">{user?.name || "Account"}</span>
                      {/* Down Arrow */}
                      <svg className="w-4 h-4 text-gray-400 transition-transform group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Flipkart Style Dropdown Menu (Hidden by default, shows on hover) */}
                    <div className="absolute right-0 z-50 invisible pt-3 transition-all duration-300 opacity-0 w-60 group-hover:visible group-hover:opacity-100">
                      <div className="py-2 bg-white border border-gray-100 shadow-xl rounded-xl">
                        
                        {/* 1. My Profile */}
                        <Link to="/profile" className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-600">
                          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          My Profile
                        </Link>
                        
                        {/* 2. Orders */}
                        <Link to="/orders" className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-600">
                          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                          Orders
                        </Link>

                        {/* 3. Wishlist (Optional future feature) */}
                        <Link to="/wishlist" className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-600">
                          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                          Wishlist
                        </Link>

                        <hr className="my-1 border-gray-100" />

                        {/* 4. Logout */}
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
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 📱 MOBILE DROPDOWN MENU */}
      {isMenuOpen && (
        <div className="absolute left-0 w-full duration-200 bg-white border-t border-gray-100 shadow-lg md:hidden animate-in slide-in-from-top-2">
          <div className="px-4 pt-2 pb-4 space-y-1 overflow-y-auto max-h-[80vh]">
            <Link to="/" className="block px-3 py-2 text-base font-medium text-gray-700 transition-colors rounded-md hover:text-blue-600 hover:bg-blue-50">Home</Link>
            <Link to="/products" className="block px-3 py-2 text-base font-medium text-gray-700 transition-colors rounded-md hover:text-blue-600 hover:bg-blue-50">Products</Link>
            <Link to="/categories" className="block px-3 py-2 text-base font-medium text-gray-700 transition-colors rounded-md hover:text-blue-600 hover:bg-blue-50">Categories</Link>
            <Link to="/quotation" className="block px-3 py-2 text-base font-medium text-gray-700 transition-colors rounded-md hover:text-blue-600 hover:bg-blue-50">Quotation</Link>
            <Link to="/about" className="block px-3 py-2 text-base font-medium text-gray-700 transition-colors rounded-md hover:text-blue-600 hover:bg-blue-50">About</Link>
            
            {user?.role === "admin" && (
              <Link to="/admin/dashboard" className="block px-3 py-2 mt-2 text-base font-bold text-purple-700 transition-colors rounded-md bg-purple-50 hover:bg-purple-100">
                Admin Panel
              </Link>
            )}
          </div>

          <div className="px-4 pt-4 pb-4 border-t border-gray-200">
            {isAuthenticated ? (
              <div className="space-y-1">
                {/* Mobile version of dropdown items */}
                <Link to="/profile" className="flex items-center gap-3 px-3 py-3 text-base font-medium text-gray-700 rounded-md hover:bg-blue-50 hover:text-blue-600">
                  <div className="flex items-center justify-center w-8 h-8 font-bold text-white bg-blue-600 rounded-full">
                    {user?.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  My Profile
                </Link>
                <Link to="/orders" className="flex items-center gap-3 px-3 py-3 text-base font-medium text-gray-700 rounded-md hover:bg-blue-50 hover:text-blue-600">
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                  My Orders
                </Link>
                <button onClick={handleLogout} className="flex items-center w-full gap-3 px-3 py-3 text-base font-medium text-left text-red-600 transition-colors rounded-md hover:bg-red-50">
                  <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
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