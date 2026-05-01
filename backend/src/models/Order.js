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
    
    // 🔥 Variations Fix
    variant: { type: String },
    size: { type: String },
    color: { type: String },
    attributes: { type: mongoose.Schema.Types.Mixed, default: {} },
    priceOverride: { type: Boolean, default: false }, // true if admin set custom price
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
      required: false, // 🟡 UPDATED: Made false so Admin can create offline orders without a registered user
      index: true,
    },
    createdBy: {
      // 🟢 NEWLY ADDED: To track which Admin created this order from the panel
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Assuming your admins are in the User collection
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
    billingInfo: {
      // 🟢 NEWLY ADDED: To support the "Billing Address" section in your UI
      fullName: { type: String, trim: true },
      phone: { type: String },
      companyName: { type: String, default: "" },
      address: { type: String },
      city: { type: String },
      state: { type: String, default: "" },
      pincode: { type: String },
      country: { type: String, default: "India" },
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ['ONLINE', 'COD', 'Card', 'MANUAL TRANSFER', 'STORE_PICKUP'], 
      default: 'MANUAL TRANSFER'
    },
    paymentStatus: {
      type: String,
      required: true,
      enum: ["Awaiting Payment", "Paid", "Cancel", "Refunded", "Partially Refunded" ,"Failed" ],
      default: "Awaiting Payment",
    },
    
    // 🔥 Manual Payment & Delivery fields
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
      default: "" 
    },
    orderNotes: {
      type: String,
      default: ""
    },

    // 🚀 THE ULTIMATE FIX: Courier Partner Database Field 🚀
    courierPartner: {
      type: String,
      default: ""
    },
    selectedShippingProvider: {
      type: String,
      default: ""
    },
    // ----------------------------------------------------

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
    shippingCostOverride: { type: Boolean, default: false }, // admin manually changed shipping cost
    
    // 🟢 NEWLY ADDED: Discount Type, Tax Exemption, and Invoice Flags
    discount: { type: Number, default: 0, min: 0 }, 
    discountType: { type: String, enum: ['FLAT', 'PERCENTAGE'], default: 'FLAT' }, 
    isTaxExempt: { type: Boolean, default: false }, 
    generateTaxInvoice: { type: Boolean, default: true }, 

    taxType: { type: String, enum: ["IGST", "CGST_SGST"], default: "CGST_SGST" }, // tax mode
    shippingWeightKg: { type: Number, default: 0, min: 0 },
    totalAmount: {
      type: Number,
      required: true,
      min: [0, "Total amount cannot be negative"],
    },
    orderStatus: {
      type: String,
      required: true,
      enum: ["Ready For Pickup", "Processing", "Awaiting Processing", "Out for Delivery", "Delivered", "Cancelled", "Returned", "Shipped"],
      default: "Awaiting Processing",
    },
    deliveredAt: { type: Date },
    shippedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Order", orderSchema);