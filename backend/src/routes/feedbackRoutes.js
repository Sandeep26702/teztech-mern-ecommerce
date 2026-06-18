import express from "express";
import { protect, authorize } from "../middleware/auth.Middleware.js";
import {
  getFeedbacks,
  createFeedback,
  resolveFeedback,
} from "../controllers/feedbackController.js";

const router = express.Router();

router.get(
  "/",
  protect,
  authorize("admin", "subadmin", "feedback tracking", "sales team"),
  getFeedbacks
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
