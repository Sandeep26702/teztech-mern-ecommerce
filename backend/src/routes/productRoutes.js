import express from "express";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";
import { protect, authorize } from "../middleware/auth.Middleware.js";
import { upload } from "../config/cloudinary.js"; // ✅ Image upload middleware import kiya

const router = express.Router();

// 1. GET ALL & CREATE
router
  .route("/")
  .get(getProducts) // Public: Sab dekh sakte hain
  .post(protect, authorize("admin", "subadmin"), upload.single("image"), createProduct); 
  // ^ ✅ upload.single("image") zaroori hai image file handle karne ke liye

// 2. GET SINGLE, UPDATE & DELETE
router
  .route("/:id")
  .get(getProductById) // Public
  .put(protect, authorize("admin", "subadmin"), upload.single("image"), updateProduct) 
  // ^ ✅ Update karte waqt bhi nayi image upload karne ki facility di hai
  .delete(protect, authorize("admin", "subadmin"), deleteProduct);

export default router;
