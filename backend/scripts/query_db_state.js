import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Product from "../src/models/Product.js";
import ProductImportJob from "../src/models/ProductImportJob.js";
import Category from "../src/models/Category.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB Atlas");

    const totalProducts = await Product.countDocuments();
    console.log("Total Products in database:", totalProducts);

    if (totalProducts > 0) {
      const sampleProducts = await Product.find({}, "name baseSku price category status").limit(5).lean();
      console.log("Sample Products:", JSON.stringify(sampleProducts, null, 2));
    }

    const totalCategories = await Category.countDocuments();
    console.log("Total Categories in database:", totalCategories);

    const jobs = await ProductImportJob.find().sort({ createdAt: -1 }).lean();
    console.log(`Total Import Jobs: ${jobs.length}`);
    jobs.forEach((j, index) => {
      console.log(`Job ${index + 1}:`);
      console.log(`  File: ${j.fileName}`);
      console.log(`  Status: ${j.status}`);
      console.log(`  Processed: ${j.processed}`);
      console.log(`  Imported Count: ${j.importedCount}`);
      console.log(`  Failed Count: ${j.failedCount}`);
      console.log(`  Created Product IDs Count: ${j.createdProductIds ? j.createdProductIds.length : 0}`);
      console.log(`  Error Logs Sample (first 2):`, JSON.stringify(j.errorLogs ? j.errorLogs.slice(0, 2) : [], null, 2));
    });

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
