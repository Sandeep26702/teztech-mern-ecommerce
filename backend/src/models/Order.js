import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      name: { type: String, required: true },
      price: { type: Number, required: true },
      quantity: { type: Number, required: true },
      image: { type: String }
    }
  ],
  shippingInfo: {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    pincode: { type: String, required: true }
  },
  paymentMethod: { type: String, required: true, default: 'COD' }, // 'COD' ya 'ONLINE'
  paymentStatus: { type: String, required: true, default: 'Pending' }, // Pending, Paid, Failed
  totalAmount: { type: Number, required: true },
  orderStatus: { type: String, required: true, default: 'Processing' }, // Processing, Shipped, Delivered, Cancelled
}, { timestamps: true });

export default mongoose.model('Order', orderSchema);