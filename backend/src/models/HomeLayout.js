import mongoose from "mongoose";

// ==========================================
// 1. Naya Slide Schema (Har ek slider item ke liye)
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
    enum: ['upload', 'link'], // 'upload' matlab Cloudinary, 'link' matlab YouTube/External
    required: true,
    default: 'upload'
  },
  mediaUrl: { 
    type: String, 
    required: true // Cloudinary URL ya YouTube/External Link yahan save hoga
  },
  title: { 
    type: String, 
    default: "Welcome to Sonani Electronics" 
  },
  subtitle: { 
    type: String, 
    default: "Your trusted partner for premium electronic components and cutting-edge solutions." 
  }
});

// ==========================================
// 2. Feature Card Schema (Aapka purana wala)
// ==========================================
const featureCardSchema = new mongoose.Schema({
  image: {
    type: String, // Cloudinary URL
    default: "",
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
    // Hero Section ab ek Array (Slider) ban gaya hai
    heroSlides: {
      type: [slideSchema],
      validate: {
        validator: function (v) {
          return v.length <= 5; // Slider mein max 5 items rakh sakte hain taaki page load fast rahe
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

// Mongoose overwrite error se bachne ke liye `mongoose.models` check lagaya hai
const HomeLayout = mongoose.models.HomeLayout || mongoose.model("HomeLayout", homeLayoutSchema);

export default HomeLayout;