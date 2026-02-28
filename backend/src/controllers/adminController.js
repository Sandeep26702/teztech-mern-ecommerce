import User from "../models/User.js";
import Product from "../models/Product.js"; 
import Order from "../models/Order.js";

/* ================= DASHBOARD STATS ================= */
export const getDashboardStats = async (req, res) => {
  try {
    // 1. Sabhi counts parallel mein fetch karein (Performance fast hogi)
    const [totalUsers, totalProducts, totalOrders] = await Promise.all([
      User.countDocuments(),
      Product ? Product.countDocuments() : Promise.resolve(0),
      Order ? Order.countDocuments() : Promise.resolve(0)
    ]);

    // 2. Revenue calculation
    let totalRevenue = 0;
    if (Order) {
      const orders = await Order.find({}, 'totalPrice'); // Sirf totalPrice field fetch karein
      totalRevenue = orders.reduce((acc, order) => acc + (order.totalPrice || 0), 0);
    }

    // 3. Response Structure Fix: Frontend ke fetchStats() ke mutabiq bhej rahe hain
    res.status(200).json({
      success: true,
      totalUsers,     // Seedha bhej rahe hain bina extra 'data' object ke
      totalProducts,
      totalOrders,
      totalRevenue
    });

  } catch (error) {
    console.error("Controller Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

/* ================= GET ALL USERS ================= */
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select("-password"); // Password hide karke bhejien
    res.status(200).json({ 
        success: true, 
        users,
        totalUsers: users.length // Ye line 404 error fix karne mein help karegi
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= DELETE USER ================= */
export const deleteUser = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Only admin can delete users" });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

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
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Only admin can change user roles" });
    }

    const allowedRoles = ["user", "subadmin", "admin"];
    const newRole = req.body?.role;
    if (!newRole || !allowedRoles.includes(newRole)) {
      return res.status(400).json({ success: false, message: "Invalid role provided" });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Prevent accidental admin lockout by self-demotion.
    if (String(user._id) === String(req.user._id) && newRole !== "admin") {
      return res.status(400).json({ success: false, message: "You cannot remove your own admin role" });
    }

    user.role = newRole;
    await user.save();

    res.status(200).json({ success: true, message: "User updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
