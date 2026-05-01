import { Routes, Route, Outlet } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import 'react-toastify/dist/ReactToastify.css';

// ✅ Custom Route Guard
import PrivateRoute from "./routes/PrivateRoute";

// 🛠️ Layout Components
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import AdminLayout from "./admin/components/AdminLayout";

// 📄 Public Pages
import Home from "./pages/Home";
import About from "./pages/About";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import CategoriesPage from "./pages/CategoriesPage";
import Quotation from "./pages/Quotation";
import QuoteViewer from "./pages/QuoteViewer";
import QuoteItemViewer from "./pages/QuoteItemViewer";
import Cart from "./pages/Cart";

// 🔐 Authentication Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// 🛍️ Checkout & Orders Pages
import CheckoutPage from "./pages/CheckoutPage";
import OrderSuccess from "./pages/Checkout/OrderSuccess";
import Orders from "./pages/MyOrders";

// 🔥 CLIENT ORDER PAGE IMPORT
import ClientOrderDetail from './pages/ClientOrderDetail';

// 👤 User Specific Pages
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import AddressesPage from './pages/AddressesPage';

// 📜 Footer Legal Pages
import PrivacyPolicy from "./pages/Footer/PrivacyPolicy";
import TermsOfService from "./pages/Footer/TermsOfService";

// 👑 Admin Pages
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
import AdminOrderDetail from './admin/pages/OrderDetail';
import ShippingManagement from './admin/pages/ShippingManagement';
import AdminCreateOrder from './admin/pages/AdminCreateOrder';

/**
 * 🌟 PUBLIC LAYOUT WRAPPER
 */
const PublicLayout = () => {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header />
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

function App() {
  return (
    <>
      <Toaster
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          duration: 2500,
          style: {
            marginTop: '60px',
            background: '#333',
            color: '#fff',
          }
        }}
      />

      <Routes>

        {/* =====================================================================
            👑 ADMIN ROUTES (Protected)
        ====================================================================== */}
        <Route element={<PrivateRoute allowedRoles={['admin', 'subadmin']} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="dashboard" element={<AdminDashboard />} />

            <Route path="products" element={<AdminProducts />} />
            <Route path="products/csv-management" element={<AdminProductCsvManagement />} />
            <Route path="categories" element={<AdminCategoryManagement />} />

            {/* ✅ ORDER ROUTES: 'create' hamesha ':id' se upar hona chahiye */}
            <Route path="orders" element={<AdminOrders />} />
            <Route path="orders/create" element={<AdminCreateOrder />} />
            <Route path="orders/:id" element={<AdminOrderDetail />} />

            <Route path="quotes" element={<QuotesTable />} />
            <Route path="quotes/:id" element={<QuoteEditor />} />

            <Route path="users" element={<AdminUsers />} />
            <Route path="subadmins" element={<AdminUsers />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="shipping" element={<ShippingManagement />} />
          </Route>
        </Route>


        {/* =====================================================================
            🌐 PUBLIC & USER ROUTES (With Header/Footer)
        ====================================================================== */}
        <Route element={<PublicLayout />}>

          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/category/:slug" element={<Products />} />

          <Route path="/quotation" element={<Quotation />} />
          <Route path="/quote/:token" element={<QuoteViewer />} />
          <Route path="/quote/:token/item/:itemId" element={<QuoteItemViewer />} />
          <Route path="/cart" element={<Cart />} />

          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* =====================================================================
              👤 LOGGED-IN USER ROUTES (Protected but with Header/Footer)
          ====================================================================== */}
          <Route element={<PrivateRoute allowedRoles={['user', 'admin', 'subadmin']} />}>
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/order-success" element={<OrderSuccess />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/addresses" element={<AddressesPage />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/:id" element={<ClientOrderDetail />} />
            <Route path="/order/:id" element={<ClientOrderDetail />} />
          </Route>

        </Route>

      </Routes>
    </>
  );
}

export default App;