const mongoose = require('mongoose');

const quoteSchema = new mongoose.Schema({
  userDetails: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    company: { type: String },
    phone: { type: String },
    message: { type: String }
  },
  requestedItems: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      name: { type: String, required: true },
      quantity: { type: Number, required: true, min: 1 }
    }
  ],
  status: { 
    type: String, 
    default: 'Pending',
    enum: ['Pending', 'Reviewed', 'Completed'] 
  }
}, { timestamps: true });

module.exports = mongoose.model('Quote', quoteSchema);