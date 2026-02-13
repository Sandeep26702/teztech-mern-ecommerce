import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useCart } from "../context/CartContext";

const Navbar = () => {
  const navigate = useNavigate();
  const { getCartItemsCount } = useCart();
  const [open, setOpen] = useState(false);

  return (
    <nav className="navbar navbar-light bg-light px-4">
      <h4 style={{ cursor: "pointer" }} onClick={() => navigate("/")}>
        MyShop
      </h4>

      <div className="d-flex align-items-center gap-3 position-relative">
        {/* 🛒 CART */}
        <button
          className="btn btn-outline-primary"
          onClick={() => navigate("/cart")}
        >
          Cart ({getCartItemsCount()})
        </button>

        {/* 👤 PROFILE */}
        <div style={{ position: "relative" }}>
          <button
            className="btn btn-outline-dark"
            onClick={() => setOpen(!open)}
          >
            👤 Profile ▾
          </button>

          {open && (
            <div
              className="position-absolute bg-white border rounded shadow p-2"
              style={{ right: 0, top: "110%", minWidth: 160 }}
            >
              <button
                className="dropdown-item"
                onClick={() => {
                  navigate("/my-orders");
                  setOpen(false);
                }}
              >
                My Orders
              </button>

              <button
                className="dropdown-item"
                onClick={() => {
                  navigate("/profile");
                  setOpen(false);
                }}
              >
                My Profile
              </button>

              <hr />

              <button
                className="dropdown-item text-danger"
                onClick={() => {
                  localStorage.removeItem("token");
                  navigate("/login");
                }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
