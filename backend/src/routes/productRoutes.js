import express from "express";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";
import { protect, authorize } from "../middleware/auth.Middleware.js"; // ✅ FIX: 'authorize' import kiya

const router = express.Router();

// 1. GET ALL & CREATE
router
  .route("/")
  .get(getProducts) // Public: Koi bhi product dekh sakta hai
  .post(protect, authorize("admin"), createProduct); // ✅ FIX: Sirf Admin product bana sakta hai

// 2. GET SINGLE, UPDATE & DELETE
router
  .route("/:id")
  .get(getProductById) // Public
  .put(protect, authorize("admin"), updateProduct) // ✅ FIX: Sirf Admin update kar sakta hai
  .delete(protect, authorize("admin"), deleteProduct); // ✅ FIX: Sirf Admin delete kar sakta hai

export default router;