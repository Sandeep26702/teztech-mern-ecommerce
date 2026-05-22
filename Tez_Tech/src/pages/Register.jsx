import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import { User, Mail, Phone, Lock, Sparkles, Zap } from "lucide-react";

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
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }
    setLoading(true);
    const result = await register({
      name: `${formData.firstName} ${formData.lastName}`.trim(),
      phone: formData.phone,
      email: formData.email,
      password: formData.password
    });
    if (result.success) {
      navigate("/verify-otp", { state: { email: formData.email } });
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  return (
    <div 
      className="relative flex items-center justify-center w-full min-h-screen px-4 py-8 overflow-hidden font-sans sm:p-8"
      style={{ 
        // Magical glowing background image
        backgroundImage: `url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2064&auto=format&fit=crop')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* Dark Magic Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[4px]"></div>

      {/* Floating Magic Particles (Animated) */}
      <motion.div animate={{ y: [0, -20, 0], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 4 }} className="absolute top-20 left-10 text-purple-400 blur-[2px]"><Sparkles size={40} /></motion.div>
      <motion.div animate={{ y: [0, 30, 0], opacity: [0.3, 0.8, 0.3] }} transition={{ repeat: Infinity, duration: 6 }} className="absolute bottom-20 right-10 text-blue-400 blur-[1px]"><Zap size={50} /></motion.div>

      {/* --- THE 3D ROTATING BORDER BOX --- */}
      <div className="relative p-[2px] sm:p-[3px] overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] group max-w-xl w-full z-10 shadow-[0_0_50px_rgba(99,102,241,0.3)]">
        
        {/* Rotating Light Gradient */}
        <div className="absolute inset-[-1000%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2E8F0_0%,#a855f7_25%,#3b82f6_50%,#a855f7_75%,#E2E8F0_100%)] opacity-80"></div>

        {/* Main Content Box (Glassmorphism) */}
        <div className="relative bg-slate-950/80 backdrop-blur-2xl rounded-[1.9rem] sm:rounded-[2.4rem] p-6 sm:p-10 md:p-12 z-10 border border-white/10">
          
          <div className="mb-8 text-center sm:mb-10">
            <h1 className="text-3xl font-black tracking-tight text-transparent sm:text-4xl bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500">
              Tez Tech
            </h1>
            <p className="text-slate-300 mt-2 text-xs sm:text-sm uppercase tracking-[0.2em] font-medium">
             The Lighting World
            </p>
          </div>

          {error && (
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="p-3 mb-6 text-sm text-center text-red-400 border bg-red-500/10 border-red-500/30 rounded-xl">
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {/* Mobile pe ek ke neeche ek, Desktop pe side-by-side */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
              <InputGroup icon={<User size={18}/>} name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleChange} />
              <InputGroup icon={<User size={18}/>} name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleChange} />
            </div>

            <InputGroup icon={<Mail size={18}/>} name="email" type="email" placeholder="Email Address" value={formData.email} onChange={handleChange} />
            <InputGroup icon={<Phone size={18}/>} name="phone" type="tel" placeholder="Mobile Number" value={formData.phone} onChange={handleChange} />
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
              <InputGroup icon={<Lock size={18}/>} name="password" type="password" placeholder="Password" value={formData.password} onChange={handleChange} />
              <InputGroup icon={<Lock size={18}/>} name="confirmPassword" type="password" placeholder="Confirm" value={formData.confirmPassword} onChange={handleChange} />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              className="w-full mt-6 sm:mt-8 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] transition-all duration-300 flex items-center justify-center gap-2 uppercase tracking-wider text-sm sm:text-base border border-white/10"
            >
              {loading ? "Casting Spell..." : "Create Account"}
              {!loading && <Sparkles size={18} />}
            </motion.button>
          </form>

          <p className="mt-8 text-sm text-center text-slate-400 sm:text-base">
            Already Account{" "}
            <Link to="/login" className="font-bold text-purple-400 underline transition-all hover:text-purple-300 underline-offset-4">
              Login Here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

// Glassmorphism Input
const InputGroup = ({ icon, ...props }) => (
  <div className="relative group">
    <div className="absolute z-20 transition-colors -translate-y-1/2 left-4 top-1/2 text-slate-400 group-focus-within:text-purple-400">
      {icon}
    </div>
    <input
      {...props}
      required
      className="w-full bg-slate-900/50 border border-slate-700/50 text-white pl-12 pr-4 py-3.5 sm:py-4 rounded-xl outline-none focus:border-purple-500 focus:bg-slate-800/80 transition-all placeholder:text-slate-500 backdrop-blur-md relative z-10 text-sm sm:text-base shadow-inner"
    />
  </div>
);

export default Register;