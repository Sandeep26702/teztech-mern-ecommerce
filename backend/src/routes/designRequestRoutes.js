import express from "express";
import { protect, authorize } from "../middleware/auth.Middleware.js";
import upload from "../utils/upload.js";
import {
  createDesignRequest,
  getAllDesignRequests,
  uploadOptimizedSvg,
  updateDesignStatus,
  addComment,
} from "../controllers/designRequestController.js";

const router = express.Router();

// Route for sales agent to create design request (optionally uploading reference file)
router.post(
  "/",
  protect,
  authorize("admin", "subadmin", "sales team"),
  upload.single("referenceFile"),
  createDesignRequest
);

// Get all design requests (available to admins, sales agent, and designers)
router.get(
  "/",
  protect,
  authorize("admin", "subadmin", "sales team", "designer"),
  getAllDesignRequests
);

// Route for designer to upload optimized SVG file
router.put(
  "/:id/upload",
  protect,
  authorize("admin", "subadmin", "designer"),
  upload.single("optimizedSvg"),
  uploadOptimizedSvg
);

// Route for sales agent to approve/reject status
router.put(
  "/:id/status",
  protect,
  authorize("admin", "subadmin", "sales team"),
  updateDesignStatus
);

// Add comment to design chat log
router.post(
  "/:id/comments",
  protect,
  authorize("admin", "subadmin", "sales team", "designer"),
  addComment
);

export default router;
