import mongoose from "mongoose";

const importJobSchema = new mongoose.Schema(
  {
    // ==========================
    // 📁 FILE INFO
    // ==========================
    fileName: { type: String, trim: true },
    originalName: { type: String, trim: true },
    fileSize: { type: Number, default: 0 },

    // ==========================
    // 📊 IMPORT STATS
    // ==========================
    totalRows: { type: Number, default: 0 },
    processed: { type: Number, default: 0 }, 
    importedCount: { type: Number, default: 0 },
    updatedCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },

    // ==========================
    // 📌 STATUS TRACKING
    // ==========================
    status: {
      type: String,
      enum: ["processing", "completed", "failed", "rolled_back"],
      default: "processing",
      index: true,
    },

    // ==========================
    // 👤 USER
    // ==========================
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
      default: null,
    },

    // ==========================
    // 🔄 ROLLBACK SUPPORT
    // ==========================
    createdProductIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],

    rollbackAt: Date,

    // ==========================
    // ⚠️ ERROR LOG
    // ==========================
    errorLogs: [
      {
        row: Number,
        message: String,
        rawData: mongoose.Schema.Types.Mixed,
      },
    ],

    // ==========================
    // ⏱️ PERFORMANCE TRACKING
    // ==========================
    startedAt: {
      type: Date,
      default: Date.now,
    },

    completedAt: Date,

    durationMs: Number,
  },
  {
    timestamps: true,
  }
);

// ==========================
// 🔥 INDEXES (PERFORMANCE)
// ==========================
importJobSchema.index({ createdAt: -1 });
importJobSchema.index({ status: 1, createdAt: -1 });
importJobSchema.index({ createdBy: 1, createdAt: -1 });

// ==========================
// 🔥 AUTO DURATION CALC
// ==========================
importJobSchema.pre("save", function () {
  if (this.startedAt && this.completedAt) {
    this.durationMs = new Date(this.completedAt).getTime() - new Date(this.startedAt).getTime();
  }
});

export default mongoose.model("ProductImportJob", importJobSchema);