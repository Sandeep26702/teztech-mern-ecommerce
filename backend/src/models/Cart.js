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
      min: 1,
      default: 1,
    },
    selectedCustomFields: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // 🔥 FIXED: Added new fields to support saving variations 🔥
    variant: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    attributes: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
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

// In the future, write any async hooks without using the next callback:
// cartItemSchema.pre("save", async function () {
//   // Custom logic here
// });

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

const Cart = mongoose.models.Cart || mongoose.model("Cart", cartSchema);
export default Cart;