import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";
import { FaKey } from "react-icons/fa"; // 🔑 Ek badhiya icon add kiya hai

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!password || !confirmPassword) {
      setError("All fields are required");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      const res = await api.put(`/auth/reset-password/${token}`, {
        password
      });

      setMessage(res.data.message || "Password reset successful 🎉");

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Invalid or expired reset link 😔"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    // 🌟 Premium Background Gradient
    <div className="flex items-center justify-center min-h-screen px-4 py-10 font-sans bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100 via-white to-purple-50 sm:px-6 lg:px-8">
      
      {/* 💳 Tadka Bhadka Card */}
      <div className="w-full max-w-md p-8 bg-white border border-white shadow-2xl rounded-3xl sm:p-10 backdrop-blur-sm bg-opacity-90">
        
        {/* 🌟 Header Section */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 shadow-inner bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-indigo-200">
            <FaKey className="text-2xl text-white transform -rotate-45" />
          </div>
          <h1 className="mb-2 text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
            New Password
          </h1>
          <p className="text-sm font-medium text-gray-500">
            Your new password must be different from previously used passwords.
          </p>
        </div>

        {/* 🚨 Alerts (Error / Success) */}
        {error && (
          <div className="p-4 mb-6 text-sm font-semibold text-red-700 border bg-red-50 border-red-200/60 rounded-xl">
            {error}
          </div>
        )}
        {message && (
          <div className="p-4 mb-6 text-sm font-semibold text-green-700 border bg-green-50 border-green-200/60 rounded-xl">
            {message}
          </div>
        )}

        {/* 📝 Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          
          {/* New Password */}
          <div>
            <label htmlFor="password" className="block mb-2 text-sm font-bold text-gray-700">
              New Password <span className="text-red-500">*</span>
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              placeholder="••••••••"
              className="w-full px-4 py-3 font-medium transition-all duration-200 border border-gray-200 bg-gray-50/50 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block mb-2 text-sm font-bold text-gray-700">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              placeholder="••••••••"
              className="w-full px-4 py-3 font-medium transition-all duration-200 border border-gray-200 bg-gray-50/50 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
          </div>

          {/* 🚀 Submit Button */}
          <button
            type="submit"
            disabled={loading || message !== ""}
            className="flex items-center justify-center w-full gap-2 px-8 py-4 mt-2 font-bold text-white transition-all duration-300 transform shadow-lg bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 rounded-xl hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? (
              <>
                <svg className="w-5 h-5 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving Changes...
              </>
            ) : message ? (
              "Redirecting to Login..."
            ) : (
              "Reset Password"
            )}
          </button>

        </form>
      </div>
    </div>
  );
};

export default ResetPassword;