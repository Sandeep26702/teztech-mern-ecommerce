import mongoose from "mongoose";

const jobCardSchema = new mongoose.Schema(
  {
    jobCode: {
      type: String,
      unique: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    optimizedSvgUrl: {
      type: String,
      default: "",
    },
    thickness: {
      type: Number,
      required: true,
    },
    materialType: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Awaiting Production", "In Production", "Completed"],
      default: "Awaiting Production",
    },
    operatorNotes: {
      type: String,
      default: "",
    },
    startedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Auto-generate unique Job Card ID (JC-XXXX)
jobCardSchema.pre("validate", async function () {
  if (!this.jobCode) {
    let isUnique = false;
    while (!isUnique) {
      const num = Math.floor(1000 + Math.random() * 9000); // 1000 to 9999
      const generated = `JC-${num}`;
      const exists = await this.constructor.findOne({ jobCode: generated });
      if (!exists) {
        this.jobCode = generated;
        isUnique = true;
      }
    }
  }
});

const JobCard = mongoose.models.JobCard || mongoose.model("JobCard", jobCardSchema);
export default JobCard;
