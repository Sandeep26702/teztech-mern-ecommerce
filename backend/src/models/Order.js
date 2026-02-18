import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        name: String,
        price: Number,
        quantity: Number,
        image: String,
      },
    ],

    shippingAddress: {
      fullName: String,
      phone: String,
      address: String,
      city: String,
      pincode: String,
    },

    paymentMethod: {
      type: String,
      default: "COD",
    },

    totalAmount: Number,

   status: {
  type: String,
  enum: ["Pending", "Shipped", "Delivered", "Cancelled"],
  default: "Pending",
   },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
