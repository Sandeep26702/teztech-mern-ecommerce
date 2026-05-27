import { Routes, Route, Outlet } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import 'react-toastify/dist/ReactToastify.css';
import { lazy, Suspense } from "react";

// ✅ Custom Route Guards
import PrivateRoute from "./routes/PrivateRoute";
import ProtectedRoute from "./routes/ProtectedRoute";

// 🛠️ Layout Components
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import AdminLayout from "./admin/components/AdminLayout";

// 📄 Public Pages
const Home = lazy(() => import("./pages/Home"));
const About = lazy(() => import("./pages/About"));
const Products = lazy(() => import("./pages/Products"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const CategoriesPage = lazy(() => import("./pages/CategoriesPage"));
const Quotation = lazy(() => import("./pages/Quotation"));
const QuoteViewer = lazy(() => import("./pages/QuoteViewer"));
const QuoteItemViewer = lazy(() => import("./pages/QuoteItemViewer"));
const Cart = lazy(() => import("./pages/Cart"));

// 🔐 Authentication Pages
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const VerifyOtp = lazy(() => import("./pages/VerifyOtp"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

// 🛍️ Checkout & Orders Pages
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const OrderSuccess = lazy(() => import("./pages/Checkout/OrderSuccess"));
const Orders = lazy(() => import("./pages/MyOrders"));

// 🔥 CLIENT ORDER PAGE IMPORT
const ClientOrderDetail = lazy(() => import('./pages/ClientOrderDetail'));

// 👤 User Specific Pages
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Profile = lazy(() => import("./pages/Profile"));
const AddressesPage = lazy(() => import('./pages/AddressesPage'));

// 📜 Footer Legal Pages
const PrivacyPolicy = lazy(() => import("./pages/Footer/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/Footer/TermsOfService"));

// 👑 Admin Pages
const AdminDashboard = lazy(() => import("./admin/pages/AdminDashboard"));
const AdminProducts = lazy(() => import("./admin/pages/AdminProducts"));
const AdminProductCsvManagement = lazy(() => import("./admin/pages/AdminProductCsvManagement"));
const AddProductManually = lazy(() => import("./admin/pages/AddProductManually"));
const AdminCategoryManagement = lazy(() => import("./admin/pages/AdminCategoryManagement"));
const AdminOrders = lazy(() => import("./admin/pages/AdminOrders"));
const AdminUsers = lazy(() => import("./admin/pages/AdminUsers"));
const AdminAnalytics = lazy(() => import("./admin/pages/AdminAnalytics"));
const AdminSettings = lazy(() => import("./admin/pages/AdminSettings"));
const QuotesTable = lazy(() => import("./admin/pages/QuotesTable"));
const QuoteEditor = lazy(() => import("./admin/pages/QuoteEditor"));
const AdminLogs = lazy(() => import("./admin/pages/AdminLogs"));
const AdminOrderDetail = lazy(() => import('./admin/pages/OrderDetail'));
const ShippingManagement = lazy(() => import('./admin/pages/ShippingManagement'));
const AdminCreateOrder = lazy(() => import('./admin/pages/AdminCreateOrder'));
const UserView = lazy(() => import('./admin/pages/UserView'));

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

/**
 * 🌀 PREMIUM LOADING SPINNER FALLBACK
 */
const LoadingFallback = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] w-full bg-gray-50/50">
    <div className="relative w-16 h-16">
      <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
      <div className="absolute inset-0 border-4 border-t-blue-600 rounded-full animate-spin"></div>
    </div>
    <p className="mt-4 text-sm font-semibold tracking-wider text-gray-500 animate-pulse uppercase">
      Loading Tez Tech...
    </p>
  </div>
);

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

      <Suspense fallback={<LoadingFallback />}>
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
              {/* 🔥 NAYI ROUTE ADD KI GAYI HAI 👇 */}
              <Route path="products/add" element={<AddProductManually />} />
              <Route path="products/edit/:id" element={<AddProductManually />} />
              <Route path="categories" element={<AdminCategoryManagement />} />

              {/* ✅ ORDER ROUTES: 'create' hamesha ':id' se upar hona chahiye */}
              <Route path="orders" element={<AdminOrders />} />
              <Route path="orders/create" element={<AdminCreateOrder />} />
              <Route path="orders/:id" element={<AdminOrderDetail />} />

              <Route path="quotes" element={<QuotesTable />} />
              <Route path="quotes/:id" element={<QuoteEditor />} />

              <Route path="users" element={<AdminUsers />} />
              <Route path="subadmins" element={<AdminUsers />} />
              <Route path="logs" element={<AdminLogs />} /> {/* 🔥 Traffic Logs */}
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="shipping" element={<ShippingManagement />} />
              <Route path="layout" element={<UserView />} />
            </Route>
          </Route>


          {/* =====================================================================
              🌐 PUBLIC & GATED USER ROUTES (With Header/Footer)
          ====================================================================== */}
          <Route element={<PublicLayout />}>

            {/* 🟢 FULLY PUBLIC ROUTES */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-otp" element={<VerifyOtp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />

            {/* 🔒 GATED CONTENT (Requires Login, but no specific role) */}
            <Route element={<ProtectedRoute />}>
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
            </Route>

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
      </Suspense>
    </>
  );
}

export default App;