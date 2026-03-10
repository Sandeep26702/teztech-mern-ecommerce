import 'dotenv/config'; 
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import seedAdmin from "./utils/seedAdmin.js";

import authRoutes from "./routes/auth.Routes.js";
import userRoutes from "./routes/user.routes.js";
import productRoutes from "./routes/productRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";

// 👇 1. Naya Quote Route Import Kiya
import quoteRoutes from "./routes/quoteRoutes.js"; 

// ❌ Framer motion yahan se hata diya gaya hai kyunki wo backend me nahi chalta

const app = express();
const PORT = process.env.PORT || 5000;

/* ================= MIDDLEWARE ================= */

app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);

app.use(express.json());

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

// 👇 2. Naya Quote Route Main Gate Par Mount Diya (S hata diya taaki frontend se match kare)
app.use("/api/quote", quoteRoutes); 
app.use("/api/cart", cartRoutes);

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
