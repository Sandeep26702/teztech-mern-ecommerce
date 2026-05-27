import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./src/models/User.js";

// Load environment variables
dotenv.config();

const cleanUpGhostAccounts = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB Connected successfully.");

    // Calculate time threshold (1 hour ago)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    console.log("🔍 Searching for unverified users created more than 1 hour ago...");

    // Find and delete users where isVerified is false AND createdAt is less than 1 hour ago
    // If createdAt is not available, we can use the _id timestamp or just delete all isVerified: false
    // Since MongoDB ObjectIds contain timestamps, we can use that if createdAt doesn't exist.
    // However, Mongoose schemas usually have timestamps enabled.
    
    const result = await User.deleteMany({
      isVerified: false,
      createdAt: { $lt: oneHourAgo }
    });

    console.log(`🧹 Cleanup Complete: Deleted ${result.deletedCount} ghost account(s).`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error cleaning up ghost accounts:", error);
    process.exit(1);
  }
};

cleanUpGhostAccounts();
