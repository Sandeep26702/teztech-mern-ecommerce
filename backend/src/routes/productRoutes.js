import express from "express";
import multer from "multer";

import {
  getProducts,
  getProductsAdmin,
  getProductById,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductCategories,
  getImportOverview,
  getImportHistory,
  rollbackImport,
  deleteImportHistory,
  importProductsCsv,
  exportProductsCsv,
  toggleVisibility
} from "../controllers/productController.js";

import { protect, authorize } from "../middleware/auth.Middleware.js";
import { validateProduct } from "../middleware/productValidator.js";
import { upload } from "../config/cloudinary.js";
import { trafficLogger } from "../middleware/trafficLogger.js";

const router = express.Router();

// Apply traffic logger to all product routes
router.use(trafficLogger);

// ===============================
// 🔥 MULTER (CSV)
// ===============================
const csvUpload = multer({
  storage: multer.memoryStorage(),
});

// ===============================
// 🌐 PUBLIC ROUTES
// ===============================
router.get("/", getProducts);
router.get("/slug/:slug", getProductBySlug);
router.get("/meta/categories", getProductCategories);

// ===============================
// 🔐 ADMIN ROUTES (IMPORTANT: ABOVE :id)
// ===============================
router.get("/admin", getProductsAdmin);

router.get("/import/csv/overview", protect, authorize("admin"), getImportOverview);
router.get("/import/csv/history", protect, authorize("admin"), getImportHistory);

router.delete("/import/csv/history/:id", protect, authorize("admin"), rollbackImport);
router.delete("/import/csv/history/:id/record", protect, authorize("admin"), deleteImportHistory);

// ===============================
// 📦 PRODUCT CRUD
// ===============================
router.post(
  "/admin",
  protect,
  authorize("admin", "subadmin"),
  upload.array("images", 5),
  validateProduct,
  createProduct
);

router.put(
  "/admin/:id",
  protect,
  authorize("admin", "subadmin"),
  upload.array("images", 5),
  validateProduct,
  updateProduct
);

router.delete(
  "/admin/:id",
  protect,
  authorize("admin", "subadmin"),
  deleteProduct
);

router.patch(
  "/admin/:id/visibility",
  protect,
  authorize("admin", "subadmin"),
  toggleVisibility
);

// ===============================
// 🔥 CSV ROUTES
// ===============================
router.post(
  "/import/csv",
  protect,
  authorize("admin", "subadmin"),
  csvUpload.single("file"),
  importProductsCsv
);

// Alias for import/csv as requested
router.post(
  "/bulk-upload",
  protect,
  authorize("admin", "subadmin"),
  csvUpload.single("file"),
  importProductsCsv
);

router.get(
  "/export/csv",
  protect,
  authorize("admin", "subadmin"),
  exportProductsCsv
);

// ===============================
// ⚠️ ALWAYS LAST (VERY IMPORTANT)
// ===============================
router.get("/:id", getProductById);

export default router;