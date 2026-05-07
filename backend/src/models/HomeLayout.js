import mongoose from "mongoose";

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

const homeLayoutSchema = new mongoose.Schema(
  {
    heroVideo: {
      type: String, // Cloudinary video URL
      default: "",
    },
    heroTitle: {
      type: String,
      default: "Welcome to Sonani Electronics",
    },
    heroSubtitle: {
      type: String,
      default: "Your trusted partner for premium electronic components and cutting-edge solutions.",
    },
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

const HomeLayout = mongoose.model("HomeLayout", homeLayoutSchema);

export default HomeLayout;
