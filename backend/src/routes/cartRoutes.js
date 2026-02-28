import express from "express";
import { 
  getMyCart, 
  addToCart, 
  removeFromCart, 
  updateCartItem,
  clearCart // 🔥 NEW: Imported to clear the cart after successful checkout
} from "../controllers/cartController.js";
import { protect } from "../middleware/auth.Middleware.js"; // Middleware to verify JWT token

const router = express.Router();

/* ============================================================
   🛒 CART ROUTES (Protected by Authentication)
   Logic: Every route uses the 'protect' middleware. This guarantees 
   that the logged-in user's ID (req.user._id) is always available 
   in the controller, ensuring strict data isolation.
============================================================ */

// 1. Fetch the logged-in user's cart from the database
router.get("/", protect, getMyCart); 

// 2. Add a new item to the cart
router.post("/add", protect, addToCart); 

// 3. Update the quantity of an existing cart item (For Plus/Minus buttons)
router.put("/update", protect, updateCartItem); 

// 4. Remove a specific product completely from the cart
router.delete("/remove/:productId", protect, removeFromCart);

// 5. Clear the entire cart (Used after a successful order/checkout)
router.delete("/clear", protect, clearCart);

export default router;