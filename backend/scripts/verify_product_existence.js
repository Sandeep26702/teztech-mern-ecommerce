import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Product from "../src/models/Product.js";
import ProductImportJob from "../src/models/ProductImportJob.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB Atlas");

    const jobs = await ProductImportJob.find().sort({ createdAt: -1 }).lean();
    for (let index = 0; index < jobs.length; index++) {
      const j = jobs[index];
      console.log(`Job ${index + 1} (${j.fileName}):`);
      console.log(`  Created Product IDs length: ${j.createdProductIds ? j.createdProductIds.length : 0}`);
      if (j.createdProductIds && j.createdProductIds.length > 0) {
        const existingCount = await Product.countDocuments({ _id: { $in: j.createdProductIds } });
        console.log(`  Existing products in DB from this job: ${existingCount}`);
      }
    }

    // Let's print the details of the only product in the DB
    const onlyProduct = await Product.findOne().lean();
    console.log("The only product in database details:", onlyProduct);

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
