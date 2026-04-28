import express from "express";
import {
  getPublicCategories,
  getAdminCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  reassignCategoryProducts,
  cleanupUnusedCategories,
  getCategoryTree,
} from "../controllers/categoryController.js";
import { protect, authorize } from "../middleware/auth.Middleware.js";
import { upload } from "../config/cloudinary.js";

const router = express.Router();

router.get("/", getPublicCategories);
router.get("/tree/:slug", getCategoryTree);
router.get("/admin", protect, authorize("admin", "subadmin"), getAdminCategories);
router.post("/admin/cleanup-unused", protect, authorize("admin", "subadmin"), cleanupUnusedCategories);
router.post("/", protect, authorize("admin", "subadmin"), upload.single("image"), createCategory);
router.put("/:id", protect, authorize("admin", "subadmin"), upload.single("image"), updateCategory);
router.delete("/:id", protect, authorize("admin", "subadmin"), deleteCategory);
router.post("/reassign-products", protect, authorize("admin", "subadmin"), reassignCategoryProducts);

export default router;
