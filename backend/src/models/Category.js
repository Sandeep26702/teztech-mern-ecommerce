import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      // Toh humne 'unique: true' hata diya taaki duplicate names with different parents allowed hon.
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    image: {
      type: String,
      default: "https://placehold.co/600x400?text=Category",
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    
    // 🔥 NEW FIELDS FOR MULTI-LEVEL (NESTED) CATEGORIES 🔥
    level: {
      type: Number,
      required: true,
      default: 1, // 1 = Main Category, 2 = Sub Category, 3 = Item Name
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null, // Level 1 (Main) ke liye ye null rahega
    },
  },
  { timestamps: true }
);

export default mongoose.model("Category", categorySchema);