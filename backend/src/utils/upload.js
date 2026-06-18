import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

// Load environment variables (to get API keys from .env file)
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
    folder: 'teztech_uploads', // This folder will be created in Cloudinary
    resource_type: 'auto', // 🔥 IMPORTANT: 'auto' so that both Images and Videos can be uploaded
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'mp4', 'webm', 'svg'], // Supported formats including SVG
  },
});

// 3. Create Multer Instance
const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 50 }, // 🔥 Set 50MB limit to allow uploading large hero videos
});

// ✅ MUST HAVE DEFAULT EXPORT (Jaisa aapne bataya tha)
export default upload;