import mongoose from "mongoose";
import crypto from "crypto";

const designItemSchema = new mongoose.Schema({
  designName: { type: String, required: true },
  length: { type: String, required: true },
  width: { type: String, required: true },
  sheetColor: { type: String, required: true },
  ledType: { type: String, enum: ["9mm", "12mm"], required: true },
  thickness: { type: Number, required: true },
  requiredDate: { type: Date, required: true },
  referenceUrl: { type: String, default: "" }, // Cloudinary URL or local file path
  specialInstructions: { type: String, default: "" }
});

const customDesignQuoteSchema = new mongoose.Schema(
  {
    quoteNumber: {
      type: String,
      unique: true,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userDetails: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      company: { type: String, default: "" },
      address: { type: String, required: true },
    },
    designs: [designItemSchema],
    status: {
      type: String,
      enum: ["Pending", "Responded", "Accepted", "Rejected"],
      default: "Pending",
    },
    offeredPrice: { type: Number, default: 0 },
    adminNotes: { type: String, default: "" },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    crmNotes: [
      {
        author: { type: String, default: "" },
        remarks: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
        isPublic: { type: Boolean, default: false },
        role: { type: String, enum: ["client", "admin"] },
      }
    ],
  },
  { timestamps: true }
);

customDesignQuoteSchema.pre("validate", async function (next) {
  if (!this.quoteNumber) {
    let isUnique = false;
    while (!isUnique) {
      const num = Math.floor(1000 + Math.random() * 9000); // 1000 to 9999
      const generated = `CDQ-${num}`;
      const exists = await this.constructor.findOne({ quoteNumber: generated });
      if (!exists) {
        this.quoteNumber = generated;
        isUnique = true;
      }
    }
  }
  next();
});

export default mongoose.model("CustomDesignQuote", customDesignQuoteSchema);
