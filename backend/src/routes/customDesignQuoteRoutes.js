import express from "express";
import {
  createCustomDesignQuote,
  getMyCustomDesignQuotes,
  getAllCustomDesignQuotes,
  respondToCustomDesignQuote,
  updateCustomDesignQuoteStatus,
  assignCustomDesignQuote,
  addCustomDesignQuoteCrmNote,
  addClientCustomQuoteComment,
} from "../controllers/customDesignQuoteController.js";
import { protect, admin } from "../middleware/auth.Middleware.js";
import upload from "../utils/upload.js";

const router = express.Router();

// User requests a custom design quotation (with multiple files upload)
router.post("/create", protect, upload.array("files", 10), createCustomDesignQuote);

// Get my custom design quote requests
router.get("/my-quotes", protect, getMyCustomDesignQuotes);

// Add client comment to their own custom design quote
router.post("/comment/client/:id", protect, addClientCustomQuoteComment);

// Admin fetches all custom quotes
router.get("/all", protect, admin, getAllCustomDesignQuotes);

// Admin responds to custom quote
router.put("/respond/:id", protect, admin, respondToCustomDesignQuote);

// CRM routes
router.put("/assign/:id", protect, admin, assignCustomDesignQuote);
router.post("/comment/:id", protect, admin, addCustomDesignQuoteCrmNote);

// User accepts or rejects the quote
router.patch("/status/:id", protect, updateCustomDesignQuoteStatus);

export default router;
