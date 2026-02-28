import User from "../models/User.js";
import bcrypt from "bcryptjs";

/* ============================================================
    1. GET LOGGED IN USER PROFILE (Individual)
============================================================ */
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password -__v");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ============================================================
    2. UPDATE PROFILE
============================================================ */
export const updateProfile = async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;

    if (address) {
      updateData.address = typeof address === "string" ? JSON.parse(address) : address;
    }

    if (req.file) {
      updateData.profileImage = `/uploads/${req.file.filename}`;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select("-password -__v");

    res.status(200).json({ success: true, message: "Profile updated successfully", user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ============================================================
    3. CHANGE PASSWORD
============================================================ */
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select("+password");

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ success: false, message: "Current password incorrect" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ============================================================
    4. ADMIN: UPDATE USER ROLE (Security Fixed)
============================================================ */
export const updateUserRole = async (req, res) => {
  try {
    const { userId, newRole } = req.body;
    const targetUser = await User.findById(userId);

    if (!targetUser) return res.status(404).json({ success: false, message: "User not found" });

    // 🔥 SECURITY BUG FIX: Hierarchy Logic
    // Req.user.role logged-in banda hai, targetUser.role wo hai jiska role badalna hai
    
    if (req.user.role === 'subadmin') {
      // 1. Subadmin Admin ka role change nahi kar sakta
      if (targetUser.role === 'admin') {
        return res.status(403).json({ 
          success: false, 
          message: "Security Alert: Subadmin cannot modify Admin roles!" 
        });
      }
      // 2. Subadmin kisi ko Admin nahi bana sakta
      if (newRole === 'admin') {
        return res.status(403).json({ 
          success: false, 
          message: "Permission Denied: Subadmin cannot assign Admin role" 
        });
      }
    }

    targetUser.role = newRole;
    await targetUser.save();

    res.status(200).json({ success: true, message: `Role updated to ${newRole}` });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ============================================================
    5. ADMIN: GET ALL USERS (Admin Panel View)
============================================================ */
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ============================================================
    6. ADMIN: DELETE USER (Security Fixed)
============================================================ */
export const deleteUser = async (req, res) => {
    try {
      const targetUser = await User.findById(req.params.id);
      if (!targetUser) return res.status(404).json({ success: false, message: "User not found" });
  
      // 🔥 SECURITY BUG FIX: Subadmin cannot delete Admin
      if (req.user.role === 'subadmin' && targetUser.role === 'admin') {
        return res.status(403).json({ 
          success: false, 
          message: "Permission Denied: Subadmin cannot delete an Admin" 
        });
      }
  
      await User.findByIdAndDelete(req.params.id);
      res.status(200).json({ success: true, message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ success: false, message: "Server error" });
    }
  };