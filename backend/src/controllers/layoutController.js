import HomeLayout from "../models/HomeLayout.js";

/**
 * @desc    Get Home Layout Data
 * @route   GET /api/layout/home
 * @access  Public
 */
export const getHomeLayout = async (req, res) => {
  try {
    let layout = await HomeLayout.findOne();

    // Agar database khali hai, toh ek Default Slider aur Cards bhejenge
    if (!layout) {
      layout = {
        heroSlides: [
          {
            mediaType: "image",
            sourceType: "upload",
            mediaUrl: "", // Admin aakar update karega
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
    // Ab frontend se heroSlides array aur featureCards array JSON string banke aayegi
    const { heroSlides, featureCards } = req.body;
    let layout = await HomeLayout.findOne();

    if (!layout) {
      layout = new HomeLayout();
    }

    // 1. JSON Strings ko wapas Arrays mein convert karna
    let parsedSlides = [];
    let parsedCards = [];

    try {
      if (heroSlides) parsedSlides = JSON.parse(heroSlides);
      if (featureCards) parsedCards = JSON.parse(featureCards);
    } catch (e) {
      return res.status(400).json({ message: "Invalid data format sent from frontend" });
    }

    // Cloudinary se upload hui files yahan milengi
    const files = req.files || [];

    // ==========================================
    // 2. HERO SLIDES LOGIC (Upload vs Link)
    // ==========================================
    for (let i = 0; i < parsedSlides.length; i++) {
      const slide = parsedSlides[i];

      // Agar admin ne PC se file "upload" ki hai
      if (slide.sourceType === "upload") {
        const fieldName = `slide_${i}_file`; // Frontend se yeh naam aayega
        const uploadedFile = files.find((file) => file.fieldname === fieldName);

        if (uploadedFile) {
          slide.mediaUrl = uploadedFile.path; // Naya Cloudinary URL set kar do
        } else {
          // Agar file update nahi ki, toh purani wali (existingUrl) use kar lo
          slide.mediaUrl = slide.existingUrl || slide.mediaUrl || "";
        }
      } 
      // Agar admin ne "link" select kiya hai, toh frontend seedha mediaUrl bhej dega
      else if (slide.sourceType === "link") {
        slide.mediaUrl = slide.mediaUrl || "";
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
        // Agar image badli nahi, toh purani retain karo
        parsedCards[i].image = parsedCards[i].existingImage || parsedCards[i].image || "";
      }
    }

    // Database mein update karo
    layout.heroSlides = parsedSlides;
    layout.featureCards = parsedCards;

    await layout.save();

    res.status(200).json({ message: "Home Layout updated successfully", layout });
  } catch (error) {
    console.error("Update Layout Error:", error);
    res.status(500).json({ message: "Server Error while updating layout data" });
  }
};