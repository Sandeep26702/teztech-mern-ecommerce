import { Routes, Route } from "react-router-dom";

/* ROUTE GUARDS */
import ProtectedRoute from "./components/ProtectedRoute";
import GuestRoute from "./components/GuestRoute";
import AdminRoute from "./components/AdminRoute";

/* LAYOUT */
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";

/* USER PAGES */
import Home from "./pages/Home";
import About from "./pages/About";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Career from "./pages/Career";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Products from "./pages/Products";
import ProductItems from "./pages/ProductItems";
import Cart from "./pages/Cart";
import Quotation from "./pages/Quotation";
import JobApply from "./pages/JobApply";

/* ADMIN PAGES */
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

          {/* ================= PUBLIC ================= */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:categoryId" element={<ProductItems />} />
          <Route path="/career" element={<Career />} />
          <Route path="/apply-job" element={<JobApply />} />
          <Route path="/quotation" element={<Quotation />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />


          {/* ================= GUEST ONLY ================= */}
          <Route
            path="/login"
            element={
              <GuestRoute>
                <Login />
              </GuestRoute>
            }
          />

          <Route
            path="/register"
            element={
              <GuestRoute>
                <Register />
              </GuestRoute>
            }
          />

          

          {/* ================= PROTECTED ================= */}
          <Route
            path="/cart"
            element={
              <ProtectedRoute>
                <Cart />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />



          {/* 🔐 ADMIN */}
          <Route
            path="/admin/dashboard"
            element={
             <AdminRoute>
             <AdminDashboard />
               </AdminRoute>
             }
            />

          <Route
          path="/admin/users"
          element={
          <AdminRoute>
          <AdminUsers />
             </AdminRoute>
          }
         />

          {/* ================= ADMIN (later add AdminRoute) ================= */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/analytics" element={<AdminAnalytics />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
          

        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default App;
