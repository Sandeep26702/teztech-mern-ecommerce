import mongoose from "mongoose";

const quoteSchema = new mongoose.Schema(
  {
    userDetails: {
      name: String,
      email: String,
      phone: String,
      company: String,
      message: String,
    },
    requestedItems: [
      {
        productId: { 
          type: mongoose.Schema.Types.ObjectId, 
          ref: "Product" 
        },
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        // 👇 NAYA FIELD JO ADD KARNA HAI 👇
        originalPrice: { 
          type: Number, 
          default: 0 
        },
        offeredPrice: { 
          type: Number, 
          default: 0 
        }
      }
    ],
    adminNotes: String,
    totalDiscount: { type: Number, default: 0 },
    finalTotal: { type: Number, default: 0 },
    quoteToken: String,
    status: {
      type: String,
      enum: ["Pending", "Responded", "Accepted", "Rejected"],
      default: "Pending",
    },
    validUntil: Date,
  },
  { timestamps: true }
);

export default mongoose.model("Quote", quoteSchema);