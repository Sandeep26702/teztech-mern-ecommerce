import express from "express";
import {
  getMyCart,
  addToCart,
  removeFromCart,
  updateCartItem,
  clearCart,
  mergeCart,
} from "../controllers/cartController.js";
import { protect } from "../middleware/auth.Middleware.js";

const router = express.Router();

router.get("/", protect, getMyCart);
router.post("/add", protect, addToCart);
router.post("/merge", protect, mergeCart);
router.put("/update", protect, updateCartItem);
router.delete("/remove/:itemId", protect, removeFromCart);
router.delete("/clear", protect, clearCart);

export default router;
