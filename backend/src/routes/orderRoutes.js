import express from 'express';
import multer from 'multer'; // 🚀 NAYA: Multer import kiya
import { 
    createOrder, 
    getAllOrdersForAdmin, 
    updateOrderStatus, 
    getOrderDetail,
    getMyOrders 
} from '../controllers/orderController.js';
import { protect, authorize } from '../middleware/auth.Middleware.js'; 

const router = express.Router();

// 🚀 NAYA: Multer Configuration (Files kahan save hongi)
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/'); // Dhyan rahe: Backend folder me 'uploads' naam ka ek khali folder hona chahiye
  },
  filename(req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`);
  }
});
const upload = multer({ storage });

// --- USER ROUTES ---
// 🔥 THE FIX: 'upload.single('paymentScreenshot')' add kiya
router.post('/create', protect, upload.single('paymentScreenshot'), createOrder);

router.get('/my-orders', protect, getMyOrders); 
router.get('/detail/:id', protect, getOrderDetail);

// --- ADMIN ROUTES ---
router.get('/admin/all', protect, authorize("admin", "subadmin"), getAllOrdersForAdmin);
router.put('/admin/update/:orderId', protect, authorize("admin", "subadmin"), updateOrderStatus);

export default router;