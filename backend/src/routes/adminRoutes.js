import express from "express";
import { protect, authorize } from "../middleware/auth.Middleware.js"; 
import { adminOnly } from "../middleware/roleMiddleware.js";
import { 
  getDashboardStats, 
  getAllUsers, 
  deleteUser, 
  updateUserRole 
} from "../controllers/adminController.js"; 

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

router.route("/users/:id")
  .delete(adminOnly, deleteUser)
  .put(adminOnly, updateUserRole);

export default router;
