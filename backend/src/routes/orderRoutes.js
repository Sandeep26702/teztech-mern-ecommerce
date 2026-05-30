import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { 
    createOrder, 
    getAllOrdersForAdmin, 
    updateOrderStatus, 
    getOrderDetail,
    getMyOrders,
    createAdminOrder, // 🟢 NAYA ADD KIYA: Admin Order Controller
    editAdminOrder
} from '../controllers/orderController.js';
import { protect, authorize } from '../middleware/auth.Middleware.js'; 
import { trafficLogger } from "../middleware/trafficLogger.js";

const router = express.Router();

// Apply traffic logger to all order routes
router.use(trafficLogger);

// ☁️ Cloudinary Configuration (Aapke .env variables ke hisaab se)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 📦 Storage Engine: Cloudinary Setup
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'teztech_payments', // Cloudinary me is naam ka folder ban jayega
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'], // webp added for better support
  },
});

const upload = multer({ storage });

// --- USER ROUTES ---
// Frontend se 'paymentScreenshot' aayegi aur seedha Cloudinary par jayegi
router.post('/create', protect, upload.single('paymentScreenshot'), createOrder);

router.get('/my-orders', protect, getMyOrders); 
router.get('/detail/:id', protect, getOrderDetail);

// --- ADMIN ROUTES ---
router.get('/admin/all', protect, authorize("admin", "subadmin"), getAllOrdersForAdmin);
router.put('/admin/update/:orderId', protect, authorize("admin", "subadmin"), updateOrderStatus);

// 🟢 NAYA ROUTE: Admin Order Create karne ke liye (Secure with authorize)
router.post('/admin/create', protect, authorize("admin", "subadmin"), createAdminOrder);

// 🟢 NAYA ROUTE: Admin Edit Order karne ke liye
router.put('/admin/edit/:orderId', protect, authorize("admin", "subadmin"), editAdminOrder);

export default router;