import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

dotenv.config();

const createSuperAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const email = process.env.SUPER_ADMIN_EMAIL;

    const existing = await User.findOne({ email });
    if (existing) {
      console.log("❌ Super Admin already exists");
      process.exit();
    }

    const hashedPassword = await bcrypt.hash(
      process.env.SUPER_ADMIN_PASSWORD,
      10
    );

    await User.create({
      name: "Super Admin",
      email,
      password: hashedPassword,
      role: "superadmin",
      isVerified: true,
    });

    console.log("✅ Super Admin created successfully");
    process.exit();
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

createSuperAdmin();