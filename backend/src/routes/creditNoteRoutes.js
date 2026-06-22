import express from "express";
import { protect, authorize } from "../middleware/auth.Middleware.js";
import { getCreditNotes } from "../controllers/creditNoteController.js";

const router = express.Router();

router.get(
  "/",
  protect,
  authorize("admin", "subadmin", "purchase"),
  getCreditNotes
);

export default router;
