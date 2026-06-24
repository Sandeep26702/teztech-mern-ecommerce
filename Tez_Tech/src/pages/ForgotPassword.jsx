import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../utils/api";
import { motion } from "framer-motion";
import { Mail, Loader2, ArrowLeft } from "lucide-react";
import myLogo from "../assets/logo.png";

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
    <div 
      className="relative min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#090D16] bg-cover bg-center bg-no-repeat overflow-hidden font-sans text-slate-900 dark:text-slate-200 transition-colors duration-350 p-4"
      style={{ backgroundImage: "url('/a4.jpg')" }}
    >
      {/* Soft overlay when background image is active (No blur to keep image sharp and clear) */}
      <div className="absolute inset-0 z-0 bg-slate-50/20 dark:bg-[#090D16]/40 pointer-events-none"></div>

      {/* Branded Ambient Glows */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-blue-500/10 to-indigo-500/0 blur-[120px] dark:from-blue-600/10"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-indigo-500/10 to-purple-500/0 blur-[120px] dark:from-indigo-600/10"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-[420px] bg-white/90 dark:bg-[#111827]/90 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/80 rounded-2xl shadow-2xl shadow-slate-900/10 dark:shadow-none p-8 sm:p-10 relative z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <Link to="/" className="inline-block mb-5 hover:opacity-90 transition-opacity">
            <img src={myLogo} alt="Tez Tech" className="h-16 w-auto object-contain" />
          </Link>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white text-center">
            Reset Password
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 text-center leading-relaxed">
            Enter your email address and we&apos;ll send you a link to reset your password
          </p>
        </div>

        {/* Alerts */}
        {message && (
          <div className="p-3 mb-5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-150 dark:border-emerald-900/30 rounded-lg">
            {message}
          </div>
        )}
        {error && (
          <div className="p-3 mb-5 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 border border-rose-150 dark:border-rose-900/30 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {/* Email Address */}
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Mail className="h-4.5 w-4.5 text-slate-400 dark:text-slate-500" />
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                disabled={loading}
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm transition-colors duration-200 flex items-center justify-center gap-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-500 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending Link...
              </>
            ) : (
              "Send Reset Link"
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;