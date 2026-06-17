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
  getTrafficLogs,
  exportTrafficLogs
} from "../controllers/adminController.js"; 

// Quote Controller Imports
import { getQuoteById, respondToQuote } from "../controllers/quoteController.js";

// Order Controller Imports
import { 
  getAllOrdersForAdmin, 
  updateOrderStatus, 
  getOrderDetail 
} from "../controllers/orderController.js";

// CRM Client Notes Imports
import {
  getAllClientsWithNotes,
  getClientNotes,
  addClientNote
} from "../controllers/clientNoteController.js";

const router = express.Router();

/* ================= MIDDLEWARE ================= */
// Login is required for all routes
router.use(protect); 

// Role group definitions for authorization
const staffRoles = ["admin", "subadmin", "sales team", "designer", "manufacturing", "purchase", "packing", "dispatch", "feedback tracking", "accounting", "marketing"];
const orderRoles = ["admin", "subadmin", "sales team", "manufacturing", "purchase", "packing", "dispatch", "feedback tracking", "accounting", "marketing"];
const quoteAndCRMNotesRoles = ["admin", "subadmin", "sales team", "designer", "feedback tracking"];
const userManagementRoles = ["admin", "subadmin"];

// 📊 Dashboard Stats (accessible by all staff roles)
router.get("/dashboard-stats", authorize(...staffRoles), getDashboardStats);

/* ================= ROUTES ================= */

// 📦 Order Management Routes 
router.get("/orders", authorize(...orderRoles), getAllOrdersForAdmin); 

// 🔥 NEW FIX: Endpoint to fetch details of a single order (resolves 404 error)
router.get("/orders/:id", authorize(...orderRoles), getOrderDetail); 

router.put("/orders/:orderId/status", authorize(...orderRoles), updateOrderStatus); 

// 👥 Users Management Routes
router.get("/users", authorize(...quoteAndCRMNotesRoles), getAllUsers);
router.get("/users/:id", authorize(...userManagementRoles), getUserById);
router.put("/users/:id/profile", authorize(...userManagementRoles), updateUserProfileByAdmin);
router.patch("/users/:id/block", authorize(...userManagementRoles), adminOnly, toggleUserBlockStatus);

router.route("/users/:id")
  .delete(authorize(...userManagementRoles), adminOnly, deleteUser)
  .put(authorize(...userManagementRoles), adminOnly, updateUserRole);

// 📝 Quote Management Routes
router.get("/quote/:id", authorize(...quoteAndCRMNotesRoles), getQuoteById);
router.put("/quote/:id", authorize(...quoteAndCRMNotesRoles), respondToQuote);
router.patch("/quote/:id", authorize(...quoteAndCRMNotesRoles), respondToQuote);

// 🛡️ Traffic & Security Logs Routes
router.get("/logs/export", authorize("admin"), exportTrafficLogs); // This must come before /logs/:id if there was one
router.get("/logs", authorize("admin"), getTrafficLogs);

// 📓 Client Notes CRM Routes
router.get("/client-notes/clients", authorize(...quoteAndCRMNotesRoles), getAllClientsWithNotes);
router.get("/client-notes", authorize(...quoteAndCRMNotesRoles), getClientNotes);
router.post("/client-notes", authorize(...quoteAndCRMNotesRoles), addClientNote);

export default router;