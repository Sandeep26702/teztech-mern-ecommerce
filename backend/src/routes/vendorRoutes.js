import express from "express";
import { protect, authorize } from "../middleware/auth.Middleware.js";
import {
  getVendors,
  createVendor,
  updateVendorRate,
  deleteVendor,
} from "../controllers/vendorController.js";

const router = express.Router();

// Get all vendors (read-only for purchase/admin/subadmin)
router.get(
  "/",
  protect,
  authorize("admin", "subadmin", "purchase"),
  getVendors
);

// Create vendor
router.post(
  "/",
  protect,
  authorize("admin", "subadmin", "purchase"),
  createVendor
);

// Update rate card
router.put(
  "/:id/rate",
  protect,
  authorize("admin", "subadmin", "purchase"),
  updateVendorRate
);

// Delete vendor
router.delete(
  "/:id",
  protect,
  authorize("admin", "subadmin", "purchase"),
  deleteVendor
);

export default router;
