import mongoose from "mongoose";

const importErrorSchema = new mongoose.Schema(
  {
    row: { type: Number, required: true },
    message: { type: String, required: true },
  },
  { _id: false }
);

const productImportJobSchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fileName: {
      type: String,
      required: true,
      trim: true,
    },
    totalRows: {
      type: Number,
      default: 0,
    },
    importedCount: {
      type: Number,
      default: 0,
    },
    failedCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["active", "rolled_back"],
      default: "active",
    },
    createdProductIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    touchedCategoryNames: [
      {
        type: String,
        trim: true,
      },
    ],
    errors: [importErrorSchema],
    rolledBackAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    suppressReservedKeysWarning: true,
  }
);

productImportJobSchema.index({ createdAt: -1 });
productImportJobSchema.index({ status: 1 });

export default mongoose.model("ProductImportJob", productImportJobSchema);
