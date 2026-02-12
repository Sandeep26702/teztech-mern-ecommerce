import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import "../../styles/components/Header.css";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      logout();
      navigate("/login");
    }
  };
//admi role 11/02/26
  {user?.role === "admin" && (
  <Link to="/admin/dashboard">Admin Panel</Link>
)}


  return (
    <header className="header">
      <div className="header-container">
        <div className="header-content">
          <div className="header-left">
            <button
              className={`menu-toggle ${isMenuOpen ? "active" : ""}`}
              onClick={toggleMenu}
            >
              <span className="hamburger"></span>
              <span className="hamburger"></span>
              <span className="hamburger"></span>
            </button>

            <h1 className="header-title">SONANI ELECTRONICS</h1>
          </div>

          {/* 🔑 NAV LINKS */}
          <nav className={`header-nav ${isMenuOpen ? "nav-open" : ""}`}>
            <Link to="/" className="header-link">Home</Link>
            <Link to="/products" className="header-link">Products</Link>
            <Link to="/quotation" className="header-link">Quotation</Link>
            <Link to="/about" className="header-link">About</Link>

            {isAuthenticated ? (
              <>
                <Link to="/cart" className="header-link">Cart</Link>
                <Link to="/profile" className="header-link">
                  {user?.name || "Profile"}
                </Link>

                <button
                  className="header-link logout-btn"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </>
            ) : (
              <Link to="/login" className="header-link">Login</Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
