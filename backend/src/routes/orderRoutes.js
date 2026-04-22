import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { 
    createOrder, 
    getAllOrdersForAdmin, 
    updateOrderStatus, 
    getOrderDetail,
    getMyOrders 
} from '../controllers/orderController.js';
import { protect, authorize } from '../middleware/auth.Middleware.js'; 

const router = express.Router();

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

export default router;