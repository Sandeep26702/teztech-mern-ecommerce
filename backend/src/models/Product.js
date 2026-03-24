import mongoose from "mongoose";

const customFieldOptionSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
    },
    priceAdjustment: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const customFieldSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["radio", "checkbox", "text"],
      default: "radio",
    },
    required: {
      type: Boolean,
      default: false,
    },
    options: {
      type: [customFieldOptionSchema],
      default: [],
    },
  },
  { _id: true }
);

const detailItemSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true,
    },
    value: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    // User jisne product banaya (Admin)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    productId: {
      type: String,
      trim: true,
      default: "",
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    sku: {
      type: String,
      trim: true,
      index: true,
      unique: true,
      sparse: true,
    },
    image: {
      type: String,
      default: "https://placehold.co/600x600?text=Product",
    },
    images: {
      type: [String],
      default: [],
    },
    brand: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      default: "Uncategorized",
      trim: true,
    },
    categoryPath: {
      type: String,
      default: "",
      trim: true,
    },
    categories: {
      type: [String],
      default: [],
    },
    description: {
      type: String,
      default: "",
    },
    price: {
      type: Number,
      default: 0,
    },
    sellingPrice: {
      type: Number,
      default: 0,
    },
    mrp: {
      type: Number,
      default: 0,
    },
    gstRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    shippingCharge: {
      type: Number,
      default: 0,
      min: 0,
    },
    stock: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      default: "Active",
      trim: true,
    },
    searchTags: {
      type: [String],
      default: [],
    },
    searchIndex: {
      type: String,
      default: "",
      trim: true,
    },
    heightFt: {
      type: String,
      default: "",
    },
    widthFt: {
      type: String,
      default: "",
    },
    totalHoles: {
      type: String,
      default: "",
    },
    holeSize: {
      type: String,
      default: "",
    },
    materialType: {
      type: String,
      default: "",
    },
    sheetThickness: {
      type: String,
      default: "",
    },
    ledCompatible: {
      type: String,
      default: "",
    },
    inputVoltage: {
      type: String,
      default: "",
    },
    outputVoltage: {
      type: String,
      default: "",
    },
    powerWatt: {
      type: String,
      default: "",
    },
    connectivity: {
      type: String,
      default: "",
    },
    icNumber: {
      type: String,
      default: "",
    },
    ledPerMeter: {
      type: String,
      default: "",
    },
    controllerType: {
      type: String,
      default: "",
    },
    warranty: {
      type: String,
      default: "",
    },
    colorRedAdd: {
      type: Number,
      default: null,
    },
    colorGreenAdd: {
      type: Number,
      default: null,
    },
    colorBlueAdd: {
      type: Number,
      default: null,
    },
    hole9mmAdd: {
      type: Number,
      default: null,
    },
    hole12mmAdd: {
      type: Number,
      default: null,
    },
    materialTezTechAdd: {
      type: Number,
      default: null,
    },
    materialSunriseAdd: {
      type: Number,
      default: null,
    },
    power12WAdd: {
      type: Number,
      default: null,
    },
    power24WAdd: {
      type: Number,
      default: null,
    },
    remoteAdd: {
      type: Number,
      default: null,
    },
    waterproofAdd: {
      type: Number,
      default: null,
    },
    customFields: {
      type: [customFieldSchema],
      default: [],
    },
    details: {
      type: [detailItemSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model("Product", productSchema);

// ✅ IMPORTANT: Default Export for ES6
export default Product;
