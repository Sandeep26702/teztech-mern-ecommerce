import express from "express";
import { protect, authorize } from "../middleware/auth.Middleware.js";
import { getScrap, createScrap } from "../controllers/scrapController.js";

const router = express.Router();

// Get available scrap logs
router.get(
  "/",
  protect,
  authorize("admin", "subadmin", "purchase", "sales team"),
  getScrap
);

// Log leftover scrap
router.post(
  "/",
  protect,
  authorize("admin", "subadmin", "manufacturing"),
  createScrap
);

export default router;
