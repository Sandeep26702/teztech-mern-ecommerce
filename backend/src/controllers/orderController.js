import Order from '../models/Order.js';

/**
 * @description 1. User: Naya Order Create Karein
 */
export const createOrder = async (req, res) => {
  try {
    const { items, shippingInfo, paymentMethod, totalAmount } = req.body;
    
    // Security check
    if (!items || items.length === 0 || !shippingInfo) {
      return res.status(400).json({ success: false, message: "Invalid order data: Cart empty or address missing" });
    }

    const order = new Order({
      user: req.user._id, 
      items,
      shippingInfo,
      paymentMethod,
      totalAmount,
      paymentStatus: paymentMethod === 'COD' ? 'Pending' : 'Paid' 
    });

    const savedOrder = await order.save();
    res.status(201).json({ 
      success: true, 
      message: "Order placed successfully!", 
      order: savedOrder 
    });
  } catch (error) {
    console.error("Order Creation Error:", error);
    res.status(500).json({ success: false, message: "Server error while placing order" });
  }
};

/**
 * @description 2. User: Apne saare orders dekhne ke liye (My Orders Page)
 */
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error("Get My Orders Error:", error);
    res.status(500).json({ success: false, message: "Orders fetch karne mein dikkat aayi" });
  }
};

/**
 * @description 3. Admin: Saare Users ke Orders Fetch Karein
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
 * @description 4. Universal: Single Order details (Detail page ke liye)
 */
export const getOrderDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id).populate('user', 'name email');

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
 * @description 5. Admin: Order Status Update Karein
 */
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { orderStatus, paymentStatus } = req.body;

    const order = await Order.findByIdAndUpdate(
      orderId, 
      { orderStatus, paymentStatus }, 
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.status(200).json({ 
      success: true, 
      message: `Order status updated to ${orderStatus}`, 
      order 
    });
  } catch (error) {
    console.error("Update Order Error:", error);
    res.status(500).json({ success: false, message: "Failed to update order status" });
  }
};