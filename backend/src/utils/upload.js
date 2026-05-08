import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

// Load environment variables (.env file se API keys lene ke liye)
dotenv.config();

// 1. Cloudinary Credentials Setup
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 2. Configure Cloudinary Storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'teztech_uploads', // Cloudinary mein is naam ka folder ban jayega
    resource_type: 'auto', // 🔥 IMPORTANT: 'auto' isliye taaki Images aur Videos dono upload ho sakein
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'mp4', 'webm'], // Video formats add kar diye
  },
});

// 3. Create Multer Instance
const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 50 }, // 🔥 Limit 50MB kar di hai taaki hero video upload ho sake
});

// ✅ MUST HAVE DEFAULT EXPORT (Jaisa aapne bataya tha)
export default upload;