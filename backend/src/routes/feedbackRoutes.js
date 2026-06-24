import express from "express";
import { protect, authorize } from "../middleware/auth.Middleware.js";
import {
  getFeedbacks,
  createFeedback,
  resolveFeedback,
  getCallQueue,
  getFeedbackMetrics,
} from "../controllers/feedbackController.js";

const router = express.Router();

router.get(
  "/",
  protect,
  authorize("admin", "subadmin", "feedback tracking", "sales team"),
  getFeedbacks
);

router.get(
  "/metrics",
  protect,
  authorize("admin", "subadmin", "feedback tracking", "sales team"),
  getFeedbackMetrics
);

router.get(
  "/call-queue",
  protect,
  authorize("admin", "subadmin", "feedback tracking", "sales team"),
  getCallQueue
);

router.post(
  "/",
  protect,
  authorize("admin", "subadmin", "feedback tracking"),
  createFeedback
);

router.put(
  "/:id/resolve",
  protect,
  authorize("admin", "subadmin", "sales team"),
  resolveFeedback
);

export default router;
