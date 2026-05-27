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
      inputRefs.current[5].focus();
    }
  };

  // Handle OTP submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    const fullOtp = otp.join("");
    if (fullOtp.length !== 6) {
      toast.error("Please enter all 6 digits of the OTP.");
      return;
    }
    if (!email) {
      toast.error("Please provide a valid email address.");
      return;
    }

    setLoading(true);

    const result = await verifyOtp(email, fullOtp);
    if (result.success) {
      toast.success("Account verified successfully! Logging you in...");
    } else {
      toast.error(result.message || "Invalid or expired OTP");
      setLoading(false);
    }
  };

  // Handle Resend OTP
  const handleResend = async () => {
    if (!canResend || resendLoading) return;
    if (!email) {
      toast.error("Please enter your email to resend the OTP.");
      return;
    }

    setResendLoading(true);

    const result = await resendOtp(email);
    if (result.success) {
      toast.success("A new verification code has been sent to your email!");
      setTimer(60); // Reset timer to 60 seconds
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0].focus();
    } else {
      toast.error(result.message || "Resend failed");
    }
    setResendLoading(false);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 overflow-hidden font-sans text-gray-900 dark:text-slate-200 transition-colors duration-500 p-4">
      
      {/* --- Premium Animated Background --- */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 -left-40 w-96 h-96 bg-emerald-400/30 dark:bg-emerald-600/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-0 -right-40 w-96 h-96 bg-blue-400/30 dark:bg-blue-600/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-300/20 dark:bg-indigo-900/10 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[120px]"></div>
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIj48ZmlsdGVyIGlkPSJuIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMC42NSIgbnVtT2N0YXZlcz0iMyIgc3RpdGNoVGlsZXM9InN0aXRjaCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNuKSIgb3BhY2l0eT0iMC4xNSIvPjwvc3ZnPg==')] opacity-10 dark:opacity-30 mix-blend-overlay pointer-events-none"></div>
      </div>

      {/* 3D Rotating Light Border Container */}
      <div className="relative z-10 p-[1px] overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] group max-w-xl w-full shadow-2xl shadow-indigo-900/5 dark:shadow-indigo-900/20">
        
        {/* Rotating border gradient */}
        <div className="absolute inset-[-1000%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,rgba(0,0,0,0)_0%,#3b82f6_25%,rgba(0,0,0,0)_50%,#a855f7_75%,rgba(0,0,0,0)_100%)] opacity-20 dark:opacity-50 group-hover:opacity-40 dark:group-hover:opacity-100 transition-opacity duration-500"></div>

        {/* Content Box (Glassmorphism) */}
        <div className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[1.95rem] sm:rounded-[2.45rem] p-6 sm:p-10 md:p-12 z-10 border border-white/40 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none">
          
          <div className="mb-8 text-center sm:mb-10">
            <h1 className="text-3xl font-black tracking-tight text-transparent sm:text-4xl bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-500">
              Verify Account
            </h1>
            <p className="text-gray-500 dark:text-slate-400 mt-2 text-xs sm:text-sm uppercase tracking-[0.2em] font-medium">
             Enter OTP sent to your Email
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Email Field (Dynamic editable fallback) */}
            <div className="relative group">
              <input
                type="email"
                required
                disabled={isEmailReadOnly}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder=" "
                className={`peer w-full px-4 pr-20 pt-6 pb-2 rounded-xl outline-none transition-all duration-300 backdrop-blur-md relative z-10 text-sm sm:text-base shadow-inner font-medium tracking-wide
                  ${isEmailReadOnly 
                    ? "bg-gray-100 dark:bg-slate-800/30 border-gray-200 border-dashed dark:border-slate-700/30 text-gray-500 dark:text-slate-500 cursor-not-allowed" 
                    : "bg-white/60 dark:bg-slate-900/50 border border-gray-300 dark:border-slate-700/50 text-gray-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800/80 hover:border-gray-400 dark:hover:border-slate-600/80"
                  }`}
              />
              <label className={`absolute z-20 left-4 transition-all duration-300 pointer-events-none origin-[0]
                top-1/2 -translate-y-1/2 text-sm font-medium
                peer-focus:top-3.5 peer-focus:-translate-y-0 peer-focus:scale-75 peer-focus:font-bold peer-focus:uppercase peer-focus:tracking-wider
                peer-[&:not(:placeholder-shown)]:top-3.5 peer-[&:not(:placeholder-shown)]:-translate-y-0 peer-[&:not(:placeholder-shown)]:scale-75 peer-[&:not(:placeholder-shown)]:font-bold peer-[&:not(:placeholder-shown)]:uppercase peer-[&:not(:placeholder-shown)]:tracking-wider
                ${isEmailReadOnly ? 'text-gray-400 dark:text-slate-600' : 'text-gray-500 dark:text-slate-400 peer-focus:text-indigo-600 dark:peer-focus:text-indigo-400'}`}>
                Verify Email Address
              </label>
              {isEmailReadOnly && (
                <button
                  type="button"
                  onClick={() => setIsEmailReadOnly(false)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-bold z-20 underline"
                >
                  Change
                </button>
              )}
            </div>

            {/* 6-Digit OTP Inputs */}
            <div>
              <label className="block text-gray-600 dark:text-slate-400 text-sm font-medium mb-3 text-center">
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
                    className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-black bg-white/60 dark:bg-slate-900/50 border border-gray-300 dark:border-slate-700/50 focus:border-indigo-500 dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800/80 text-gray-900 dark:text-white rounded-xl outline-none transition-all placeholder:text-gray-300 dark:placeholder:text-slate-700 shadow-inner"
                    placeholder="-"
                    required
                  />
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <motion.button
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              disabled={loading}
              className={`w-full mt-6 py-4 rounded-xl font-bold tracking-wide transition-all duration-300 flex items-center justify-center gap-2 uppercase text-sm sm:text-base shadow-lg
                ${loading 
                  ? "bg-gray-200 dark:bg-slate-800 text-gray-500 dark:text-slate-400 cursor-not-allowed border border-transparent dark:border-white/5" 
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/25 hover:shadow-blue-500/40 border border-blue-500/30 dark:border-white/10"
                }`}
            >
              {loading ? (
                <>
                  <RefreshCw size={18} className="animate-spin text-blue-600 dark:text-blue-400" />
                  Verifying...
                </>
              ) : (
                <>
                  Verify & Activate
                  <ShieldCheck size={18} />
                </>
              )}
            </motion.button>
          </form>

          {/* Resend and back navigation */}
          <div className="mt-8 text-center space-y-4">
            <p className="text-sm text-gray-600 dark:text-slate-400">
              Didn&apos;t receive code?{" "}
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendLoading}
                  className="font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 underline underline-offset-4 inline-flex items-center gap-1 transition-all"
                >
                  {resendLoading ? "Sending..." : "Resend OTP"}
                  {!resendLoading && <RefreshCw size={14} className="animate-spin-slow" />}
                </button>
              ) : (
                <span className="font-bold text-gray-400 dark:text-slate-500">
                  Resend in {timer}s
                </span>
              )}
            </p>

            <Link 
              to="/login" 
              className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-all underline underline-offset-4"
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
