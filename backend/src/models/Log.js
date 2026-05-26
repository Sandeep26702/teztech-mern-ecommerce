import mongoose from "mongoose";

const logSchema = new mongoose.Schema(
  {
    ipAddress: {
      type: String,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    email: {
      type: String,
      default: null,
    },
    action: {
      type: String,
      required: true,
    },
    riskLevel: {
      type: String,
      enum: ["Safe", "Warning", "Blocked"],
      default: "Safe",
    },
    method: {
      type: String,
      required: true,
    },
    endpoint: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes to speed up searching and filtering
logSchema.index({ ipAddress: 1 });
logSchema.index({ email: 1 });
logSchema.index({ riskLevel: 1 });
logSchema.index({ createdAt: -1 });
logSchema.index({ action: 1 });

const Log = mongoose.model("Log", logSchema);

export default Log;
