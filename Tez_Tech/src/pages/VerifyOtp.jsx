import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import { Mail, Sparkles, Zap, ShieldCheck, RefreshCw, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

const VerifyOtp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyOtp, resendOtp } = useAuth();

  // Read email from router state or local storage
  const [email, setEmail] = useState("");
  const [isEmailReadOnly, setIsEmailReadOnly] = useState(false);

  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
      setIsEmailReadOnly(true);
    }
  }, [location.state]);

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState("");
  const [timer, setTimer] = useState(60); // 60 seconds resend cooldown
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef([]);

  // Countdown timer for Resend OTP
  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      setCanResend(false);
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // Handle digit input change
  const handleChange = (index, value) => {
    // Only allow numbers
    if (isNaN(value)) return;

    const newOtp = [...otp];
    // Take the last character typed
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    setError("");

    // Auto-advance focus to the next input if value is filled
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  // Handle backspace and navigation keys
  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        // Clear previous input and move focus back
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
        inputRefs.current[index - 1].focus();
      } else if (otp[index]) {
        // Clear current input
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      }
    }
  };

  // Handle clipboard paste
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split("");
      setOtp(digits);
      setError("");
      inputRefs.current[5].focus();
    }
  };

  // Handle OTP submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    const fullOtp = otp.join("");
    if (fullOtp.length !== 6) {
      setError("Please enter all 6 digits of the OTP.");
      return;
    }
    if (!email) {
      setError("Please provide a valid email address.");
      return;
    }

    setLoading(true);
    setError("");

    const result = await verifyOtp(email, fullOtp);
    if (result.success) {
      toast.success("Account verified successfully! Logging you in...");
    } else {
      setError(result.message || "Invalid or expired OTP");
      toast.error(result.message || "Verification failed");
      setLoading(false);
    }
  };

  // Handle Resend OTP
  const handleResend = async () => {
    if (!canResend || resendLoading) return;
    if (!email) {
      setError("Please enter your email to resend the OTP.");
      return;
    }

    setResendLoading(true);
    setError("");

    const result = await resendOtp(email);
    if (result.success) {
      toast.success("A new verification code has been sent to your email!");
      setTimer(60); // Reset timer to 60 seconds
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0].focus();
    } else {
      setError(result.message || "Failed to resend OTP");
      toast.error(result.message || "Resend failed");
    }
    setResendLoading(false);
  };

  return (
    <div 
      className="relative flex items-center justify-center w-full min-h-screen px-4 py-8 overflow-hidden font-sans sm:p-8"
      style={{ 
        backgroundImage: `url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2064&auto=format&fit=crop')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* Dark Magic Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[4px]"></div>

      {/* Floating Particles */}
      <motion.div animate={{ y: [0, -20, 0], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 4 }} className="absolute top-20 left-10 text-purple-400 blur-[2px]"><Sparkles size={40} /></motion.div>
      <motion.div animate={{ y: [0, 30, 0], opacity: [0.3, 0.8, 0.3] }} transition={{ repeat: Infinity, duration: 6 }} className="absolute bottom-20 right-10 text-blue-400 blur-[1px]"><Zap size={50} /></motion.div>

      {/* 3D Rotating Light Border Container */}
      <div className="relative p-[2px] sm:p-[3px] overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] group max-w-xl w-full z-10 shadow-[0_0_50px_rgba(99,102,241,0.3)]">
        
        {/* Rotating border gradient */}
        <div className="absolute inset-[-1000%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2E8F0_0%,#a855f7_25%,#3b82f6_50%,#a855f7_75%,#E2E8F0_100%)] opacity-80"></div>

        {/* Content Box (Glassmorphism) */}
        <div className="relative bg-slate-950/85 backdrop-blur-2xl rounded-[1.9rem] sm:rounded-[2.4rem] p-6 sm:p-10 md:p-12 z-10 border border-white/10">
          
          <div className="mb-8 text-center sm:mb-10">
            <h1 className="text-3xl font-black tracking-tight text-transparent sm:text-4xl bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500">
              Verify Account
            </h1>
            <p className="text-slate-300 mt-2 text-xs sm:text-sm uppercase tracking-[0.2em] font-medium">
             Enter OTP sent to your Email
            </p>
          </div>

          {error && (
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="p-3 mb-6 text-sm text-center text-red-400 border bg-red-500/10 border-red-500/30 rounded-xl">
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Email Field (Dynamic editable fallback) */}
            <div className="relative group">
              <div className="absolute z-20 transition-colors -translate-y-1/2 left-4 top-1/2 text-slate-400 group-focus-within:text-purple-400">
                <Mail size={18} />
              </div>
              <input
                type="email"
                required
                disabled={isEmailReadOnly}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                placeholder="Verify Email Address"
                className={`w-full bg-slate-900/50 border border-slate-700/50 text-white pl-12 pr-4 py-3.5 sm:py-4 rounded-xl outline-none focus:border-purple-500 focus:bg-slate-800/80 transition-all placeholder:text-slate-500 backdrop-blur-md relative z-10 text-sm sm:text-base shadow-inner ${isEmailReadOnly ? "opacity-60 cursor-not-allowed border-dashed" : ""}`}
              />
              {isEmailReadOnly && (
                <button
                  type="button"
                  onClick={() => setIsEmailReadOnly(false)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-purple-400 hover:text-purple-300 font-bold z-20 underline"
                >
                  Change
                </button>
              )}
            </div>

            {/* 6-Digit OTP Inputs */}
            <div>
              <label className="block text-slate-400 text-sm font-medium mb-3 text-center">
                Enter 6-Digit Code
              </label>
              <div className="flex justify-between gap-2 sm:gap-3" onPaste={handlePaste}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-black bg-slate-900/50 border border-slate-700/50 focus:border-purple-500 focus:bg-slate-800/80 text-white rounded-xl outline-none transition-all placeholder:text-slate-700 shadow-inner"
                    placeholder="-"
                    required
                  />
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              className="w-full mt-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] transition-all duration-300 flex items-center justify-center gap-2 uppercase tracking-wider text-sm sm:text-base border border-white/10"
            >
              {loading ? "Verifying..." : "Verify & Activate"}
              {!loading && <ShieldCheck size={18} />}
            </motion.button>
          </form>

          {/* Resend and back navigation */}
          <div className="mt-8 text-center space-y-4">
            <p className="text-sm text-slate-400">
              Didn&apos;t receive code?{" "}
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendLoading}
                  className="font-bold text-purple-400 hover:text-purple-300 underline underline-offset-4 inline-flex items-center gap-1 transition-all"
                >
                  {resendLoading ? "Sending..." : "Resend OTP"}
                  {!resendLoading && <RefreshCw size={14} className="animate-spin-slow" />}
                </button>
              ) : (
                <span className="font-bold text-slate-500">
                  Resend in {timer}s
                </span>
              )}
            </p>

            <Link 
              to="/login" 
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white transition-all underline underline-offset-4"
            >
              <ArrowLeft size={16} />
              Back to Login
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default VerifyOtp;
