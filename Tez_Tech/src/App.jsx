import { Routes, Route } from "react-router-dom";

// ✅ Custom Route Guard
import PrivateRoute from "./routes/PrivateRoute"; 

// 🛠️ YEH RAHI MISSING IMPORTS (Header, Footer, aur AdminLayout)
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import AdminLayout from "./admin/components/AdminLayout"; 

// Pages - Public
import Home from "./pages/Home";
import About from "./pages/About";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword"; 
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail"; // 🚀 Naya Product Detail Page
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
      
      <Routes>
        {/* ================= ADMIN ROUTES (No Main Header/Footer) ================= */}
        <Route element={<PrivateRoute allowedRoles={['admin', 'subadmin']} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} /> 
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
        </Route>

        {/* ================= PUBLIC & USER ROUTES (With Header/Footer) ================= */}
        <Route path="*" element={
          <>
            <Header /> {/* 👈 Ab error nahi aayega, upar import ho gaya hai */}
            <main style={{ flex: 1 }}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/products" element={<Products />} />
                
                {/* 🚀 Yahan id se product details page khulega */}
                <Route path="/products/:id" element={<ProductDetail />} />
                
                <Route path="/quotation" element={<Quotation />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />

                {/* Logged In User Routes */}
                <Route element={<PrivateRoute allowedRoles={['user', 'admin', 'subadmin']} />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/orders/:id" element={<OrderDetail />} />
                </Route>
              </Routes>
            </main>
            <Footer /> {/* 👈 Footer bhi upar import ho gaya hai */}
          </>
        } />

      </Routes>
      
    </div>
  );
}

export default App;