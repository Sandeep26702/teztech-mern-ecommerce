import mongoose from "mongoose";

const draftItemSchema = new mongoose.Schema(
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
      min: 1,
    },
    selectedCustomFields: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // 👇 Added these two fields 👇
    selectedVariant: {
      type: mongoose.Schema.Types.Mixed, // Mixed type allows storing objects or strings easily
      default: null,
    },
    selectedAttributes: {
      type: mongoose.Schema.Types.Mixed, // For storing variant attributes object
      default: {},
    },
  },
  { _id: false } // Mongoose optimization
);

const quoteDraftSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // A user can have only one active draft
    },
    items: [draftItemSchema],
  },
  { timestamps: true }
);

export default mongoose.model("QuoteDraft", quoteDraftSchema);