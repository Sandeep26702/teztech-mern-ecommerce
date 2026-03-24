import mongoose from "mongoose";
import crypto from "crypto";

// 📦 Sub-schema for Requested Items (Clean Code Architecture)
const requestedItemSchema = new mongoose.Schema(
  {
    productId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Product",
      default: null,
    },
    name: { type: String, required: true }, // Snapshot of product name
    quantity: { 
      type: Number, 
      required: true,
      min: [1, "Quantity cannot be less than 1"]
    },
    basePrice: { type: Number, default: 0 },
    optionAdjustment: { type: Number, default: 0 },
    originalPrice: { type: Number, default: 0 },
    offeredPrice: { type: Number, default: 0 }, // Admin updates this later
    selectedCustomFields: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    selectedOptions: [
      {
        fieldLabel: { type: String, required: true },
        value: { type: String, required: true },
        priceAdjustment: { type: Number, default: 0 },
      },
    ],
  }
  // Note: We are NOT using {_id: false} here like we did in Cart. 
  // Why? Because Admins might need to update the price of a specific line-item later, and having an _id helps identify which item to update.
);

// 📄 Main Quote Schema
const quoteSchema = new mongoose.Schema(
  {
    // 🔥 NEW: Professional Human-Readable Quote ID (e.g., QT-98234)
    quoteNumber: {
      type: String,
      unique: true,
      required: true,
    },

    // Versioning
    parentQuoteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quote",
      default: null,
    },
    version: { type: Number, default: 1 },

    // 1. LINK TO USER (Data Isolation)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: function () {
        return !this.isManual;
      },
      default: null,
    },
    
    // 2. USER DETAILS (Snapshot at time of request)
    userDetails: {
      name: { type: String, required: true },
      email: { 
        type: String, 
        required: function () {
          const owner = this?.ownerDocument?.();
          return !owner?.isManual;
        },
        validate: {
          validator: function (value) {
            if (!value) return true;
            return /^\S+@\S+\.\S+$/.test(String(value));
          },
          message: "Please use a valid email address",
        },
      },
      phone: { type: String, required: true },
      company: { type: String, default: "" },
      message: { type: String, default: "" }, 
    },

    // 3. ARRAY OF REQUESTED ITEMS
    requestedItems: [requestedItemSchema],

    // 4. ADMIN MANAGEMENT FIELDS
    adminNotes: { type: String, default: "" }, 
    totalDiscount: { type: Number, default: 0 },
    extraDiscountType: { type: String, enum: ["flat", "percent"], default: "flat" },
    extraDiscountValue: { type: Number, default: 0 },
    shippingCharge: { type: Number, default: 0, min: 0 },
    finalTotal: { type: Number, default: 0 },
    isManual: { type: Boolean, default: false },
    additionalChargeName: { type: String, default: "" },
    additionalChargeAmount: { type: Number, default: 0, min: 0 },
    gstPercentage: { type: Number, default: 0, min: 0, max: 100 },
    adminUpdateLogs: { type: [String], default: [] },
    quoteLogs: [
      {
        action: { type: String, required: true },
        actor: { type: String, default: "" },
        note: { type: String, default: "" },
        at: { type: Date, default: Date.now },
      },
    ],
    
    // 5. STATUS AND VALIDITY
    quoteToken: { 
      type: String, 
      unique: true, 
      sparse: true 
    }, 
    status: {
      type: String,
      enum: ["Pending", "Responded", "Offered", "Updated", "Accepted", "Rejected"],
      default: "Pending", 
    },
    validUntil: { type: Date }, 
  },
  { timestamps: true }
);

// ⚙️ Pre-save Hook: Auto-generate 'quoteNumber' before saving to Database
quoteSchema.pre("validate", function () {
  if (!this.quoteNumber) {
    // Low-collision, human-readable quote number.
    this.quoteNumber = `QT-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
  }
});

// ==========================================
// 6. DATABASE INDEXING (For Fast Queries)
// ==========================================
quoteSchema.index({ user: 1 });
quoteSchema.index({ status: 1 });
quoteSchema.index({ isManual: 1 });
quoteSchema.index({ parentQuoteId: 1, version: -1 });
// quoteNumber already has unique index from schema field definition.

export default mongoose.model("Quote", quoteSchema);
