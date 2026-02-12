import express from "express";
import {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword
} from "../controllers/auth.Controller.js";
import { protect } from "../middleware/auth.Middleware.js";

const router = express.Router();

// Public
router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.put("/reset-password/:token", resetPassword);

// Protected
router.get("/me", protect, getMe);

export default router;
