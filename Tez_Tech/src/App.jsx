import { Routes, Route } from "react-router-dom";

// ✅ Custom Route Guard
import PrivateRoute from "./routes/PrivateRoute"; 

// 🛠️ Components Imports
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import AdminLayout from "./admin/components/AdminLayout"; 
import CategoriesPage from "./pages/CategoriesPage"; 

// Pages - Public
import Home from "./pages/Home";
import About from "./pages/About";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword"; 
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail"; 
import Quotation from "./pages/Quotation";
import Cart from "./pages/Cart";
import AddressesPage from './pages/AddressesPage'; 
import QuoteViewer from "./pages/QuoteViewer"; 

// 👇 YAHAN ADD KIYA HAI: Naye Pages ke Imports
import CheckoutPage from "./pages/CheckoutPage";
import Orders from "./pages/MyOrders";
import OrderDetail from './pages/OrderDetail';

// Pages - User
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";


// Pages - Admin
import AdminDashboard from "./admin/pages/AdminDashboard";
import AdminProducts from "./admin/pages/AdminProducts";
import AdminProductCsvManagement from "./admin/pages/AdminProductCsvManagement";
import AdminCategoryManagement from "./admin/pages/AdminCategoryManagement";
import AdminOrders from "./admin/pages/AdminOrders";
import AdminUsers from "./admin/pages/AdminUsers";
import AdminAnalytics from "./admin/pages/AdminAnalytics";
import AdminSettings from "./admin/pages/AdminSettings";
import QuotesTable from "./admin/pages/QuotesTable";
import QuoteEditor from "./admin/pages/QuoteEditor";

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
            <Route path="products/csv-management" element={<AdminProductCsvManagement />} />
            <Route path="categories" element={<AdminCategoryManagement />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="orders/:id" element={<OrderDetail />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="subadmins" element={<AdminUsers />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="settings" element={<AdminSettings />} />
            
            <Route path="quotes" element={<QuotesTable />} />
            <Route path="quotes/:id" element={<QuoteEditor />} />
          </Route>
        </Route>

        {/* ================= PUBLIC & USER ROUTES (With Header/Footer) ================= */}
        <Route path="*" element={
          <>
            <Header /> 
            <main style={{ flex: 1 }}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/products" element={<Products />} />
                <Route path="/products/:id" element={<ProductDetail />} />
                <Route path="/quotation" element={<Quotation />} />
                
                <Route path="/categories" element={<CategoriesPage />} />
                <Route path="/category/:slug" element={<Products />} />
                <Route path="/quote/:token" element={<QuoteViewer />} />

                <Route path="/cart" element={<Cart />} />
                
                {/* 👇 YAHAN ADD KIYA HAI: Checkout Page ka Route */}
                <Route path="/checkout" element={<CheckoutPage />} />

                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />

                {/* Logged In User Routes (Protect kiye gaye hain) */}
                <Route element={<PrivateRoute allowedRoles={['user', 'admin', 'subadmin']} />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/profile" element={<Profile />} />
                  
                  {/* 👇 YAHAN ADD KIYA HAI: Orders aur Address ke Routes */}
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/orders/:id" element={<OrderDetail />} />
                  <Route path="/addresses" element={<AddressesPage />} />
                  <Route path="/order/:id" element={<OrderDetail />} />
                </Route>
              </Routes>
            </main>
            <Footer /> 
          </>
        } />

      </Routes>
      
    </div>
  );
}

export default App;
