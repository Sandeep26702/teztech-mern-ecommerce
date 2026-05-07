import express from "express";
import multer from "multer";
import { getHomeLayout, updateHomeLayout } from "../controllers/layoutController.js";
import { protect, authorize } from "../middleware/auth.Middleware.js";

const router = express.Router();

// Multer memory storage configuration for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 50 }, // 50MB limit to accommodate video
});

// Configure expected file fields
const layoutUploads = upload.fields([
  { name: "heroVideo", maxCount: 1 },
  { name: "featureCards_0_image", maxCount: 1 },
  { name: "featureCards_1_image", maxCount: 1 },
  { name: "featureCards_2_image", maxCount: 1 },
]);

/**
 * @route   GET /api/layout/home
 * @desc    Fetch home layout data
 * @access  Public
 */
router.get("/home", getHomeLayout);

/**
 * @route   PUT /api/layout/home
 * @desc    Update home layout data
 * @access  Private (Admin/Subadmin only)
 */
router.put("/home", protect, authorize("admin", "subadmin"), layoutUploads, updateHomeLayout);

export default router;
