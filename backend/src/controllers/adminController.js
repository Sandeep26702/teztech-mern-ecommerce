import User from "../models/User.js";
import Product from "../models/Product.js"; 
import Order from "../models/Order.js";

/* ================= DASHBOARD STATS ================= */
export const getDashboardStats = async (req, res) => {
  try {
    // 1. Sabhi counts parallel mein fetch karein (Performance fast hogi)
    const [totalUsers, totalProducts, activeProducts, outOfStockProducts, totalOrders, recentOrders] = await Promise.all([
      User.countDocuments(),
      Product ? Product.countDocuments() : Promise.resolve(0),
      Product ? Product.countDocuments({ status: { $regex: "^active$", $options: "i" } }) : Promise.resolve(0),
      Product ? Product.countDocuments({ stock: { $lte: 0 } }) : Promise.resolve(0),
      Order ? Order.countDocuments() : Promise.resolve(0),
      Order
        ? Order.find({})
            .sort({ createdAt: -1 })
            .limit(5)
            .select("orderCode orderNumber totalAmount createdAt orderStatus shippingInfo")
        : Promise.resolve([]),
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
      activeProducts,
      outOfStockProducts,
      totalOrders,
      totalRevenue,
      recentOrders: recentOrders || [],
    });

  } catch (error) {
    console.error("Controller Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
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
