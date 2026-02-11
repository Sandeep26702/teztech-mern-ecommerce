import express from 'express';
import {
  getProfile,
  updateProfile,
  uploadProfilePhoto,
  changePassword,
  testGetProfile  // Add test function
} from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.Middleware.js';
import upload from '../utils/upload.js';

const router = express.Router();

//11/02/26 - Admin routes
/* ================= USER PROFILE ================= */

// 👤 Logged-in User
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);

/* ================= ADMIN ROUTES ================= */

// 🛠 Admin only
router.get("/admin/users", protect, adminOnly, getAllUsers);
router.delete("/admin/user/:id", protect, adminOnly, deleteUser);
//11/02/26 - Admin routes end


// ✅ PUBLIC TEST ROUTE (no auth)
router.get('/test-profile', testGetProfile);

// ✅ PROTECTED ROUTES (with middleware per route)
router.get('/profile', protect, getProfile);
router.put('/profile', protect, upload.single('profileImage'), updateProfile);
router.post('/profile/photo', protect, upload.single('profileImage'), uploadProfilePhoto);
router.put('/change-password', protect, changePassword);

export default router;