import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  // Indexing 'user' for faster lookup in "My Orders"
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  },
  
  items: [
    {
      productId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Product', 
        required: true 
      },
      name: { type: String, required: true },
      price: { type: Number, required: true },
      quantity: { type: Number, required: true, min: [1, 'Quantity cannot be less than 1'] },
      image: { type: String, required: true }
    }
  ],

  shippingInfo: {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    pincode: { type: String, required: true }
  },

  paymentMethod: { 
    type: String, 
    required: true, 
    enum: ['COD', 'ONLINE'], // Sirf yehi do values allow hongi
    default: 'COD' 
  },

  paymentStatus: { 
    type: String, 
    required: true, 
    enum: ['Pending', 'Paid', 'Failed', 'Refunded'], 
    default: 'Pending' 
  },

  totalAmount: { 
    type: Number, 
    required: true,
    min: [0, 'Total amount cannot be negative']
  },

  orderStatus: { 
    type: String, 
    required: true, 
    enum: ['Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned'], 
    default: 'Processing' 
  },

  // Logistics details (Optional: Flipkart level tracking ke liye)
  deliveredAt: { type: Date },
  shippedAt: { type: Date },

}, { 
  timestamps: true // Isse 'createdAt' aur 'updatedAt' apne aap mil jayenge
});

// Middleware: Order save hone se pehle total amount verify karne ka logic yahan bhi daal sakte hain
export default mongoose.model('Order', orderSchema);