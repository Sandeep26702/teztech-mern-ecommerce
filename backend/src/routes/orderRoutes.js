import express from 'express';
// Yahan check karein: getMyOrders ko curly braces ke andar add kiya hai
import { 
    createOrder, 
    getAllOrdersForAdmin, 
    updateOrderStatus, 
    getOrderDetail,
    getMyOrders 
} from '../controllers/orderController.js';

import { protect, authorize } from '../middleware/auth.Middleware.js'; 

const router = express.Router();

// --- USER ROUTES ---
router.post('/create', protect, createOrder);
router.get('/my-orders', protect, getMyOrders); // Ab ye error nahi dega
router.get('/detail/:id', protect, getOrderDetail);

// --- ADMIN ROUTES ---
router.get('/admin/all', protect, authorize("admin", "subadmin"), getAllOrdersForAdmin);
router.put('/admin/update/:orderId', protect, authorize("admin", "subadmin"), updateOrderStatus);

export default router;
