import { Routes, Route, Outlet } from "react-router-dom";

// ✅ Custom Route Guard
import PrivateRoute from "./routes/PrivateRoute"; 

// 🛠️ Components Imports
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import PrivacyPolicy from "./pages/Footer/PrivacyPolicy";
import TermsOfService from "./pages/Footer/TermsOfService";
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
import QuoteItemViewer from "./pages/QuoteItemViewer";

// Naye Pages ke Imports
import CheckoutPage from "./pages/CheckoutPage";
import Orders from "./pages/MyOrders";
import OrderDetail from './pages/OrderDetail';

// Pages - User
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import OrderSuccess from "./pages/Checkout/OrderSuccess";

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


// 🌟 NAYA: Public Layout (Header aur Footer yahan handle honge)
const PublicLayout = () => {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header />
      <main style={{ flex: 1 }}>
        <Outlet /> {/* Ye Outlet automatically URL ke hisaab se page change karega bina Home page pe atke */}
      </main>
      <Footer />
    </div>
  );
};

function App() {
  return (
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
      {/* 🌟 NAYA: Yahan humne banaya hua PublicLayout route lagaya hai */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/product/:id" element={<ProductDetail />} /> 

        <Route path="/quotation" element={<Quotation />} />
        
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/category/:slug" element={<Products />} />
        <Route path="/quote/:token" element={<QuoteViewer />} />
        <Route path="/quote/:token/item/:itemId" element={<QuoteItemViewer />} />

        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<CheckoutPage />} />
         <Route path="/order-success" element={<OrderSuccess />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />

        {/* Logged In User Routes */}
        <Route element={<PrivateRoute allowedRoles={['user', 'admin', 'subadmin']} />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/:id" element={<OrderDetail />} />
          <Route path="/addresses" element={<AddressesPage />} />
          <Route path="/order/:id" element={<OrderDetail />} />
        </Route>
      </Route>

    </Routes>
  );
}

export default App;