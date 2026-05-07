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
import { uploadCategory } from "../config/cloudinary.js";

const router = express.Router();

const handleUpload = (req, res, next) => {
  const uploadSingle = uploadCategory.single("image");
  uploadSingle(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: "Maximum file size allowed is 1MB." });
      }
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};

router.get("/", getPublicCategories);
router.get("/tree/:slug", getCategoryTree);
router.get("/admin", protect, authorize("admin", "subadmin"), getAdminCategories);
router.post("/admin/cleanup-unused", protect, authorize("admin", "subadmin"), cleanupUnusedCategories);
router.post("/", protect, authorize("admin", "subadmin"), handleUpload, createCategory);
router.put("/:id", protect, authorize("admin", "subadmin"), handleUpload, updateCategory);
router.delete("/:id", protect, authorize("admin", "subadmin"), deleteCategory);
router.post("/reassign-products", protect, authorize("admin", "subadmin"), reassignCategoryProducts);

export default router;
