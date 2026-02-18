import { Routes, Route } from "react-router-dom";

// ✅ Import custom Route Guard
import PrivateRoute from "./routes/PrivateRoute"; 

// Layouts
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";

// Pages - Public
import Home from "./pages/Home";
import About from "./pages/About";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword"; // ✅ New Import
import Products from "./pages/Products";
import Quotation from "./pages/Quotation";
import Cart from "./pages/Cart";

// Pages - User
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import OrderDetail from "./pages/OrderDetail";

// Pages - Admin
import AdminDashboard from "./admin/pages/AdminDashboard";
import AdminProducts from "./admin/pages/AdminProducts";
import AdminOrders from "./admin/pages/AdminOrders";
import AdminUsers from "./admin/pages/AdminUsers";
import AdminAnalytics from "./admin/pages/AdminAnalytics";
import AdminSettings from "./admin/pages/AdminSettings";

function App() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header />

      <main style={{ flex: 1 }}>
        <Routes>
          {/* ================= PUBLIC ROUTES ================= */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/products" element={<Products />} />
          <Route path="/quotation" element={<Quotation />} />
          <Route path="/cart" element={<Cart />} />

          {/* Login/Register ke liye 'GuestRoute' ki zarurat nahi hai 
             kyunki 'Login.jsx' ke andar humne useEffect lagaya hai 
             jo logged-in user ko dashboard bhej deta hai.
          */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* ================= LOGGED IN USER ROUTES ================= */}
          {/* Allowed: User, Admin, Subadmin */}
          <Route element={<PrivateRoute allowedRoles={['user', 'admin', 'subadmin']} />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/orders/:id" element={<OrderDetail />} />
          </Route>

          {/* ================= ADMIN ONLY ROUTES ================= */}
          {/* Allowed: Admin, Subadmin */}
          <Route element={<PrivateRoute allowedRoles={['admin', 'subadmin']} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/products" element={<AdminProducts />} />
            <Route path="/admin/orders" element={<AdminOrders />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/analytics" element={<AdminAnalytics />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
          </Route>

        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default App;