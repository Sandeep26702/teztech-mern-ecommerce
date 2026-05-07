import { v2 as cloudinary } from "cloudinary";
import HomeLayout from "../models/HomeLayout.js";

// Ensure cloudinary is configured
const configureCloudinary = () => {
  if (!cloudinary.config().cloud_name) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }
};

// Helper function to upload file buffer to Cloudinary
const uploadToCloudinary = (fileBuffer, resourceType = "auto") => {
  configureCloudinary();
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "sonani_layout", resource_type: resourceType },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

/**
 * @desc    Get Home Layout Data
 * @route   GET /api/layout/home
 * @access  Public
 */
export const getHomeLayout = async (req, res) => {
  try {
    let layout = await HomeLayout.findOne();

    // If no layout exists, return a default template
    if (!layout) {
      layout = {
        heroVideo: "",
        heroTitle: "Welcome to Sonani Electronics",
        heroSubtitle:
          "Your trusted partner for premium electronic components and cutting-edge solutions. Built for innovators, by experts.",
        featureCards: [
          {
            title: "Quality Products",
            description: "Premium electronic components from trusted manufacturers worldwide",
            image: "",
          },
          {
            title: "Fast Delivery",
            description: "Quick and reliable shipping to meet your project deadlines",
            image: "",
          },
          {
            title: "Expert Support",
            description: "Technical assistance from our experienced electronics team",
            image: "",
          },
        ],
      };
    }

    res.status(200).json(layout);
  } catch (error) {
    console.error("Get Layout Error:", error);
    res.status(500).json({ message: "Server Error while fetching layout data" });
  }
};

/**
 * @desc    Update Home Layout Data
 * @route   PUT /api/layout/home
 * @access  Private/Admin
 */
export const updateHomeLayout = async (req, res) => {
  try {
    const { heroTitle, heroSubtitle, featureCards } = req.body;
    let layout = await HomeLayout.findOne();

    if (!layout) {
      layout = new HomeLayout();
    }

    // Parse featureCards from string if sent as JSON string via FormData
    let parsedFeatureCards = [];
    if (typeof featureCards === "string") {
      try {
        parsedFeatureCards = JSON.parse(featureCards);
      } catch (e) {
        return res.status(400).json({ message: "Invalid feature cards data format" });
      }
    } else if (Array.isArray(featureCards)) {
      parsedFeatureCards = featureCards;
    }

    // Handle File Uploads
    const files = req.files || {};

    // 1. Upload Hero Video if provided
    if (files.heroVideo && files.heroVideo.length > 0) {
      const videoUrl = await uploadToCloudinary(files.heroVideo[0].buffer, "video");
      layout.heroVideo = videoUrl;
    }

    // 2. Upload Feature Card Images if provided
    // Expected field names: featureCards_0_image, featureCards_1_image, featureCards_2_image
    for (let i = 0; i < parsedFeatureCards.length; i++) {
      const fieldName = `featureCards_${i}_image`;
      if (files[fieldName] && files[fieldName].length > 0) {
        const imageUrl = await uploadToCloudinary(files[fieldName][0].buffer, "image");
        parsedFeatureCards[i].image = imageUrl;
      } else {
        // Retain existing image if not uploaded new one
        if (layout.featureCards && layout.featureCards[i]) {
          parsedFeatureCards[i].image = parsedFeatureCards[i].image || layout.featureCards[i].image;
        }
      }
    }

    // Update Text Fields
    if (heroTitle) layout.heroTitle = heroTitle;
    if (heroSubtitle) layout.heroSubtitle = heroSubtitle;
    if (parsedFeatureCards.length > 0) layout.featureCards = parsedFeatureCards;

    await layout.save();

    res.status(200).json({ message: "Home Layout updated successfully", layout });
  } catch (error) {
    console.error("Update Layout Error:", error);
    res.status(500).json({ message: "Server Error while updating layout data" });
  }
};
