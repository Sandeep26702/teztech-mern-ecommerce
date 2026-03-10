import User from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import sendEmail from "../utils/sendEmail.js";

const disposableEmailDomains = new Set([
  "mailinator.com",
  "guerrillamail.com",
  "10minutemail.com",
  "tempmail.com",
  "yopmail.com",
  "trashmail.com",
  "fakeinbox.com",
  "sharklasers.com",
]);

const isValidName = (name) => /^[a-zA-Z][a-zA-Z\s.'-]{1,}$/.test(String(name || "").trim());
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email || "").trim());
const isValidPhone = (phone) => /^\d{10}$/.test(String(phone || "").trim());
const isDisposableEmail = (email) => {
  const domain = String(email || "").split("@")[1]?.toLowerCase();
  return domain ? disposableEmailDomains.has(domain) : false;
};

/* ================= HELPER: Generate Token ================= */
const sendTokenResponse = (user, statusCode, res) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "30d",
  });

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      userId: user.userId,
      phone: user.phone,
      isActive: user.isActive,
      profileImage: user.profileImage,
    },
  });
};

/* ================= 1. REGISTER USER ================= */
export const register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    const normalizedName = String(name || "").trim();
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedPhone = String(phone || "").trim();

    if (!isValidName(normalizedName) || normalizedName.length < 3) {
      return res.status(400).json({ success: false, message: "Please enter a valid full name" });
    }

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ success: false, message: "Please enter a valid email address" });
    }

    if (isDisposableEmail(normalizedEmail)) {
      return res.status(400).json({ success: false, message: "Temporary/disposable emails are not allowed" });
    }

    if (!isValidPhone(normalizedPhone)) {
      return res.status(400).json({ success: false, message: "Please enter valid 10-digit mobile number" });
    }

    // Unique check
    const userExists = await User.findOne({
      $or: [{ email: normalizedEmail }, { phone: normalizedPhone }, { userId: normalizedPhone }],
    });
    if (userExists) {
      return res.status(400).json({ success: false, message: "Email or mobile already exists" });
    }

    // User Create (Model middleware ab password hash kar dega safely)
    const user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      password,
      phone: normalizedPhone,
      userId: normalizedPhone,
    });

    sendTokenResponse(user, 201, res);
  } catch (error) {
    // Validation errors handle karne ke liye
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= 2. LOGIN USER ================= */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({ success: false, message: "Please provide email and password" });
    }

    // Password explicitly select karna padta hai kyunki model me select: false hai
    const user = await User.findOne({ email: normalizedEmail }).select("+password");

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: user.blockedReason || "Your account has been blocked by admin",
      });
    }

    // Password Match check
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= 3. GET CURRENT USER (ME) ================= */
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

/* ================= 4. LOGOUT ================= */
export const logout = async (req, res) => {
  res.status(200).json({ success: true, message: "Logged out successfully" });
};

/* ================= 5. FORGOT PASSWORD ================= */
export const forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Reset Token Generate
    const resetToken = crypto.randomBytes(20).toString("hex");

    // Hash Token to save in DB
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Expire in 10 mins
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

    const message = `You requested a password reset. Click the link below to reset your password:\n\n${resetUrl}`;

    try {
      await sendEmail({
        email: user.email,
        subject: "Password Reset Token",
        message,
      });

      res.status(200).json({ success: true, message: "Email Sent Successfully" });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({ success: false, message: "Email sending failed" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= 6. RESET PASSWORD ================= */
export const resetPassword = async (req, res) => {
  try {
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or Expired Token" });
    }

    // New password set (Model middleware will hash it)
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();
    sendTokenResponse(user, 200, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= 7. CREATE SUBADMIN ================= */
export const createSubAdmin = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    const normalizedPhone = String(phone || "").trim();
    const userExists = await User.findOne({
      $or: [{ email }, ...(normalizedPhone ? [{ phone: normalizedPhone }, { userId: normalizedPhone }] : [])],
    });
    if (userExists) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }
    const user = await User.create({
      name,
      email,
      password,
      phone: normalizedPhone || undefined,
      userId: normalizedPhone || undefined,
      role: "subadmin",
      isEmailVerified: true,
    });
    res.status(201).json({
      success: true,
      message: "Subadmin created successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
