import express from "express";
import { protect, authorize } from "../middleware/auth.Middleware.js";
import {
  getMaterials,
  createMaterial,
  updateMaterial,
} from "../controllers/materialController.js";

const router = express.Router();

// Access to materials list (read-only for sales team too to check feasibility)
router.get(
  "/",
  protect,
  authorize("admin", "subadmin", "purchase", "sales team", "designer", "packing"),
  getMaterials
);

// Create material
router.post(
  "/",
  protect,
  authorize("admin", "subadmin", "purchase"),
  createMaterial
);

// Update stock/settings
router.put(
  "/:id",
  protect,
  authorize("admin", "subadmin", "purchase", "sales team", "packing"),
  updateMaterial
);

export default router;
