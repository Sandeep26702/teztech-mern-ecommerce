import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      index: true,
    },
    description: {
      type: String,
      index: true,
    },
    price: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      index: true,
    },
    stock: {
      type: Number,
      default: 0,
    },
    images: [
      {
        public_id: String,
        url: String,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// 🔥 FAST SEARCH (MongoDB text index)
productSchema.index({ name: "text", description: "text" });

export const Product = mongoose.model("Product", productSchema);
