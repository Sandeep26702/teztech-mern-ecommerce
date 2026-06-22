import mongoose from "mongoose";

const scrapSchema = new mongoose.Schema(
  {
    material: {
      type: String,
      required: true,
      trim: true,
    },
    size: {
      type: String,
      required: true,
      trim: true,
    },
    thickness: {
      type: String,
      required: true,
      trim: true,
    },
    qty: {
      type: Number,
      default: 1,
    },
    price: {
      type: Number,
      default: 50,
    },
    status: {
      type: String,
      enum: ["Available", "Used"],
      default: "Available",
    },
  },
  { timestamps: true }
);

const Scrap = mongoose.models.Scrap || mongoose.model("Scrap", scrapSchema);
export default Scrap;
