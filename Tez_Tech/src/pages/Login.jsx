import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import { Mail, Lock, Sparkles, ShieldCheck, Zap, ArrowRight, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user, isAuthenticated, loading: authLoading } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login(formData.email, formData.password);
      
      if (!result.success) {
        toast.error(result.message || "Invalid Email or Password");
        setLoading(false);

        // If the user's account is not verified, redirect to verification page
        if (result.isVerified === false) {
          toast("Redirecting to verification...", { icon: '🔄' });
          setTimeout(() => {
            navigate("/verify-otp", { state: { email: formData.email } });
          }, 2000);
        }
      } else {
        toast.success("Welcome back!");
      }
    } catch (err) {
      toast.error("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  /* ================= FULL PAGE LOADER ================= */
  if (authLoading && !loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-500">
        <Loader2 className="w-12 h-12 text-blue-600 dark:text-blue-500 animate-spin mb-4" />
        <p className="font-medium text-gray-500 dark:text-slate-400">Checking authentication...</p>
      </div>
    ); 
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 overflow-hidden font-sans text-gray-900 dark:text-slate-200 transition-colors duration-500">
      
      {/* --- Premium Animated Background --- */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 -right-40 w-96 h-96 bg-blue-400/30 dark:bg-blue-600/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-0 -left-40 w-96 h-96 bg-purple-400/30 dark:bg-purple-600/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] animate-pulse" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-300/20 dark:bg-indigo-900/10 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[120px]"></div>
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIj48ZmlsdGVyIGlkPSJuIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMC42NSIgbnVtT2N0YXZlcz0iMyIgc3RpdGNoVGlsZXM9InN0aXRjaCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNuKSIgb3BhY2l0eT0iMC4xNSIvPjwvc3ZnPg==')] opacity-10 dark:opacity-30 mix-blend-overlay pointer-events-none"></div>
      </div>

      {/* --- Main Container: Split Screen on Desktop (Reversed for Login) --- */}
      <div className="relative z-10 w-full max-w-6xl p-4 sm:p-8 flex flex-col lg:flex-row-reverse items-stretch justify-center gap-8 lg:gap-0">
        
        {/* LEFT/RIGHT SIDE: Branding / Value Prop */}
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="hidden md:flex flex-col justify-center w-full lg:w-5/12 lg:pl-12 xl:pl-16"
        >
          <div className="mb-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/60 dark:bg-white/5 border border-gray-200 dark:border-white/10 w-max backdrop-blur-sm shadow-sm">
            <Sparkles size={16} className="text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium tracking-wide text-blue-700 dark:text-blue-300">Welcome Back</span>
          </div>
          
          <h1 className="text-5xl lg:text-6xl font-black tracking-tight mb-6 leading-tight text-gray-900 dark:text-white">
            Sign in to <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-500">
              Your Dashboard
            </span>
          </h1>
          
          <p className="text-lg text-gray-600 dark:text-slate-400 mb-10 leading-relaxed max-w-md">
            Access your orders, manage your profile, and explore the latest innovations in lighting technology.
          </p>

          <div className="space-y-6">
            <FeatureItem icon={<ShieldCheck size={24} className="text-emerald-500 dark:text-emerald-400"/>} title="Bank-Grade Security" desc="Your account is protected by industry-leading security." />
            <FeatureItem icon={<Zap size={24} className="text-amber-500 dark:text-amber-400"/>} title="Instant Access" desc="One-click login gets you straight to what you need." />
          </div>
        </motion.div>

        {/* FORM SIDE: The Form Card with Glassmorphism */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="w-full max-w-md mx-auto lg:mx-0 lg:w-7/12"
        >
          {/* Animated border wrapper */}
          <div className="relative p-[1px] rounded-[2rem] overflow-hidden group shadow-2xl shadow-blue-900/5 dark:shadow-blue-900/20">
            <div className="absolute inset-[-1000%] animate-[spin_5s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,rgba(0,0,0,0)_0%,#3b82f6_25%,rgba(0,0,0,0)_50%,#a855f7_75%,rgba(0,0,0,0)_100%)] opacity-20 dark:opacity-50 group-hover:opacity-40 dark:group-hover:opacity-100 transition-opacity duration-500"></div>
            
            {/* Form Box */}
            <div className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[1.95rem] p-8 sm:p-10 border border-white/40 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none">
              
              {/* Mobile Header (Only shows on mobile) */}
              <div className="md:hidden text-center mb-8">
                <h2 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-500">Tez Tech</h2>
                <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Sign in to your account</p>
              </div>

              <div className="mb-8 hidden md:block">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Login</h2>
                <p className="text-gray-500 dark:text-slate-400 text-sm">Enter your credentials to continue.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                
                <InputGroup disabled={loading} label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} />
                
                <div className="space-y-2">
                  <InputGroup disabled={loading} label="Password" name="password" type="password" value={formData.password} onChange={handleChange} />
                  <div className="flex justify-end">
                    <Link to="/forgot-password" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                      Forgot Password?
                    </Link>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  disabled={loading}
                  type="submit"
                  className={`w-full mt-8 py-4 rounded-xl font-bold tracking-wide transition-all duration-300 flex items-center justify-center gap-3 shadow-lg 
                    ${loading 
                      ? "bg-gray-200 dark:bg-slate-800 text-gray-500 dark:text-slate-400 cursor-not-allowed border border-transparent dark:border-white/5" 
                      : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-blue-500/25 hover:shadow-blue-500/40 border border-blue-500/30"
                    }`}
                >
                  {loading ? (
                    <>
                      <Loader2 size={20} className="animate-spin text-blue-600 dark:text-blue-400" />
                      Signing In...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight size={18} />
                    </>
                  )}
                </motion.button>
              </form>

              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-white/10 text-center">
                <p className="text-sm text-gray-600 dark:text-slate-400">
                  Don&apos;t have an account?{" "}
                  <Link to="/register" className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors inline-flex items-center gap-1 group">
                    Create Account
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </p>
              </div>

            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
};

// Sub-component for features on the left
const FeatureItem = ({ icon, title, desc }) => (
  <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/60 dark:bg-white/5 border border-gray-100 dark:border-white/5 backdrop-blur-sm transition-colors hover:bg-white/80 dark:hover:bg-white/10 max-w-sm shadow-sm dark:shadow-none">
    <div className="p-3 bg-gray-50 dark:bg-slate-900/50 rounded-xl border border-gray-200 dark:border-white/5">
      {icon}
    </div>
    <div>
      <h4 className="text-gray-900 dark:text-white font-semibold mb-1">{title}</h4>
      <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed">{desc}</p>
    </div>
  </div>
);

// Glassmorphism Input Group
const InputGroup = ({ label, disabled, ...props }) => (
  <div className="relative group">
    <input
      {...props}
      disabled={disabled}
      required
      placeholder=" "
      className={`peer w-full px-4 pt-6 pb-2 rounded-xl outline-none transition-all duration-300 backdrop-blur-md relative z-10 text-sm sm:text-base font-medium tracking-wide shadow-inner
        ${disabled 
          ? 'bg-gray-100 dark:bg-slate-800/30 border-gray-200 dark:border-slate-700/30 text-gray-500 dark:text-slate-500 cursor-not-allowed' 
          : 'bg-white/60 dark:bg-slate-900/50 border border-gray-300 dark:border-slate-700/50 text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800/80 hover:border-gray-400 dark:hover:border-slate-600/80'
        }`}
    />
    <label className={`absolute z-20 left-4 transition-all duration-300 pointer-events-none origin-[0]
      top-1/2 -translate-y-1/2 text-sm font-medium
      peer-focus:top-3.5 peer-focus:-translate-y-0 peer-focus:scale-75 peer-focus:font-bold peer-focus:uppercase peer-focus:tracking-wider
      peer-[&:not(:placeholder-shown)]:top-3.5 peer-[&:not(:placeholder-shown)]:-translate-y-0 peer-[&:not(:placeholder-shown)]:scale-75 peer-[&:not(:placeholder-shown)]:font-bold peer-[&:not(:placeholder-shown)]:uppercase peer-[&:not(:placeholder-shown)]:tracking-wider
      ${disabled ? 'text-gray-400 dark:text-slate-600' : 'text-gray-500 dark:text-slate-400 peer-focus:text-blue-600 dark:peer-focus:text-blue-400'}`}>
      {label}
    </label>
  </div>
);

export default Login;