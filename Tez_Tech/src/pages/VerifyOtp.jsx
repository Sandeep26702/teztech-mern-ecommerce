import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import { ShieldCheck, RefreshCw, ArrowLeft, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import myLogo from "../assets/logo.png";

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
            Verify your Account
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 text-center leading-relaxed">
            Enter the 6-digit code sent to your email to activate your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Address (Editable if not read-only) */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Verify Email Address
              </label>
              {isEmailReadOnly && (
                <button
                  type="button"
                  onClick={() => setIsEmailReadOnly(false)}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer"
                >
                  Change
                </button>
              )}
            </div>
            <div className="relative">
              <input
                id="email"
                type="email"
                required
                disabled={isEmailReadOnly}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className={`w-full px-3.5 py-2.5 rounded-lg border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-400/50 dark:placeholder:text-slate-500/40 placeholder:font-normal
                  ${isEmailReadOnly
                    ? "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-550 cursor-not-allowed"
                    : "bg-white dark:bg-slate-950 border-slate-250 dark:border-slate-800 text-slate-900 dark:text-white focus:border-blue-500"
                  }`}
              />
            </div>
          </div>

          {/* 6-Digit OTP Inputs */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 text-center">
              Enter 6-Digit Verification Code
            </label>
            <div className="flex justify-between gap-2 sm:gap-2.5" onPaste={handlePaste}>
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
                  placeholder="-"
                  className="w-11 h-12 sm:w-12 sm:h-12 text-center text-xl font-bold bg-white dark:bg-slate-950 border border-slate-250 dark:border-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white rounded-lg outline-none transition-all placeholder:text-slate-300/40 dark:placeholder:text-slate-700/40 placeholder:font-normal"
                  required
                />
              ))}
            </div>
          </div>

          {/* Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm transition-colors duration-200 flex items-center justify-center gap-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-500 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                Verify & Activate
                <ShieldCheck className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center space-y-4">
          <p className="text-sm text-slate-550 dark:text-slate-400">
            Didn&apos;t receive code?{" "}
            {canResend ? (
              <button
                type="button"
                onClick={handleResend}
                disabled={resendLoading}
                className="font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                {resendLoading ? "Sending..." : "Resend OTP"}
              </button>
            ) : (
              <span className="font-medium text-slate-400 dark:text-slate-500">
                Resend in {timer}s
              </span>
            )}
          </p>

          <div className="pt-2">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default VerifyOtp;

