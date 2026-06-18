import express from "express";
import { protect, authorize } from "../middleware/auth.Middleware.js";
import {
  getJobCards,
  startLaserProduction,
  completeLaserProduction,
} from "../controllers/jobCardController.js";

const router = express.Router();

// Retrieve Job Cards
router.get(
  "/",
  protect,
  authorize("admin", "subadmin", "manufacturing"),
  getJobCards
);

// Start Laser
router.put(
  "/:id/start",
  protect,
  authorize("admin", "subadmin", "manufacturing"),
  startLaserProduction
);

// Complete Laser
router.put(
  "/:id/complete",
  protect,
  authorize("admin", "subadmin", "manufacturing"),
  completeLaserProduction
);

export default router;
