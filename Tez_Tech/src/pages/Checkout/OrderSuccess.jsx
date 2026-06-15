import React from "react";
import { Link, useLocation } from "react-router-dom";

const OrderSuccess = () => {
  const location = useLocation();

  // Retrieve order reference or fallback to a mock one
  const orderId = location.state?.orderId || `TZ-${Math.floor(100000 + Math.random() * 900000)}`;

  return (
    <div className="relative flex items-center justify-center min-h-screen px-4 py-16 overflow-hidden bg-[#06080d] font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* 🌟 PREMIUM MINIMALIST CSS ANIMATIONS */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes drawCheck {
          0% { stroke-dashoffset: 80; opacity: 0; }
          10% { opacity: 1; }
          100% { stroke-dashoffset: 0; opacity: 1; }
        }
        .animate-draw-check {
          stroke-dasharray: 80;
          stroke-dashoffset: 80;
          animation: drawCheck 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          animation-delay: 0.2s;
        }

        @keyframes subtleOrbRotate {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(20px, -30px) scale(1.1); }
        }
        .orb-animate-1 {
          animation: subtleOrbRotate 10s ease-in-out infinite;
        }
        .orb-animate-2 {
          animation: subtleOrbRotate 12s ease-in-out infinite alternate;
        }

        @keyframes cardFadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-card-fade {
          animation: cardFadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />

      {/* 🔮 Background Glow Mesh Orbs (Premium Luxury Aesthetic) */}
      <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[130px] pointer-events-none orb-animate-1"></div>
      <div className="absolute bottom-[10%] right-[20%] w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none orb-animate-2"></div>

      {/* 💳 REDESIGNED DIGITAL RECEIPT SUCCESS CARD */}
      <div className="relative z-10 w-full max-w-md p-8 sm:p-10 text-center bg-slate-950/30 backdrop-blur-3xl border border-white/[0.04] shadow-[0_24px_80px_rgba(0,0,0,0.6)] rounded-[2.5rem] animate-card-fade hover:border-white/[0.07] transition-colors duration-500">
        
        {/* Glowing Success Badge */}
        <div className="relative flex items-center justify-center w-20 h-20 mx-auto mb-8 rounded-full border border-emerald-500/25 bg-emerald-500/5 shadow-[0_0_35px_rgba(16,185,129,0.1)]">
          <div className="absolute inset-0 bg-emerald-500/5 rounded-full animate-ping opacity-30" style={{ animationDuration: '3s' }}></div>
          <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path 
              className="animate-draw-check" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="3.5" 
              d="M5 13l4 4L19 7" 
            />
          </svg>
        </div>

        {/* Headings */}
        <h1 className="mb-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          Order Completed
        </h1>
        <p className="mb-8 text-sm text-slate-400 leading-relaxed max-w-sm mx-auto">
          Thank you for your purchase. Your premium order has been received and is now being processed.
        </p>

        {/* Minimalist Digital Receipt Container */}
        <div className="p-5 mb-8 border border-white/[0.03] bg-slate-950/40 rounded-2xl space-y-4 text-left">
          
          <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.03]">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Order Number</span>
            <span className="font-mono text-sm font-extrabold text-indigo-400 select-all hover:text-indigo-300 transition-colors">
              {orderId}
            </span>
          </div>

          <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.03]">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Status</span>
            <span className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full border border-emerald-500/20 text-emerald-400 bg-emerald-950/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Processing
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Delivery Estimate</span>
            <span className="text-xs font-extrabold tracking-wide uppercase text-slate-300">
              3 - 5 Business Days
            </span>
          </div>

        </div>

        {/* Helper Note */}
        <p className="mb-8 text-xs text-slate-500 leading-relaxed">
          A confirmation email has been sent to your registered address. We'll update you as soon as your package ships.
        </p>

        {/* Premium Action CTAs */}
        <div className="flex flex-col gap-3">
          <Link 
            to="/orders" 
            className="flex items-center justify-center w-full py-4 text-sm font-bold text-white transition-all bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl shadow-[0_4px_20px_rgba(59,130,246,0.2)] hover:shadow-[0_4px_30px_rgba(59,130,246,0.35)] active:scale-98"
          >
            Track Order
          </Link>
          <Link 
            to="/products" 
            className="flex items-center justify-center w-full py-4 text-sm font-bold text-slate-300 transition-all border border-white/[0.07] bg-white/[0.02] rounded-xl hover:bg-white/[0.06] hover:text-white active:scale-98"
          >
            Continue Shopping
          </Link>
        </div>
        
      </div>
    </div>
  );
};

export default OrderSuccess;