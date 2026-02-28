import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Cart from '../models/Cart.js'; // Order ke baad cart saaf karne ke liye
import mongoose from 'mongoose';

/**
 * @description 1. User: Naya Order Create Karein (Flipkart-Style Logic)
 */
export const createOrder = async (req, res) => {
  try {
    const { items, shippingInfo, paymentMethod } = req.body;

    // 1. Basic Validation
    if (!items || items.length === 0 || !shippingInfo) {
      return res.status(400).json({ success: false, message: "Cart is empty or address missing" });
    }
    if (!['COD', 'ONLINE'].includes(paymentMethod)) {
      return res.status(400).json({ success: false, message: "Invalid payment method" });
    }
    if (!shippingInfo.fullName || !shippingInfo.phone || !shippingInfo.address || !shippingInfo.city || !shippingInfo.pincode) {
      return res.status(400).json({ success: false, message: "Please provide complete shipping information" });
    }

    let calculatedTotal = 0;
    const finalOrderItems = [];

    // 2. SECURITY & STOCK CHECK (Real-world Niyam)
    for (const item of items) {
      if (!item?.productId || !Number.isFinite(Number(item?.quantity)) || Number(item.quantity) < 1) {
        return res.status(400).json({ success: false, message: "Each order item must include valid productId and quantity" });
      }
      if (!mongoose.Types.ObjectId.isValid(item.productId)) {
        return res.status(400).json({ success: false, message: `Invalid productId: ${item.productId}` });
      }

      const product = await Product.findById(item.productId);

      if (!product) {
        return res.status(404).json({ success: false, message: `Product not found: ${item.name || item.productId}` });
      }

      // Stock Check
      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Sorry, only ${product.stock} units of ${product.name} are available.`
        });
      }

      // Snapshotting: Store the price and name at the time of purchase
      // Taaki kal ko price badle toh purane order par asar na pade
      const safeImage = product.images?.[0]?.url || product.images?.[0] || item.image || "https://placehold.co/600x600?text=Product";
      finalOrderItems.push({
        productId: product._id,
        name: product.name,
        price: product.price, // Backend DB wala price use karein, frontend wala nahi
        quantity: Number(item.quantity),
        image: safeImage
      });

      // Stock Update
      product.stock -= Number(item.quantity);
      await product.save();

      calculatedTotal += product.price * Number(item.quantity);
    }

    // 3. Create Order Object
    const order = new Order({
      user: req.user._id,
      items: finalOrderItems,
      shippingInfo,
      paymentMethod,
      totalAmount: calculatedTotal, // Security: Calculated total use karein
      paymentStatus: paymentMethod === 'COD' ? 'Pending' : 'Paid'
    });

    const savedOrder = await order.save();

    // 4. CART CLEANUP (Real-world Requirement)
    // Order hone ke baad database se cart items delete hone chahiye
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });

    res.status(201).json({
      success: true,
      message: "Order placed successfully!",
      order: savedOrder
    });
  } catch (error) {
    console.error("Order Creation Error:", error);
    if (error?.name === "ValidationError") {
      return res.status(400).json({ success: false, message: error.message });
    }
    if (error?.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid request data format" });
    }
    res.status(500).json({ success: false, message: "Server error while placing order" });
  }
};

/**
 * @description 2. User: My Orders Page
 */
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error("Get My Orders Error:", error);
    res.status(500).json({ success: false, message: "Error fetching your orders" });
  }
};

/**
 * @description 3. Admin: All Orders
 */
export const getAllOrdersForAdmin = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error("Fetch Admin Orders Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
};

/**
 * @description 4. Universal: Single Order details
 */
export const getOrderDetail = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error("Order Detail Error:", error);
    res.status(500).json({ success: false, message: "Error fetching order details" });
  }
};

/**
 * @description 5. Admin: Status Update
 */
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus, paymentStatus } = req.body;

    const order = await Order.findByIdAndUpdate(
      req.params.orderId,
      { orderStatus, paymentStatus },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.status(200).json({
      success: true,
      message: `Order marked as ${orderStatus}`,
      order
    });
  } catch (error) {
    console.error("Update Order Error:", error);
    res.status(500).json({ success: false, message: "Failed to update order status" });
  }
};
