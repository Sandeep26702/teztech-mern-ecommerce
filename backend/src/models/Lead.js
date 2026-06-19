import mongoose from "mongoose";

const leadSchema = new mongoose.Schema(
  {
    leadCode: {
      type: String,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    requirement: {
      type: String,
      trim: true,
    },
    source: {
      type: String,
      default: "Ad Campaign",
    },
    status: {
      type: String,
      enum: ["New", "Contacted", "In Negotiation", "Negotiation", "Won", "Lost"],
      default: "New",
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    notes: [
      {
        author: { type: String, default: "" },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Auto-generate a unique lead code (LD-XXXX)
leadSchema.pre("validate", async function () {
  if (!this.leadCode) {
    let isUnique = false;
    while (!isUnique) {
      const num = Math.floor(1000 + Math.random() * 9000); // 1000 to 9999
      const generated = `LD-${num}`;
      const exists = await this.constructor.findOne({ leadCode: generated });
      if (!exists) {
        this.leadCode = generated;
        isUnique = true;
      }
    }
  }
});

const Lead = mongoose.models.Lead || mongoose.model("Lead", leadSchema);
export default Lead;
