import User from "../models/User.js";
// Agar aapke paas Product ya Order model nahi hai, to neeche wali 2 lines comment kar dein
import Product from "../models/Product.js"; 
import Order from "../models/Order.js";

/* ================= DASHBOARD STATS ================= */
export const getDashboardStats = async (req, res) => {
  try {
    // Counts nikalein (Agar Model nahi hai to 0 maanein)
    const totalUsers = await User.countDocuments();
    
    // Safety check: Agar Product model exist karta hai tabhi count karein
    const totalProducts = Product ? await Product.countDocuments() : 0;
    
    // Safety check: Agar Order model exist karta hai tabhi count karein
    const totalOrders = Order ? await Order.countDocuments() : 0;

    // Revenue calculation (Basic logic)
    // Agar Order model hai, to total amount sum karein
    let totalRevenue = 0;
    if (Order) {
      const orders = await Order.find();
      totalRevenue = orders.reduce((acc, order) => acc + (order.totalPrice || 0), 0);
    }

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

/* ================= GET ALL USERS ================= */
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({});
    res.status(200).json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= DELETE USER ================= */
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Admin khud ko delete na kar sake
    if (user.role === "admin") {
        return res.status(400).json({ success: false, message: "Cannot delete Admin account" });
    }

    await user.deleteOne();
    res.status(200).json({ success: true, message: "User removed" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= UPDATE USER ROLE ================= */
export const updateUserRole = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Role update karein
    user.role = req.body.role || user.role;
    
    await user.save();

    res.status(200).json({ success: true, message: "User updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};