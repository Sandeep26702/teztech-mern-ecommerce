import mongoose from "mongoose";

const customFieldOptionSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
    },
    priceAdjustment: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const customFieldSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["radio", "checkbox", "text"],
      default: "radio",
    },
    required: {
      type: Boolean,
      default: false,
    },
    options: {
      type: [customFieldOptionSchema],
      default: [],
    },
  },
  { _id: true }
);

const detailItemSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true,
    },
    value: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    // User jisne product banaya (Admin)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    name: {
      type: String,
      required: true,
    },
    sku: {
      type: String,
      default: "",
      trim: true,
    },
    image: {
      type: String,
      required: true,
    },
    brand: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      default: 0,
    },
    gstRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    shippingCharge: {
      type: Number,
      default: 0,
      min: 0,
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
    },
    customFields: {
      type: [customFieldSchema],
      default: [],
    },
    details: {
      type: [detailItemSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model("Product", productSchema);

// ✅ IMPORTANT: Default Export for ES6
export default Product;
