import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const OrderSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showParticles, setShowParticles] = useState(false);

  const orderId = location.state?.orderId || `TZ-${Math.floor(100000 + Math.random() * 900000)}`;

  useEffect(() => {
    setShowParticles(true);
  }, [navigate]);

  return (
    <div className="relative flex items-center justify-center min-h-screen px-4 py-12 overflow-hidden bg-[#0f172a] font-sans selection:bg-blue-500 selection:text-white">
      
      {/* 🌟 CLEAN CSS ANIMATIONS (No backslash issues) */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes drawCheck {
          0% { stroke-dashoffset: 100; opacity: 0; }
          10% { opacity: 1; }
          100% { stroke-dashoffset: 0; opacity: 1; }
        }
        .animate-draw-check {
          stroke-dasharray: 100;
          stroke-dashoffset: 100;
          animation: drawCheck 1s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          animation-delay: 0.3s;
        }
        
        @keyframes floatUp {
          0% { transform: translateY(100vh) scale(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(-20vh) scale(1.5) rotate(360deg); opacity: 0; }
        }
        .particle {
          position: absolute;
          animation: floatUp 4s ease-in forwards;
        }
        
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 40px rgba(16, 185, 129, 0.2); transform: scale(1); }
          50% { box-shadow: 0 0 80px rgba(16, 185, 129, 0.5); transform: scale(1.02); }
        }
        .animate-pulse-glow {
          animation: pulseGlow 3s ease-in-out infinite;
        }
      `}} />

      {/* 🎉 CSS CONFETTI / PARTICLES (Error Fixed: Clean Template Literals) */}
      {showParticles && Array.from({ length: 30 }).map((_, i) => {
        const size = Math.random() * 10 + 5;
        const colors = ['bg-emerald-400', 'bg-blue-400', 'bg-cyan-400', 'bg-fuchsia-400', 'bg-orange-400'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        // Clean inline styles (No extra escaping)
        return (
          <div 
            key={i}
            className={`particle rounded-full ${color} mix-blend-screen blur-[1px]`}
            style={{
              left: `${Math.random() * 100}%`,
              width: `${size}px`,
              height: `${size}px`,
              animationDelay: `${Math.random() * 0.5}s`,
              animationDuration: `${Math.random() * 2 + 3}s`
            }}
          />
        );
      })}

      {/* 🔮 Background Glow Orbs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/20 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>

      {/* 💳 MAIN PREMIUM SUCCESS CARD */}
      <div className="relative z-10 w-full max-w-lg p-10 text-center transition-all duration-700 ease-out transform bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl rounded-[3rem] animate-pulse-glow">
        
        {/* Animated Checkmark Circle */}
        <div className="relative flex items-center justify-center w-24 h-24 mx-auto mb-8 rounded-full shadow-lg bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-emerald-500/40">
          <div className="absolute inset-0 bg-white rounded-full opacity-20 animate-ping"></div>
          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path 
              className="animate-draw-check" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="4" 
              d="M5 13l4 4L19 7" 
            />
          </svg>
        </div>

        {/* Headings */}
        <h1 className="mb-2 text-4xl font-black tracking-tight text-white drop-shadow-md">
          Boom! Order Placed.
        </h1>
        <p className="mb-8 text-lg font-medium text-emerald-300">
          Congratulations! Your premium electronics are on their way.
        </p>

        {/* Order Details Box */}
        <div className="p-6 mb-8 text-left border bg-slate-900/50 rounded-2xl border-white/10 backdrop-blur-sm">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
            <span className="text-slate-400">Order Reference</span>
            <span className="font-mono text-lg font-bold text-cyan-400">{orderId}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Status</span>
            <span className="flex items-center gap-2 px-3 py-1 text-sm font-bold rounded-full text-emerald-900 bg-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-900 animate-pulse"></span>
              Processing
            </span>
          </div>
        </div>

        {/* Next Steps text */}
        <p className="mb-8 text-sm leading-relaxed text-slate-300">
          We've sent a confirmation email with your order details. We'll notify you as soon as it ships.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link 
            to="/orders" 
            className="flex items-center justify-center w-full px-8 py-4 font-bold text-white transition-all shadow-lg sm:w-auto bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl hover:from-blue-500 hover:to-cyan-400 hover:shadow-cyan-500/25 active:scale-95"
          >
            Track Order
          </Link>
          <Link 
            to="/products" 
            className="flex items-center justify-center w-full px-8 py-4 font-bold text-white transition-all border sm:w-auto border-white/20 bg-white/5 rounded-xl hover:bg-white/10 active:scale-95"
          >
            Continue Shopping
          </Link>
        </div>
        
      </div>
    </div>
  );
};

export default OrderSuccess;