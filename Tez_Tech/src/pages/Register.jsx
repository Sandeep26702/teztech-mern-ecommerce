import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import { User, Mail, Phone, Lock, Sparkles, ShieldCheck, Zap, ArrowRight, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    setLoading(true);
    
    // Attempt registration
    const result = await register({
      name: `${formData.firstName} ${formData.lastName}`.trim(),
      phone: formData.phone,
      email: formData.email,
      password: formData.password
    });

    if (result.success) {
      toast.success(result.message || "Registration successful! Redirecting to OTP...");
      // Auto-redirect to verify-otp
      navigate("/verify-otp", { state: { email: formData.email } });
    } else {
      toast.error(result.message || "Registration failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 overflow-hidden font-sans text-gray-900 dark:text-slate-200 transition-colors duration-500">
      
      {/* --- Premium Animated Background --- */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 -left-40 w-96 h-96 bg-purple-400/30 dark:bg-purple-600/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-0 -right-40 w-96 h-96 bg-blue-400/30 dark:bg-blue-600/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-300/20 dark:bg-indigo-900/10 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[120px]"></div>
        {/* Subtle grid pattern for an industrial tech feel */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIj48ZmlsdGVyIGlkPSJuIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMC42NSIgbnVtT2N0YXZlcz0iMyIgc3RpdGNoVGlsZXM9InN0aXRjaCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNuKSIgb3BhY2l0eT0iMC4xNSIvPjwvc3ZnPg==')] opacity-10 dark:opacity-30 mix-blend-overlay pointer-events-none"></div>
      </div>

      {/* --- Main Container: Split Screen on Desktop --- */}
      <div className="relative z-10 w-full max-w-6xl p-4 sm:p-8 flex flex-col lg:flex-row items-stretch justify-center gap-8 lg:gap-0">
        
        {/* LEFT SIDE: Branding / Value Prop */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="hidden md:flex flex-col justify-center w-full lg:w-5/12 lg:pr-12 xl:pr-16"
        >
          <div className="mb-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/60 dark:bg-white/5 border border-gray-200 dark:border-white/10 w-max backdrop-blur-sm shadow-sm">
            <Sparkles size={16} className="text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-medium tracking-wide text-purple-700 dark:text-purple-300">Join the Future of Tech</span>
          </div>
          
          <h1 className="text-5xl lg:text-6xl font-black tracking-tight mb-6 leading-tight text-gray-900 dark:text-white">
            Welcome to <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 dark:from-purple-400 dark:via-indigo-400 dark:to-blue-500">
              Tez Tech
            </span>
          </h1>
          
          <p className="text-lg text-gray-600 dark:text-slate-400 mb-10 leading-relaxed max-w-md">
            Unlock premium lighting solutions, seamless shopping, and an illuminating tech experience. Register now to light up your world.
          </p>

          <div className="space-y-6">
            <FeatureItem icon={<ShieldCheck size={24} className="text-emerald-500 dark:text-emerald-400"/>} title="Secure & Verified" desc="Your data is safe with our advanced security protocols." />
            <FeatureItem icon={<Zap size={24} className="text-amber-500 dark:text-amber-400"/>} title="Lightning Fast" desc="Optimized for speed and efficiency at every step." />
          </div>
        </motion.div>

        {/* RIGHT SIDE: The Form Card with Glassmorphism */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="w-full max-w-md mx-auto lg:mx-0 lg:w-7/12"
        >
          {/* Animated border wrapper */}
          <div className="relative p-[1px] rounded-[2rem] overflow-hidden group shadow-2xl shadow-purple-900/5 dark:shadow-purple-900/20">
            <div className="absolute inset-[-1000%] animate-[spin_5s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,rgba(0,0,0,0)_0%,#a855f7_25%,rgba(0,0,0,0)_50%,#3b82f6_75%,rgba(0,0,0,0)_100%)] opacity-20 dark:opacity-50 group-hover:opacity-40 dark:group-hover:opacity-100 transition-opacity duration-500"></div>
            
            {/* Form Box */}
            <div className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[1.95rem] p-8 sm:p-10 border border-white/40 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none">
              
              {/* Mobile Header */}
              <div className="md:hidden text-center mb-8">
                <h2 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-500">Tez Tech</h2>
                <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Create your account</p>
              </div>

              <div className="mb-8 hidden md:block">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Create Account</h2>
                <p className="text-gray-500 dark:text-slate-400 text-sm">Fill in your details to get started.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <InputGroup disabled={loading} label="First Name" name="firstName" type="text" value={formData.firstName} onChange={handleChange} />
                  <InputGroup disabled={loading} label="Last Name" name="lastName" type="text" value={formData.lastName} onChange={handleChange} />
                </div>

                <InputGroup disabled={loading} label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} />
                <InputGroup disabled={loading} label="Mobile Number" name="phone" type="tel" value={formData.phone} onChange={handleChange} />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <InputGroup disabled={loading} label="Password" name="password" type="password" value={formData.password} onChange={handleChange} />
                  <InputGroup disabled={loading} label="Confirm Password" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} />
                </div>

                <motion.button
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  disabled={loading}
                  type="submit"
                  className={`w-full mt-8 py-4 rounded-xl font-bold tracking-wide transition-all duration-300 flex items-center justify-center gap-3 shadow-lg 
                    ${loading 
                      ? "bg-gray-200 dark:bg-slate-800 text-gray-500 dark:text-slate-400 cursor-not-allowed border border-transparent dark:border-white/5" 
                      : "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-purple-500/25 hover:shadow-purple-500/40 border border-purple-500/30"
                    }`}
                >
                  {loading ? (
                    <>
                      <Loader2 size={20} className="animate-spin text-purple-600 dark:text-purple-400" />
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight size={18} />
                    </>
                  )}
                </motion.button>
              </form>

              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-white/10 text-center">
                <p className="text-sm text-gray-600 dark:text-slate-400">
                  Already have an account?{" "}
                  <Link to="/login" className="font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-500 dark:hover:text-purple-300 transition-colors inline-flex items-center gap-1 group">
                    Login Here
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
          : 'bg-white/60 dark:bg-slate-900/50 border border-gray-300 dark:border-slate-700/50 text-gray-900 dark:text-white focus:border-purple-500 dark:focus:border-purple-500 focus:bg-white dark:focus:bg-slate-800/80 hover:border-gray-400 dark:hover:border-slate-600/80'
        }`}
    />
    <label className={`absolute z-20 left-4 transition-all duration-300 pointer-events-none origin-[0]
      top-1/2 -translate-y-1/2 text-sm font-medium
      peer-focus:top-3.5 peer-focus:-translate-y-0 peer-focus:scale-75 peer-focus:font-bold peer-focus:uppercase peer-focus:tracking-wider
      peer-[&:not(:placeholder-shown)]:top-3.5 peer-[&:not(:placeholder-shown)]:-translate-y-0 peer-[&:not(:placeholder-shown)]:scale-75 peer-[&:not(:placeholder-shown)]:font-bold peer-[&:not(:placeholder-shown)]:uppercase peer-[&:not(:placeholder-shown)]:tracking-wider
      ${disabled ? 'text-gray-400 dark:text-slate-600' : 'text-gray-500 dark:text-slate-400 peer-focus:text-purple-600 dark:peer-focus:text-purple-400'}`}>
      {label}
    </label>
  </div>
);

export default Register;