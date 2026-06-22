import mongoose from "mongoose";

const designRequestSchema = new mongoose.Schema(
  {
    requestCode: {
      type: String,
      unique: true,
    },
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      default: null,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
    designName: {
      type: String,
      required: true,
      trim: true,
    },
    dimensions: {
      type: String,
      trim: true,
    },
    materialSpecs: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Design Ready", "Approved", "Rejected"],
      default: "Pending",
    },
    priority: {
      type: String,
      enum: ["Normal", "High Priority", "Urgent"],
      default: "Normal",
    },
    quantity: {
      type: Number,
      default: 1,
    },
    commonLineCuttingUsed: {
      type: Boolean,
      default: false,
    },
    referenceFileUrl: {
      type: String,
      default: "",
    },
    optimizedSvgUrl: {
      type: String,
      default: "",
    },
    versions: [
      {
        versionNumber: { type: Number, required: true },
        fileUrl: { type: String, required: true },
        commonLineCuttingUsed: { type: Boolean, default: false },
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        createdAt: { type: Date, default: Date.now },
      }
    ],
    salesAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    designer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    comments: [
      {
        author: { type: String, default: "" },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Auto-generate a unique design request code (DR-XXXX)
designRequestSchema.pre("validate", async function () {
  if (!this.requestCode) {
    let isUnique = false;
    while (!isUnique) {
      const num = Math.floor(1000 + Math.random() * 9000); // 1000 to 9999
      const generated = `DR-${num}`;
      const exists = await this.constructor.findOne({ requestCode: generated });
      if (!exists) {
        this.requestCode = generated;
        isUnique = true;
      }
    }
  }
});

const DesignRequest = mongoose.models.DesignRequest || mongoose.model("DesignRequest", designRequestSchema);
export default DesignRequest;
