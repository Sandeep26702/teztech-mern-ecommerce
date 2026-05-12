import 'dotenv/config';
import express from "express";
import cors from "cors";
import path from "path";
import cookieParser from "cookie-parser"; // 🚀 NAYA: Cookie padhne ke liye tool
import connectDB from "./config/db.js";
import seedAdmin from "./utils/seedAdmin.js";

import authRoutes from "./routes/auth.Routes.js";
import userRoutes from "./routes/user.routes.js";
import productRoutes from "./routes/productRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import quoteRoutes from "./routes/quoteRoutes.js";
import shippingRoutes from "./routes/shippingRoutes.js";
import layoutRoutes from "./routes/layoutRoutes.js";

const app = express();
const PORT = process.env.PORT || 5000;

/* ================= MIDDLEWARE ================= */

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5000",
      "https://teztech-mern-ecommerce-ixig.vercel.app",
      "https://www.sonanielectronics.in",
      "https://sonanielectronics.in",
      "https://poly.teztech.in"
    ],
    credentials: true,
  })
);

app.use(express.json());

// 🚀 NAYA: Backend ko sikhaya ki aane wali cookies ko kaise padhna hai
app.use(cookieParser());

// Uploads folder ko public banaya taaki frontend images dekh sake
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

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
app.use("/api/cart", cartRoutes);
app.use("/api/shipping", shippingRoutes);
app.use("/api/layout", layoutRoutes);

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