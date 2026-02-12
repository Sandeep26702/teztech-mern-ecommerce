import express from "express";
const router = express.Router();

import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";

// ✅ NAMED IMPORT (IMPORTANT)
import { protect } from "../middleware/auth.Middleware.js";

import upload from "../utils/upload.js";

router.post(
  "/",
  protect,
  upload.array("images", 5),
  createProduct
);

router.get("/", getAllProducts);
router.get("/:id", getProductById);
router.put("/:id", protect, updateProduct);
router.delete("/:id", protect, deleteProduct);

export default router;
