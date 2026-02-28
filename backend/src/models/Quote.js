import mongoose from "mongoose";
import crypto from "crypto";

// 📦 Sub-schema for Requested Items (Clean Code Architecture)
const requestedItemSchema = new mongoose.Schema(
  {
    productId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Product",
      required: true 
    },
    name: { type: String, required: true }, // Snapshot of product name
    quantity: { 
      type: Number, 
      required: true,
      min: [1, "Quantity cannot be less than 1"]
    },
    originalPrice: { type: Number, default: 0 },
    offeredPrice: { type: Number, default: 0 } // Admin updates this later
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

    // 1. LINK TO USER (Data Isolation)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    
    // 2. USER DETAILS (Snapshot at time of request)
    userDetails: {
      name: { type: String, required: true },
      email: { 
        type: String, 
        required: true,
        match: [/^\S+@\S+\.\S+$/, "Please use a valid email address"] // Security Check
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
    finalTotal: { type: Number, default: 0 }, 
    
    // 5. STATUS AND VALIDITY
    quoteToken: { 
      type: String, 
      unique: true, 
      sparse: true 
    }, 
    status: {
      type: String,
      enum: ["Pending", "Responded", "Accepted", "Rejected"],
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
// quoteNumber already has unique index from schema field definition.

export default mongoose.model("Quote", quoteSchema);
