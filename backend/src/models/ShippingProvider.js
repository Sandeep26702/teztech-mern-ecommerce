import mongoose from "mongoose";

const shippingProviderSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Shipping company name is required"],
      trim: true,
      unique: true,
    },
    baseRate: {
      type: Number,
      required: [true, "Base rate for the first 1 KG is required"],
      min: [0, "Base rate cannot be negative"],
    },
    extraRatePerKg: {
      type: Number,
      required: [true, "Extra rate per additional KG is required"],
      min: [0, "Extra rate cannot be negative"],
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Pre-save hook to ensure only one default provider exists
shippingProviderSchema.pre("save", async function (next) {
  if (this.isDefault) {
    await this.constructor.updateMany(
      { _id: { $ne: this._id } },
      { $set: { isDefault: false } }
    );
  }
  next();
});

// Pre-update hook for findOneAndUpdate etc.
shippingProviderSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate();
  if (update.isDefault || (update.$set && update.$set.isDefault)) {
    const query = this.getQuery();
    await this.model.updateMany(
      { _id: { $ne: query._id } },
      { $set: { isDefault: false } }
    );
  }
  next();
});

const ShippingProvider = mongoose.models.ShippingProvider || mongoose.model("ShippingProvider", shippingProviderSchema);
export default ShippingProvider;
