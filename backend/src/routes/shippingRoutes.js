import express from "express";
import {
  getProviders,
  getActiveProviders,
  createProvider,
  updateProvider,
  deleteProvider,
} from "../controllers/shippingController.js";
import { protect, admin } from "../middleware/auth.Middleware.js";

const router = express.Router();

// Public / User routes
router.get("/active", getActiveProviders);

// Admin routes
router.get("/", protect, admin, getProviders);
router.post("/", protect, admin, createProvider);
router.put("/:id", protect, admin, updateProvider);
router.delete("/:id", protect, admin, deleteProvider);

export default router;
