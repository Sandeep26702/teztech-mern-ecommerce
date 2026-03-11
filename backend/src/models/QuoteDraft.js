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
  },
  { _id: false } // Mongoose optimization
);

const quoteDraftSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // Ek user ka ek hi active draft hoga
    },
    items: [draftItemSchema],
  },
  { timestamps: true }
);

export default mongoose.model("QuoteDraft", quoteDraftSchema);
