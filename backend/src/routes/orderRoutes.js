import express from 'express';
// Yahan check karein: getMyOrders ko curly braces ke andar add kiya hai
import { 
    createOrder, 
    getAllOrdersForAdmin, 
    updateOrderStatus, 
    getOrderDetail,
    getMyOrders 
} from '../controllers/orderController.js';

import { protect } from '../middleware/auth.Middleware.js'; 
import { adminOnly } from '../middleware/roleMiddleware.js'; 

const router = express.Router();

// --- USER ROUTES ---
router.post('/create', protect, createOrder);
router.get('/my-orders', protect, getMyOrders); // Ab ye error nahi dega
router.get('/detail/:id', protect, getOrderDetail);

// --- ADMIN ROUTES ---
router.get('/admin/all', protect, adminOnly, getAllOrdersForAdmin);
router.put('/admin/update/:orderId', protect, adminOnly, updateOrderStatus);

export default router;