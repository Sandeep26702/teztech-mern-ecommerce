import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../utils/api"; // Axios instance with interceptors
import { FaEnvelope } from "react-icons/fa"; // Added an envelope icon for a premium design

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    try {
      setLoading(true);

      const res = await api.post("/auth/forgot-password", {
        email: email.trim().toLowerCase()
      });

      setMessage(res.data.message || "Reset link sent to your email");
      setEmail("");
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to send reset link. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-10 font-sans bg-gray-50 sm:px-6 lg:px-8">
      <div className="w-full max-w-md p-8 bg-white border border-gray-100 shadow-2xl rounded-3xl sm:p-10">
        
        {/* 🌟 Header Section */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 bg-blue-100 rounded-full">
            <FaEnvelope className="text-2xl text-blue-600" />
          </div>
          <h1 className="mb-2 text-3xl font-extrabold text-gray-900">
            Reset Password
          </h1>
          <p className="text-sm text-gray-500">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        {/* 🚨 Alerts */}
        {message && (
          <div className="p-4 mb-6 text-sm text-green-700 bg-green-100 border border-green-200 rounded-xl">
            {message}
          </div>
        )}
        {error && (
          <div className="p-4 mb-6 text-sm text-red-700 bg-red-100 border border-red-200 rounded-xl">
            {error}
          </div>
        )}

        {/* 📝 Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          <div>
            <label className="block mb-2 text-sm font-semibold text-gray-700" htmlFor="email">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 transition-all duration-200 border border-gray-200 bg-gray-50 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="name@company.com"
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center w-full gap-2 px-8 py-4 font-bold text-white transition-all duration-300 transform bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl hover:from-blue-700 hover:to-cyan-600 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? (
              <>
                <svg className="w-5 h-5 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending Link...
              </>
            ) : (
              "Send Reset Link"
            )}
          </button>
        </form>

        {/* 🔗 Back to Login */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Remember your password?{" "}
            <Link to="/login" className="font-semibold text-blue-600 transition-colors hover:text-blue-500 hover:underline">
              Back to Login
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default ForgotPassword;