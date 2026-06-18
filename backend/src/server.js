import 'dotenv/config';
import express from "express";
import cors from "cors";
import path from "path";
import cookieParser from "cookie-parser"; // 🚀 NEW: Tool for parsing incoming cookies
import connectDB from "./config/db.js";
import seedAdmin from "./utils/seedAdmin.js";
import compression from "compression";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/auth.Routes.js";
import userRoutes from "./routes/user.routes.js";
import productRoutes from "./routes/productRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import quoteRoutes from "./routes/quoteRoutes.js";
import customDesignQuoteRoutes from "./routes/customDesignQuoteRoutes.js";
import shippingRoutes from "./routes/shippingRoutes.js";
import layoutRoutes from "./routes/layoutRoutes.js";
import leadRoutes from "./routes/leadRoutes.js";
import designRequestRoutes from "./routes/designRequestRoutes.js";
import materialRoutes from "./routes/materialRoutes.js";
import jobCardRoutes from "./routes/jobCardRoutes.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";

const app = express();
const PORT = process.env.PORT || 5000;

// Trust the reverse proxy (Render) to read client IPs correctly for rate-limiting
app.set("trust proxy", 1);

// Force Node to favor IPv4 to prevent Gmail IPv6 'ENETUNREACH' errors on Render
import dns from "dns";
dns.setDefaultResultOrder("ipv4first");

/* ================= MIDDLEWARE ================= */

// 1. CORS Configuration (Registered first so preflights and rate limit errors get CORS headers)
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5000",
      "https://teztech-mern-ecommerce-ixig.vercel.app",
      "https://www.sonanielectronics.in",
      "https://sonanielectronics.in",
      "https://poly.teztech.in",
      "https://polysheet.in",
      "https://www.polysheet.in"
    ],
    credentials: true,
  })
);

// 2. Response compression middleware
app.use(compression());

// 3. Global security headers configuration (CSP disabled for REST API compatibility)
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);

// 4. Global Rate Limiter for public APIs (100 requests per 15 minutes)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again after 15 minutes"
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use("/api", globalLimiter);

app.use(express.json());

// 🚀 NEW: Middleware to read and parse cookies in incoming requests
app.use(cookieParser());

// Make uploads folder public and set cache control so browsers cache media locally
app.use(
  '/uploads',
  express.static(path.join(process.cwd(), 'uploads'), {
    maxAge: '30d',
    immutable: true
  })
);

/* ================= ROUTES ================= */

app.get("/", (req, res) => {
  res.send("API Running...");
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/quote", quoteRoutes);
app.use("/api/custom-quote", customDesignQuoteRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/shipping", shippingRoutes);
app.use("/api/layout", layoutRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/design-requests", designRequestRoutes);
app.use("/api/materials", materialRoutes);
app.use("/api/job-cards", jobCardRoutes);
app.use("/api/feedbacks", feedbackRoutes);

/* ================= START SERVER ================= */

const startServer = async () => {
  try {
    // 1. Connect DB
    await connectDB();

    // 2. Seed Admin
    await seedAdmin();

    // 3. Start Listen
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error("❌ Server Start Error:", error.message);
    process.exit(1);
  }
};

startServer();