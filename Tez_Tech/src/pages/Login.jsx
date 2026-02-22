import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user, isAuthenticated, loading: authLoading } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* ================= AUTO REDIRECT ================= */
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      const from = location.state?.from?.pathname;
      
      if (from) {
        navigate(from, { replace: true });
      } else {
        if (user.role === "admin" || user.role === "subadmin") {
          navigate("/admin/dashboard", { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      }
    }
  }, [isAuthenticated, user, authLoading, navigate, location]);

  /* ================= HANDLE INPUT ================= */
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError(""); 
  };

  /* ================= HANDLE LOGIN ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await login(formData.email, formData.password);
      
      if (!result.success) {
        setError(result.message || "Invalid Email or Password");
        setLoading(false);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  /* ================= FULL PAGE LOADER ================= */
  if (authLoading && !loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <svg className="w-10 h-10 mb-4 text-blue-600 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="font-medium text-gray-500">Checking authentication...</p>
      </div>
    ); 
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-12 font-sans bg-gradient-to-br from-gray-50 to-gray-100 sm:px-6 lg:px-8">
      
      {/* Login Card with Masala Hover Effects */}
      <div className="relative w-full max-w-md p-8 overflow-hidden transition-all duration-300 bg-white border border-gray-100 shadow-xl sm:p-10 rounded-2xl hover:shadow-2xl">
        
        {/* Decorative Top Gradient Line */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-600"></div>

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
            Welcome Back
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Sign in to continue to your account
          </p>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div className="flex items-center gap-3 p-4 mb-6 border-l-4 border-red-500 bg-red-50 rounded-r-md">
            <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-sm font-medium text-red-700">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-5">
            
            {/* Email Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="admin@example.com"
                autoComplete="email"
                className="block w-full px-4 py-3 placeholder-gray-400 transition-colors border border-gray-300 rounded-lg shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-50 focus:bg-white"
              />
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="••••••••"
                autoComplete="current-password"
                className="block w-full px-4 py-3 placeholder-gray-400 transition-colors border border-gray-300 rounded-lg shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-50 focus:bg-white"
              />
            </div>
          </div>

          {/* Forgot Password Link */}
          <div className="flex items-center justify-end">
            <Link 
              to="/forgot-password" 
              className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-500"
            >
              Forgot your password?
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="group w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 mr-2 -ml-1 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Footer / Sign Up Link */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Don&apos;t have an account?{" "}
            <Link 
              to="/register" 
              className="font-semibold text-blue-600 transition-all hover:text-blue-500 hover:underline"
            >
              Sign up
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Login;