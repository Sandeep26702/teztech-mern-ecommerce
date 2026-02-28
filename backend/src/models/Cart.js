import mongoose from "mongoose";

// 1. Sub-schema for cart items
const cartItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product", // Connects to your Product collection
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      default: 1,
      min: [1, "Quantity cannot be less than 1"], // Added custom error message
    },
  },
  { _id: false } // 🔥 REAL-WORLD OPTIMIZATION: Prevents Mongoose from creating a useless _id for every single item in the array
);

// 2. Main Cart Schema
const cartSchema = new mongoose.Schema(
  {
    // 🛡️ DATA ISOLATION: Links the cart strictly to the logged-in user
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Connects to your User collection
      required: true,
      unique: true, // Ensures 1 User = exactly 1 Cart
    },
    items: [cartItemSchema], // Array of the sub-schema defined above
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt dates
);

export default mongoose.model("Cart", cartSchema);