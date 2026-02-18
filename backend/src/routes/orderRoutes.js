import express from "express";
import { createOrder } from "../controllers/orderController.js";
import { protect } from "../middleware/auth.Middleware.js";
import { cancelOrder } from "../controllers/orderController.js";
import { getOrderById } from "../controllers/orderController.js";



const router = express.Router();

router.post("/", protect, createOrder);
router.put("/:id/cancel", protect, cancelOrder);
router.get("/:id", protect, getOrderById);

export default router;
