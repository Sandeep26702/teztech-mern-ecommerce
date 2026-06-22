import mongoose from "mongoose";

const creditNoteSchema = new mongoose.Schema(
  {
    creditNoteId: {
      type: String,
      unique: true,
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },
    materialName: {
      type: String,
      required: true,
      trim: true,
    },
    value: {
      type: Number,
      required: true,
      min: 0,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["Pending Adjustment", "Adjusted"],
      default: "Pending Adjustment",
    },
  },
  { timestamps: true }
);

// Auto-generate unique Credit Note ID (CR-XXXX)
creditNoteSchema.pre("validate", async function () {
  if (!this.creditNoteId) {
    let isUnique = false;
    while (!isUnique) {
      const num = Math.floor(1000 + Math.random() * 9000); // 1000 to 9999
      const generated = `CR-${num}`;
      const exists = await this.constructor.findOne({ creditNoteId: generated });
      if (!exists) {
        this.creditNoteId = generated;
        isUnique = true;
      }
    }
  }
});

const CreditNote = mongoose.models.CreditNote || mongoose.model("CreditNote", creditNoteSchema);
export default CreditNote;
