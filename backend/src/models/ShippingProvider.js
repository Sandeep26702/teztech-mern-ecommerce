import mongoose from "mongoose";

const shippingProviderSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Shipping company name is required"],
      trim: true,
      unique: true,
    },
    ratePerKg: {
      type: Number,
      required: [true, "Rate per KG is required"],
      min: [0, "Rate cannot be negative"],
      default: 0,
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
shippingProviderSchema.pre("save", async function () {
  if (this.isDefault) {
    await this.constructor.updateMany(
      { _id: { $ne: this._id } },
      { $set: { isDefault: false } }
    );
  }
});

// Pre-update hook for findOneAndUpdate etc.
shippingProviderSchema.pre("findOneAndUpdate", async function () {
  const update = this.getUpdate();
  if (update.isDefault || (update.$set && update.$set.isDefault)) {
    const query = this.getQuery();
    await this.model.updateMany(
      { _id: { $ne: query._id } },
      { $set: { isDefault: false } }
    );
  }
});

const ShippingProvider = mongoose.models.ShippingProvider || mongoose.model("ShippingProvider", shippingProviderSchema);
export default ShippingProvider;
