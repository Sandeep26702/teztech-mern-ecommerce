import mongoose from "mongoose";

const purchaseOrderItemSchema = new mongoose.Schema(
  {
    materialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Material",
      required: true,
    },
    qty: {
      type: Number,
      required: true,
      min: 1,
    },
    rate: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const purchaseOrderSchema = new mongoose.Schema(
  {
    poNumber: {
      type: String,
      unique: true,
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },
    status: {
      type: String,
      enum: ["Drafted", "Sent to Vendor", "In Transit", "Received"],
      default: "Drafted",
    },
    expectedDate: {
      type: Date,
      required: true,
    },
    items: [purchaseOrderItemSchema],
    createdDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Auto-generate unique PO number (PO-XXXX)
purchaseOrderSchema.pre("validate", async function () {
  if (!this.poNumber) {
    let isUnique = false;
    while (!isUnique) {
      const num = Math.floor(1000 + Math.random() * 9000); // 1000 to 9999
      const generated = `PO-${num}`;
      const exists = await this.constructor.findOne({ poNumber: generated });
      if (!exists) {
        this.poNumber = generated;
        isUnique = true;
      }
    }
  }
});

const PurchaseOrder = mongoose.models.PurchaseOrder || mongoose.model("PurchaseOrder", purchaseOrderSchema);
export default PurchaseOrder;
