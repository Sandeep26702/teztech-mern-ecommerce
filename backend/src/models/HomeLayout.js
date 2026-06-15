import mongoose from "mongoose";

// ==========================================
// 1. Slide Schema (For each slider item)
// ==========================================
const slideSchema = new mongoose.Schema({
  mediaType: { 
    type: String, 
    enum: ['image', 'video'], 
    required: true,
    default: 'image'
  },
  sourceType: { 
    type: String, 
    enum: ['upload', 'link'], // 'upload' means Cloudinary, 'link' means YouTube/External
    required: true,
    default: 'upload'
  },
  mediaUrl: { 
    type: String, 
    required: true // Cloudinary URL or YouTube/External Link will be saved here (Desktop)
  },
  mobileMediaUrl: {
    type: String,
    default: "" // Mobile specific URL
  },
  title: { 
    type: String, 
    default: "" // Saved as empty initially, Admin will update it later
  },
  subtitle: { 
    type: String, 
    default: "" // Saved as empty initially, Admin will update it later
  }
});
// ==========================================
// 2. Feature Card Schema (Aapka purana wala)
// ==========================================
const featureCardSchema = new mongoose.Schema({
  image: {
    type: String, // Cloudinary URL
    default: "", // Saved as empty initially, Admin will update it later
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
});

// ==========================================
// 3. Main Home Layout Schema
// ==========================================
const homeLayoutSchema = new mongoose.Schema(
  {
    // Hero Section is now an Array (Slider)
    heroSlides: {
      type: [slideSchema],
      validate: {
        validator: function (v) {
          return v.length <= 5; // Maximum of 5 items allowed in slider for page loading performance
        },
        message: "You can only have up to 5 slides in the hero section.",
      },
    },
    
    // Feature cards (Max 3)
    featureCards: {
      type: [featureCardSchema],
      validate: {
        validator: function (v) {
          return v.length <= 3; // Max 3 cards
        },
        message: "You can only have up to 3 feature cards.",
      },
    },
  },
  { timestamps: true }
);

// Prevent Mongoose Model Overwrite errors by checking if model exists
const HomeLayout = mongoose.models.HomeLayout || mongoose.model("HomeLayout", homeLayoutSchema);

export default HomeLayout;