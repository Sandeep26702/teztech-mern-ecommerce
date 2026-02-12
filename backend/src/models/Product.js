import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    stock: { type: Number, default: 0 },
    images: [
      {
        public_id: String,
        url: String,
      },
    ],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// ✅ NAMED EXPORT (IMPORTANT)
export const Product = mongoose.model("Product", productSchema);
