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
    createAdminOrder, // 🟢 NEW ADDED: Admin Order Controller
    editAdminOrder
} from '../controllers/orderController.js';
import { protect, authorize } from '../middleware/auth.Middleware.js'; 
import { trafficLogger } from "../middleware/trafficLogger.js";

const router = express.Router();

// Apply traffic logger to all order routes
router.use(trafficLogger);

// ☁️ Cloudinary Configuration (Using values from .env variables)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 📦 Storage Engine: Cloudinary Setup
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'teztech_payments', // This folder will be created in Cloudinary
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'], // webp added for better support
  },
});

const upload = multer({ storage });

// --- USER ROUTES ---
// Frontend sends 'paymentScreenshot' which is uploaded directly to Cloudinary
router.post('/create', protect, upload.single('paymentScreenshot'), createOrder);

router.get('/my-orders', protect, getMyOrders); 
router.get('/detail/:id', protect, getOrderDetail);

// --- ADMIN ROUTES ---
router.get('/admin/all', protect, authorize("admin", "subadmin", "sales team", "manufacturing", "purchase"), getAllOrdersForAdmin);
router.put('/admin/update/:orderId', protect, authorize("admin", "subadmin", "sales team", "manufacturing"), updateOrderStatus);

// 🟢 NEW ROUTE: For Admin Order Creation (Secured with authorization)
router.post('/admin/create', protect, authorize("admin", "subadmin", "sales team", "purchase"), createAdminOrder);

// 🟢 NEW ROUTE: For Admin Order Editing
router.put('/admin/edit/:orderId', protect, authorize("admin", "subadmin", "sales team", "purchase"), editAdminOrder);

export default router;