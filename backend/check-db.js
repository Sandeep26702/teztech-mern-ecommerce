import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: "e:/sonani/backend/.env" });

const slideSchema = new mongoose.Schema({
  mediaType: { type: String },
  sourceType: { type: String },
  mediaUrl: { type: String },
  title: { type: String },
  subtitle: { type: String }
});

const homeLayoutSchema = new mongoose.Schema({
  heroSlides: [slideSchema]
});

const HomeLayout = mongoose.model("HomeLayout", homeLayoutSchema);

async function checkLayout() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const layout = await HomeLayout.findOne();
    console.log(JSON.stringify(layout, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.disconnect();
  }
}

checkLayout();
