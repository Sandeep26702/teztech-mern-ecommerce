import express from "express";
import { protect, authorize } from "../middleware/auth.Middleware.js";
import {
  getPOs,
  createPO,
  updatePOStatus,
  inwardLogQC,
} from "../controllers/purchaseOrderController.js";

const router = express.Router();

// Get all POs
router.get(
  "/",
  protect,
  authorize("admin", "subadmin", "purchase"),
  getPOs
);

// Create a PO
router.post(
  "/",
  protect,
  authorize("admin", "subadmin", "purchase"),
  createPO
);

// Update status (pipeline transition)
router.put(
  "/:id/status",
  protect,
  authorize("admin", "subadmin", "purchase"),
  updatePOStatus
);

// Log inward shipment (QC Check)
router.post(
  "/inward-qc",
  protect,
  authorize("admin", "subadmin", "purchase"),
  inwardLogQC
);

export default router;
