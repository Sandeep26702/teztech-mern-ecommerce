import mongoose from "mongoose";

const materialSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    sku: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },
    stock: {
      type: Number,
      default: 0,
    },
    minStockLimit: {
      type: Number,
      default: 5,
    },
    unit: {
      type: String,
      default: "rolls",
      trim: true,
    },
  },
  { timestamps: true }
);

const Material = mongoose.models.Material || mongoose.model("Material", materialSchema);
export default Material;
