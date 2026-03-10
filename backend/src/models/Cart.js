import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      default: 1,
      min: [1, "Quantity cannot be less than 1"],
    },
    selectedCustomFields: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    pricing: {
      basePrice: { type: Number, default: 0 },
      optionAdjustment: { type: Number, default: 0 },
      gstRate: { type: Number, default: 0 },
      gstAmount: { type: Number, default: 0 },
      unitPrice: { type: Number, default: 0 },
    },
  },
  { _id: true }
);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: [cartItemSchema],
  },
  { timestamps: true }
);

export default mongoose.model("Cart", cartSchema);
