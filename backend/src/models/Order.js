import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    sku: { type: String, default: "" },
    name: { type: String, required: true },
    category: { type: String, default: "Uncategorized" },
    image: { type: String, required: true },
    quantity: { type: Number, required: true, min: [1, "Quantity cannot be less than 1"] },
    basePrice: { type: Number, required: true, min: 0 },
    
    // 🔥 THE FIX: Ye naye fields add kiye hain taaki Mongoose variations ko delete na kare!
    variant: { type: String },
    size: { type: String },
    color: { type: String },
    attributes: { type: mongoose.Schema.Types.Mixed, default: {} },
    // ---------------------------------------------------------

    optionAdjustment: { type: Number, default: 0 },
    gstRate: { type: Number, default: 0, min: 0, max: 100 },
    unitPrice: { type: Number, required: true, min: 0 },
    gstAmount: { type: Number, required: true, min: 0 },
    price: { type: Number, required: true, min: 0 },
    shippingCharge: { type: Number, default: 0, min: 0 },
    selectedCustomFields: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    selectedOptions: [
      {
        fieldLabel: { type: String, required: true },
        value: { type: String, required: true },
        priceAdjustment: { type: Number, default: 0 },
      },
    ],
    lineSubtotal: { type: Number, required: true, min: 0 },
    lineGstTotal: { type: Number, required: true, min: 0 },
    lineShippingTotal: { type: Number, default: 0, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: Number,
      unique: true,
      index: true,
      sparse: true,
    },
    orderCode: {
      type: String,
      unique: true,
      index: true,
      sparse: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    items: [orderItemSchema],
    shippingInfo: {
      fullName: { type: String, required: true, trim: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, default: "" },
      pincode: { type: String, required: true },
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ['ONLINE', 'COD', 'Card', 'MANUAL', 'STORE_PICKUP'], 
      default: 'MANUAL'
    },
    paymentStatus: {
      type: String,
      required: true,
      enum: ["Pending", "Paid", "Failed", "Refunded"],
      default: "Pending",
    },
    
    // 🔥 NAYI FIELDS: Manual Payment ke liye
    deliveryType: {
      type: String,
      enum: ['ship', 'pickup'],
      default: 'ship'
    },
    utrNumber: {
      type: String,
      default: ""
    },
    paymentScreenshot: {
      type: String,
      default: "" // Yahan image ka path aayega
    },
    orderNotes: {
      type: String,
      default: ""
    },
    // 🔥 ----------------------------------------------------

    subtotalAmount: {
      type: Number,
      required: true,
      min: [0, "Subtotal amount cannot be negative"],
    },
    gstAmount: {
      type: Number,
      required: true,
      min: [0, "GST amount cannot be negative"],
    },
    shippingAmount: {
      type: Number,
      default: 0,
      min: [0, "Shipping amount cannot be negative"],
    },
    totalAmount: {
      type: Number,
      required: true,
      min: [0, "Total amount cannot be negative"],
    },
    orderStatus: {
      type: String,
      required: true,
      enum: ["Confirmed", "Processing", "Shipping", "Out for Delivery", "Delivered", "Cancelled", "Returned", "Shipped"],
      default: "Confirmed",
    },
    deliveredAt: { type: Date },
    shippedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Order", orderSchema);