import express from "express";
import { register, login, logout, getMe } from "../controllers/auth.Controller.js";
import { protect } from "../middleware/auth.Middleware.js";


import {
 
  forgotPassword,
  resetPassword
} from "../controllers/auth.Controller.js";


const router = express.Router();



// Public routes
router.post("/register", register);  // ✅ Correct
router.post("/login", login); 
router.post("/forgot-password", forgotPassword);
router.put("/reset-password/:token", resetPassword);       // ✅ Correct

// Protected routes
router.post("/logout", protect, logout);
router.get("/me", protect, getMe);

export default router;