import express from "express";
import { protect, authorize } from "../middleware/auth.Middleware.js"; 
import { adminOnly } from "../middleware/roleMiddleware.js";

// Admin Controller Imports
import { 
  getDashboardStats, 
  getAllUsers, 
  deleteUser, 
  updateUserRole,
  getUserById,
  updateUserProfileByAdmin,
  toggleUserBlockStatus,
} from "../controllers/adminController.js"; 

// Quote Controller Imports
import { getQuoteById, respondToQuote } from "../controllers/quoteController.js";

// 🔥 NAYA FIX: getOrderDetail ko yahan add kiya hai
import { 
  getAllOrdersForAdmin, 
  updateOrderStatus, 
  getOrderDetail 
} from "../controllers/orderController.js";

const router = express.Router();

/* ================= MIDDLEWARE ================= */
// Sabhi routes ke liye Login zaroori hai
router.use(protect); 

// Sabhi routes ke liye Admin ya Sub-admin hona zaroori hai
router.use(authorize("admin", "subadmin")); 

/* ================= ROUTES ================= */

// 📊 Dashboard Stats 
router.get("/dashboard-stats", getDashboardStats);

// 📦 Order Management Routes 
router.get("/orders", getAllOrdersForAdmin); 

// 🔥 NAYA FIX: Single order detail fetch karne ka route (404 Error yahan se theek hoga)
router.get("/orders/:id", getOrderDetail); 

router.put("/orders/:orderId/status", updateOrderStatus); 

// 👥 Users Management Routes
router.get("/users", getAllUsers);
router.get("/users/:id", getUserById);
router.put("/users/:id/profile", updateUserProfileByAdmin);
router.patch("/users/:id/block", adminOnly, toggleUserBlockStatus);

router.route("/users/:id")
  .delete(adminOnly, deleteUser)
  .put(adminOnly, updateUserRole);

// 📝 Quote Management Routes
router.get("/quote/:id", getQuoteById);
router.put("/quote/:id", respondToQuote);
router.patch("/quote/:id", respondToQuote);

export default router;