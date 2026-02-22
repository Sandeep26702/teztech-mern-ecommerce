import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

// Configuration ko yahan direct likhne ki jagah storage ke andar ensure karenge
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Ye function har upload par chalta hai, tab tak .env load ho chuka hota hai
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    return {
      folder: 'sonani_products',
      allowed_formats: ['jpg', 'png', 'jpeg'],
      public_id: `product_${Date.now()}`,
    };
  },
});

export const upload = multer({ storage });