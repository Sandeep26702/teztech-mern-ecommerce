import express from "express";
import { protect, authorize } from "../middleware/auth.Middleware.js"; // ✅ FIX: 'authorize' import kiya
import { 
  getDashboardStats, 
  getAllUsers, 
  deleteUser, 
  updateUserRole 
} from "../controllers/adminController.js"; 

const router = express.Router();

// Sabhi routes ke liye Login zaroori hai
router.use(protect); 

// Sabhi routes ke liye Admin role zaroori hai
router.use(authorize("admin", "subadmin")); // ✅ FIX: 'adminOnly' hata kar 'authorize' lagaya

// Routes
router.get("/dashboard", getDashboardStats);
router.get("/users", getAllUsers);
router.route("/users/:id")
  .delete(deleteUser)
  .put(updateUserRole);

export default router;