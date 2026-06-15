import HomeLayout from "../models/HomeLayout.js";
import { getCache, setCache, clearLayoutCache, cacheKeys } from "../utils/cache.js";

/**
 * @desc    Get Home Layout Data
 * @route   GET /api/layout/home
 * @access  Public
 */
export const getHomeLayout = async (req, res) => {
  try {
    const cachedLayout = getCache(cacheKeys.HOME_LAYOUT);
    if (cachedLayout) {
      return res.status(200).json(cachedLayout);
    }

    let layout = await HomeLayout.findOne();

    // If database is empty, return a default slider and default feature cards
    if (!layout) {
      layout = {
        heroSlides: [
          {
            mediaType: "image",
            sourceType: "upload",
            mediaUrl: "", // Admin will update this later
            mobileMediaUrl: "", // For mobile
            title: "",
            subtitle: "",
          }
        ],
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

    // 2. Save in cache
    setCache(cacheKeys.HOME_LAYOUT, layout);

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
    // Frontend will send heroSlides and featureCards arrays serialized as JSON strings
    const { heroSlides, featureCards } = req.body;
    let layout = await HomeLayout.findOne();

    if (!layout) {
      layout = new HomeLayout();
    }

    // 1. Parse JSON strings back into arrays
    let parsedSlides = [];
    let parsedCards = [];

    try {
      if (heroSlides) parsedSlides = JSON.parse(heroSlides);
      if (featureCards) parsedCards = JSON.parse(featureCards);
    } catch (e) {
      return res.status(400).json({ message: "Invalid data format sent from frontend" });
    }

    // Files uploaded to Cloudinary will be available in req.files
    const files = req.files || [];

    // ==========================================
    // 2. HERO SLIDES LOGIC (Upload vs Link)
    // ==========================================
    for (let i = 0; i < parsedSlides.length; i++) {
      const slide = parsedSlides[i];

      // If the admin uploaded a file from their local computer
      if (slide.sourceType === "upload") {
        // Desktop File
        const desktopFieldName = `slide_${i}_file`; 
        const uploadedDesktopFile = files.find((file) => file.fieldname === desktopFieldName);
        if (uploadedDesktopFile) {
          slide.mediaUrl = uploadedDesktopFile.path;
        } else {
          slide.mediaUrl = slide.existingUrl || slide.mediaUrl || "";
        }

        // Mobile File
        const mobileFieldName = `slide_${i}_mobileFile`;
        const uploadedMobileFile = files.find((file) => file.fieldname === mobileFieldName);
        if (uploadedMobileFile) {
          slide.mobileMediaUrl = uploadedMobileFile.path;
        } else {
          slide.mobileMediaUrl = slide.existingMobileUrl || slide.mobileMediaUrl || "";
        }
      } 
      // If the admin selected external link option
      else if (slide.sourceType === "link") {
        slide.mediaUrl = slide.mediaUrl || "";
        slide.mobileMediaUrl = slide.mobileMediaUrl || "";
      }
    }

    // ==========================================
    // 3. FEATURE CARDS LOGIC
    // ==========================================
    for (let i = 0; i < parsedCards.length; i++) {
      const fieldName = `featureCards_${i}_image`;
      const uploadedImage = files.find((file) => file.fieldname === fieldName);

      if (uploadedImage) {
        parsedCards[i].image = uploadedImage.path; // Naya Cloudinary URL
      } else {
        // If the image did not change, retain the existing one
        parsedCards[i].image = parsedCards[i].existingImage || parsedCards[i].image || "";
      }
    }

    // Database mein update karo
    layout.heroSlides = parsedSlides;
    layout.featureCards = parsedCards;

    await layout.save();

    // Clear layout cache
    clearLayoutCache();

    res.status(200).json({ message: "Home Layout updated successfully", layout });
  } catch (error) {
    console.error("Update Layout Error:", error);
    res.status(500).json({ message: "Server Error while updating layout data" });
  }
};