import express from "express";
const router = express.Router();

import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";

// ✅ NAMED EXPORT → NAMED IMPORT (MATCHING)
import { protect } from "../middleware/auth.Middleware.js";

import upload from "../utils/upload.js";

/* ================= ROUTES ================= */

// CREATE PRODUCT (Admin / Auth Required)
router.post(
  "/",
  protect,
  upload.array("images", 5),
  createProduct
);

// GET ALL PRODUCTS (Public, Search + Pagination)
router.get("/", getAllProducts);

// GET SINGLE PRODUCT
router.get("/:id", getProductById);

// UPDATE PRODUCT (Admin / Auth Required)
router.put("/:id", protect, updateProduct);

// DELETE PRODUCT (Admin / Auth Required)
router.delete("/:id", protect, deleteProduct);

export default router;
