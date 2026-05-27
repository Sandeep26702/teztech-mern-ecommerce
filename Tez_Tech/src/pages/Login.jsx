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
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
        <p className="font-medium text-slate-400">Checking authentication...</p>
      </div>
    ); 
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-950 overflow-hidden font-sans text-slate-200">
      
      {/* --- Premium Animated Background --- */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 -right-40 w-96 h-96 bg-blue-600/20 rounded-full mix-blend-screen filter blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-0 -left-40 w-96 h-96 bg-purple-600/20 rounded-full mix-blend-screen filter blur-[100px] animate-pulse" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-900/10 rounded-full mix-blend-screen filter blur-[120px]"></div>
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
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
          <div className="mb-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 w-max backdrop-blur-sm">
            <Sparkles size={16} className="text-blue-400" />
            <span className="text-sm font-medium tracking-wide text-blue-300">Welcome Back</span>
          </div>
          
          <h1 className="text-5xl lg:text-6xl font-black tracking-tight mb-6 leading-tight">
            Sign in to <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500">
              Your Dashboard
            </span>
          </h1>
          
          <p className="text-lg text-slate-400 mb-10 leading-relaxed max-w-md">
            Access your orders, manage your profile, and explore the latest innovations in lighting technology.
          </p>

          <div className="space-y-6">
            <FeatureItem icon={<ShieldCheck size={24} className="text-emerald-400"/>} title="Bank-Grade Security" desc="Your account is protected by industry-leading security." />
            <FeatureItem icon={<Zap size={24} className="text-amber-400"/>} title="Instant Access" desc="One-click login gets you straight to what you need." />
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
          <div className="relative p-[1px] rounded-[2rem] overflow-hidden group shadow-2xl shadow-blue-900/20">
            <div className="absolute inset-[-1000%] animate-[spin_5s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,rgba(0,0,0,0)_0%,#3b82f6_25%,rgba(0,0,0,0)_50%,#a855f7_75%,rgba(0,0,0,0)_100%)] opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            {/* Form Box */}
            <div className="relative bg-slate-900/80 backdrop-blur-xl rounded-[1.95rem] p-8 sm:p-10 border border-white/10">
              
              {/* Mobile Header (Only shows on mobile) */}
              <div className="md:hidden text-center mb-8">
                <h2 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Tez Tech</h2>
                <p className="text-slate-400 text-sm mt-1">Sign in to your account</p>
              </div>

              <div className="mb-8 hidden md:block">
                <h2 className="text-2xl font-bold text-white mb-2">Login</h2>
                <p className="text-slate-400 text-sm">Enter your credentials to continue.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                
                <InputGroup disabled={loading} icon={<Mail size={18}/>} name="email" type="email" placeholder="Email Address" value={formData.email} onChange={handleChange} />
                
                <div className="space-y-2">
                  <InputGroup disabled={loading} icon={<Lock size={18}/>} name="password" type="password" placeholder="Password" value={formData.password} onChange={handleChange} />
                  <div className="flex justify-end">
                    <Link to="/forgot-password" className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors">
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
                      ? "bg-slate-800 text-slate-400 cursor-not-allowed border border-white/5" 
                      : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-blue-500/25 hover:shadow-blue-500/40 border border-blue-500/30"
                    }`}
                >
                  {loading ? (
                    <>
                      <Loader2 size={20} className="animate-spin text-blue-400" />
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

              <div className="mt-8 pt-6 border-t border-white/10 text-center">
                <p className="text-sm text-slate-400">
                  Don&apos;t have an account?{" "}
                  <Link to="/register" className="font-semibold text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center gap-1 group">
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
  <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm transition-colors hover:bg-white/10 max-w-sm">
    <div className="p-3 bg-slate-900/50 rounded-xl border border-white/5">
      {icon}
    </div>
    <div>
      <h4 className="text-white font-semibold mb-1">{title}</h4>
      <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
    </div>
  </div>
);

// Glassmorphism Input Group
const InputGroup = ({ icon, disabled, ...props }) => (
  <div className="relative group">
    <div className={`absolute z-20 left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${disabled ? 'text-slate-600' : 'text-slate-500 group-focus-within:text-blue-400'}`}>
      {icon}
    </div>
    <input
      {...props}
      disabled={disabled}
      required
      className={`w-full pl-11 pr-4 py-3.5 rounded-xl outline-none transition-all duration-300 backdrop-blur-md relative z-10 text-sm sm:text-base shadow-inner font-medium tracking-wide
        ${disabled 
          ? 'bg-slate-800/30 border-slate-700/30 text-slate-500 cursor-not-allowed' 
          : 'bg-slate-900/50 border border-slate-700/50 text-white placeholder:text-slate-500 focus:border-blue-500 focus:bg-slate-800/80 hover:border-slate-600/80'
        }`}
    />
  </div>
);

export default Login;