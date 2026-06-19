import express from "express";
import { protect, authorize } from "../middleware/auth.Middleware.js";
import {
  createLead,
  getAllLeads,
  updateLead,
  addLeadNote,
  bulkCreateLeads,
} from "../controllers/leadController.js";

const router = express.Router();

// Public/Marketing endpoint to capture leads
router.post("/", createLead);

// Bulk import endpoint
router.post(
  "/bulk",
  protect,
  authorize("admin", "subadmin", "sales team"),
  bulkCreateLeads
);

// Staff-only endpoints
router.get(
  "/",
  protect,
  authorize("admin", "subadmin", "sales team", "marketing"),
  getAllLeads
);

router.put(
  "/:id",
  protect,
  authorize("admin", "subadmin", "sales team"),
  updateLead
);

router.post(
  "/:id/notes",
  protect,
  authorize("admin", "subadmin", "sales team"),
  addLeadNote
);

export default router;
