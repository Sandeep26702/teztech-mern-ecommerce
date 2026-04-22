import User from "../models/User.js";
import Product from "../models/Product.js"; 
import Order from "../models/Order.js";

/* ================= DASHBOARD STATS (UPDATED FOR NEW UI) ================= */
export const getDashboardStats = async (req, res) => {
  try {
    // 1. Date limits for Revenue calculation
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day; // Sunday as start of week
    const startOfWeek = new Date(d.setDate(diff));
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 2. Execute all database queries in parallel for maximum speed
    const [
      totalProducts,
      activeProducts,
      outOfStockProducts,
      totalOrders,
      recentOrders,
      revenueTodayAgg,
      revenueWeekAgg,
      revenueMonthAgg,
      pendingUPI,
      processing,
      shipping,
      delivered,
      lowStockItems,
      totalUsers
    ] = await Promise.all([
      // Basic counts
      Product ? Product.countDocuments() : Promise.resolve(0),
      Product ? Product.countDocuments({ status: { $regex: "^active$", $options: "i" } }) : Promise.resolve(0),
      Product ? Product.countDocuments({ stock: { $lte: 0 } }) : Promise.resolve(0),
      Order ? Order.countDocuments() : Promise.resolve(0),
      
      // Recent Orders (Last 5)
      Order ? Order.find({}).sort({ createdAt: -1 }).limit(5).select("-items -paymentScreenshot") : Promise.resolve([]),
      
      // Revenue calculations using MongoDB Aggregation
      Order ? Order.aggregate([{ $match: { createdAt: { $gte: startOfToday }, paymentStatus: { $ne: "Failed" } } }, { $group: { _id: null, total: { $sum: "$totalAmount" } } }]) : Promise.resolve([{total: 0}]),
      Order ? Order.aggregate([{ $match: { createdAt: { $gte: startOfWeek }, paymentStatus: { $ne: "Failed" } } }, { $group: { _id: null, total: { $sum: "$totalAmount" } } }]) : Promise.resolve([{total: 0}]),
      Order ? Order.aggregate([{ $match: { createdAt: { $gte: startOfMonth }, paymentStatus: { $ne: "Failed" } } }, { $group: { _id: null, total: { $sum: "$totalAmount" } } }]) : Promise.resolve([{total: 0}]),
      
      // Action Alerts
      Order ? Order.countDocuments({ paymentMethod: "MANUAL", paymentStatus: "Pending" }) : Promise.resolve(0),
      
      // Order Status counts
      Order ? Order.countDocuments({ orderStatus: "Processing" }) : Promise.resolve(0),
      Order ? Order.countDocuments({ orderStatus: "Shipping" }) : Promise.resolve(0),
      Order ? Order.countDocuments({ orderStatus: "Delivered" }) : Promise.resolve(0),
      
      // Low Stock Alert (Stock < 5)
      Product ? Product.find({ stock: { $lt: 5 } }).select("name stock").limit(10).sort({ stock: 1 }) : Promise.resolve([]),
      
      User.countDocuments()
    ]);

    // 3. Format response exactly as React frontend expects
    res.status(200).json({
      success: true,
      stats: {
        // Essential metrics for new Dashboard
        revenue: {
          today: revenueTodayAgg[0]?.total || 0,
          week: revenueWeekAgg[0]?.total || 0,
          month: revenueMonthAgg[0]?.total || 0
        },
        pendingUPI,
        orderStatus: { processing, shipping, delivered },
        lowStockItems,
        recentOrders: recentOrders || [],
        
        // Retained basic stats to avoid breaking old components
        totalProducts,
        activeProducts,
        outOfStockProducts,
        totalOrders,
        totalUsers
      }
    });

  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    res.status(500).json({ success: false, message: "Server Error calculating stats" });
  }
};

/* ================= GET ALL USERS ================= */
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select("-password")
      .sort({ createdAt: -1 });
    res.status(200).json({ 
        success: true, 
        users,
        totalUsers: users.length 
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

/* ================= GET USER DETAIL ================= */
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const [ordersCount, totalSpent] = await Promise.all([
      Order.countDocuments({ user: user._id }),
      Order.aggregate([
        { $match: { user: user._id } },
        { $group: { _id: null, amount: { $sum: "$totalAmount" } } },
      ]),
    ]);

    res.status(200).json({
      success: true,
      user,
      stats: {
        ordersCount,
        totalSpent: totalSpent?.[0]?.amount || 0,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= UPDATE USER PROFILE (ADMIN) ================= */
export const updateUserProfileByAdmin = async (req, res) => {
  try {
    const { name, phone, email, isActive, blockedReason } = req.body;
    const payload = {};

    if (name !== undefined) payload.name = String(name || "").trim();
    if (phone !== undefined) {
      const cleanedPhone = String(phone || "").trim();
      if (!/^\d{10}$/.test(cleanedPhone)) {
        return res.status(400).json({ success: false, message: "Phone must be 10 digits" });
      }
      payload.phone = cleanedPhone;
      payload.userId = cleanedPhone;
    }
    if (email !== undefined) payload.email = String(email || "").trim().toLowerCase();
    if (isActive !== undefined) payload.isActive = Boolean(isActive);
    if (blockedReason !== undefined) payload.blockedReason = String(blockedReason || "").trim();

    const updatedUser = await User.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, user: updatedUser, message: "User updated successfully" });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(400).json({ success: false, message: "Email or mobile already exists" });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= BLOCK/UNBLOCK USER ================= */
export const toggleUserBlockStatus = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Only admin can block users" });
    }

    const { isActive, blockedReason } = req.body;
    if (typeof isActive !== "boolean") {
      return res.status(400).json({ success: false, message: "isActive(boolean) is required" });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (String(user._id) === String(req.user._id) && isActive === false) {
      return res.status(400).json({ success: false, message: "You cannot block your own account" });
    }

    user.isActive = isActive;
    user.blockedReason = isActive ? "" : String(blockedReason || "Blocked by admin").trim();
    await user.save();

    res.status(200).json({
      success: true,
      message: isActive ? "User unblocked successfully" : "User blocked successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};