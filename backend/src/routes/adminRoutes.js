import express from "express";
import { protect, authorize } from "../middleware/auth.Middleware.js"; 
import { adminOnly } from "../middleware/roleMiddleware.js";
import { 
  getDashboardStats, 
  getAllUsers, 
  deleteUser, 
  updateUserRole,
  getUserById,
  updateUserProfileByAdmin,
  toggleUserBlockStatus,
} from "../controllers/adminController.js"; 
import { getQuoteById, respondToQuote } from "../controllers/quoteController.js";

const router = express.Router();

/* ================= MIDDLEWARE ================= */
// Sabhi routes ke liye Login zaroori hai
router.use(protect); 

// Sabhi routes ke liye Admin ya Sub-admin hona zaroori hai
router.use(authorize("admin", "subadmin")); 

/* ================= ROUTES ================= */

// Dashboard overview stats ke liye
router.get("/dashboard", getDashboardStats);

// 🛠️ FIX: Dashboard orders fetch karne ke liye (Abhi ke liye dashboard stats hi use kar rahe hain)
// Note: Future mein aap yahan specific 'getAllOrders' controller add kar sakte hain
router.get("/orders", getDashboardStats); 

// Users management routes
router.get("/users", getAllUsers);
router.get("/users/:id", getUserById);
router.put("/users/:id/profile", updateUserProfileByAdmin);
router.patch("/users/:id/block", adminOnly, toggleUserBlockStatus);

router.route("/users/:id")
  .delete(adminOnly, deleteUser)
  .put(adminOnly, updateUserRole);

// Quote management routes for Admin Panel
router.get("/quote/:id", getQuoteById);
router.put("/quote/:id", respondToQuote);
router.patch("/quote/:id", respondToQuote);

export default router;
