import User from "../models/User.js";
import Log from "../models/Log.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import sendEmail from "../utils/sendEmail.js";
import { getCache, setCache, deleteCache } from "../utils/cache.js";

const isValidName = (name) => /^[a-zA-Z][a-zA-Z\s.'-]{1,}$/.test(String(name || "").trim());
const isValidPhone = (phone) => /^\d{10}$/.test(String(phone || "").trim());
const isValidEmail = (email) => /^\S+@\S+\.\S+$/.test(String(email || "").trim());

/* ================= HELPER: Generate Token ================= */
const sendTokenResponse = (user, statusCode, res) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "30d",
  });

  // 🚀 NAYA UPDATE: Token ko Cookie mein save karwana live server ke liye
  const options = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 Days
    httpOnly: true,
    secure: true,        // HTTPS (Vercel) ke liye zaroori
    sameSite: 'none',    // Cross-domain (Vercel se Render) ke liye zaroori
  };

  res.status(statusCode).cookie("token", token, options).json({
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
      return res.status(400).json({ 
        success: false, 
        message: "Please enter a valid email address." 
      });
    }

    if (normalizedPhone && !isValidPhone(normalizedPhone)) {
      return res.status(400).json({ success: false, message: "Please enter valid 10-digit mobile number" });
    }

    const userExists = await User.findOne({
      $or: [
        { email: normalizedEmail },
        ...(normalizedPhone ? [{ phone: normalizedPhone }, { userId: normalizedPhone }] : [])
      ],
    });

    if (userExists) {
      if (userExists.isVerified || userExists.isEmailVerified) {
        return res.status(400).json({ success: false, message: "Email or mobile already exists" });
      } else {
        // Automatically clean up the unverified ghost account from old system so the user can re-register
        await User.findByIdAndDelete(userExists._id);
      }
    }

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Hash the password so we don't store a plain password in the cache
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Store unverified registration details in cache (TTL 600 seconds)
    const cacheKey = `temp-user:${normalizedEmail}`;
    const tempUserData = {
      name: normalizedName,
      email: normalizedEmail,
      password: hashedPassword,
      phone: normalizedPhone || undefined,
      otp,
      otpExpire,
    };
    setCache(cacheKey, tempUserData, 600);

    res.status(201).json({
      success: true,
      message: "Registration successful. Please verify the OTP sent to your email.",
      email: normalizedEmail,
    });

    // Fire-and-forget email for speed
    sendEmail({
      email: normalizedEmail,
      subject: "TezTech Account Verification OTP",
      message: `Hello ${normalizedName},\n\nYour 6-digit OTP for account verification is: ${otp}\n\nThis OTP is valid for 10 minutes.\n\nThank you,\nTezTech Support`,
    }).catch(emailError => {
      console.error("OTP email sending failed in background:", emailError.message);
    });
  } catch (error) {
    console.error("🔥 Error in register:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= 2. VERIFY OTP ================= */
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const cleanOtp = String(otp || "").trim();

    if (!normalizedEmail || !cleanOtp) {
      return res.status(400).json({ success: false, message: "Please provide email and OTP" });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser && (existingUser.isVerified || existingUser.isEmailVerified)) {
      return res.status(400).json({ success: false, message: "User is already verified. Please login." });
    }

    const cacheKey = `temp-user:${normalizedEmail}`;
    let tempUserData = getCache(cacheKey);
    let user;

    if (!tempUserData) {
      // Fallback for old system: check DB for unverified user
      if (existingUser && !existingUser.isVerified && !existingUser.isEmailVerified) {
        user = existingUser;

        if (user.otp !== cleanOtp || user.otpExpire < new Date()) {
          await Log.create({
            ipAddress: (req.headers["x-forwarded-for"] || req.connection.remoteAddress || req.ip || "").split(",")[0].trim() || "Unknown",
            email: normalizedEmail,
            action: "Failed OTP Attempt",
            riskLevel: "Warning",
            method: req.method,
            endpoint: req.originalUrl
          }).catch(() => {});
          return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
        }

        user.isVerified = true;
        user.isEmailVerified = true;
        user.otp = undefined;
        user.otpExpire = undefined;
        await user.save();
      } else {
        return res.status(400).json({ success: false, message: "OTP expired or registration session not found" });
      }
    } else {
      // Normal cache-based flow
      if (tempUserData.otp !== cleanOtp || new Date(tempUserData.otpExpire) < new Date()) {
        await Log.create({
          ipAddress: (req.headers["x-forwarded-for"] || req.connection.remoteAddress || req.ip || "").split(",")[0].trim() || "Unknown",
          email: normalizedEmail,
          action: "Failed OTP Attempt",
          riskLevel: "Warning",
          method: req.method,
          endpoint: req.originalUrl
        }).catch(() => {});
        return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
      }

      // Double check email/phone duplication in DB right before inserting
      const duplicateCheck = await User.findOne({
        $or: [
          { email: tempUserData.email },
          ...(tempUserData.phone ? [{ phone: tempUserData.phone }, { userId: tempUserData.phone }] : [])
        ],
      });
      if (duplicateCheck) {
        return res.status(400).json({ success: false, message: "Email or mobile already exists" });
      }

      // Create the user in MongoDB Atlas
      user = await User.create({
        name: tempUserData.name,
        email: tempUserData.email,
        password: tempUserData.password, // Pre-save hook will skip double hashing since it's already a bcrypt hash
        phone: tempUserData.phone,
        userId: tempUserData.phone,
        isVerified: true,
        isEmailVerified: true
      });

      // Clean up the cache
      deleteCache(cacheKey);
    }

    // Automatically log user in right after verification
    sendTokenResponse(user, 200, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= 3. RESEND OTP ================= */
export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (!normalizedEmail) {
      return res.status(400).json({ success: false, message: "Please provide email" });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser && (existingUser.isVerified || existingUser.isEmailVerified)) {
      return res.status(400).json({ success: false, message: "User is already verified. Please login." });
    }

    const cacheKey = `temp-user:${normalizedEmail}`;
    let tempUserData = getCache(cacheKey);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    let recipientName = "User";

    if (!tempUserData) {
      // Fallback for old system: update OTP in DB if user is unverified in DB
      if (existingUser && !existingUser.isVerified && !existingUser.isEmailVerified) {
        existingUser.otp = otp;
        existingUser.otpExpire = otpExpire;
        await existingUser.save();
        recipientName = existingUser.name;
      } else {
        return res.status(400).json({ success: false, message: "Registration session expired. Please register again." });
      }
    } else {
      // Update OTP in cache
      tempUserData.otp = otp;
      tempUserData.otpExpire = otpExpire;
      setCache(cacheKey, tempUserData, 600);
      recipientName = tempUserData.name;
    }

    res.status(200).json({
      success: true,
      message: "New OTP sent to your email.",
    });

    // Fire-and-forget email for speed
    sendEmail({
      email: normalizedEmail,
      subject: "TezTech Account Verification OTP (Resent)",
      message: `Hello ${recipientName},\n\nYour new 6-digit OTP for account verification is: ${otp}\n\nThis OTP is valid for 10 minutes.\n\nThank you,\nTezTech Support`,
    }).catch(emailError => {
      console.error("OTP email sending failed in background:", emailError.message);
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= 4. LOGIN USER ================= */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({ success: false, message: "Please provide email and password" });
    }

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ 
        success: false, 
        message: "Please enter a valid email address." 
      });
    }

    const user = await User.findOne({ email: normalizedEmail }).select("+password");

    if (!user) {
      await Log.create({
        ipAddress: (req.headers["x-forwarded-for"] || req.connection.remoteAddress || req.ip || "").split(",")[0].trim() || "Unknown",
        email: normalizedEmail,
        action: "Failed Login Attempt (User Not Found)",
        riskLevel: "Warning",
        method: req.method,
        endpoint: req.originalUrl
      }).catch(() => {});
      return res.status(401).json({ success: false, message: "Account does not exist" });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: user.blockedReason || "Your account has been blocked by admin",
      });
    }

    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      await Log.create({
        ipAddress: (req.headers["x-forwarded-for"] || req.connection.remoteAddress || req.ip || "").split(",")[0].trim() || "Unknown",
        email: normalizedEmail,
        user: user._id,
        action: "Failed Login Attempt (Wrong Password)",
        riskLevel: "Blocked",
        method: req.method,
        endpoint: req.originalUrl
      }).catch(() => {});
      return res.status(401).json({ success: false, message: "Incorrect password" });
    }

    // Check if user is verified (support isEmailVerified for backward compatibility)
    const isVerifiedUser = user.isVerified || user.isEmailVerified;
    if (!isVerifiedUser) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email first. An OTP has been sent during registration.",
        isVerified: false,
        email: user.email
      });
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
  // 🚀 NAYA UPDATE: Logout ke waqt Cookie ko clear karna
  res.cookie("token", "none", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    secure: true,
    sameSite: 'none'
  });
  
  res.status(200).json({ success: true, message: "Logged out successfully" });
};

/* ================= 5. FORGOT PASSWORD ================= */
export const forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const resetToken = crypto.randomBytes(20).toString("hex");

    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

    const message = `You requested a password reset. Click the link below to reset your password:\n\n${resetUrl}`;

    res.status(200).json({ success: true, message: "Email Sent Successfully" });

    // Fire-and-forget email for speed
    sendEmail({
      email: user.email,
      subject: "Password Reset Token",
      message,
    }).catch(async (error) => {
      console.error("Forgot password email failed in background:", error.message);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
    });
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
      isVerified: true,
    });
    res.status(201).json({
      success: true,
      message: "Subadmin created successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};