import express from "express";
import multer from "multer";
import {
  getProducts,
  getProductCategories,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  importProductsCsv,
  exportProductsCsv,
  getProductImportHistory,
  getProductImportOverview,
  rollbackProductImport,
  deleteProductImportRecord,
  getProductsAdmin,
  updateProductStatus,
} from "../controllers/productController.js";
import { protect, authorize } from "../middleware/auth.Middleware.js";
import { upload } from "../config/cloudinary.js";

const router = express.Router();
const csvUpload = multer({ storage: multer.memoryStorage() });

router.get("/export/csv", protect, authorize("admin", "subadmin"), exportProductsCsv);
router.get("/admin", protect, authorize("admin", "subadmin"), getProductsAdmin);
router.post(
  "/import/csv",
  protect,
  authorize("admin", "subadmin"),
  csvUpload.single("file"),
  importProductsCsv
);
router.get("/import/csv/history", protect, authorize("admin", "subadmin"), getProductImportHistory);
router.get("/import/csv/overview", protect, authorize("admin", "subadmin"), getProductImportOverview);
router.delete("/import/csv/history/:jobId", protect, authorize("admin", "subadmin"), rollbackProductImport);
router.delete("/import/csv/history/:jobId/record", protect, authorize("admin", "subadmin"), deleteProductImportRecord);

router
  .route("/")
  .get(getProducts)
  .post(protect, authorize("admin", "subadmin"), upload.single("image"), createProduct);

router.get("/meta/categories", getProductCategories);

router
  .route("/:id")
  .get(getProductById)
  .put(protect, authorize("admin", "subadmin"), upload.single("image"), updateProduct)
  .delete(protect, authorize("admin", "subadmin"), deleteProduct);

router.patch("/:id/status", protect, authorize("admin", "subadmin"), updateProductStatus);

export default router;
