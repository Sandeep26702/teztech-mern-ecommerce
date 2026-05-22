import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import ProductImportJob from "../src/models/ProductImportJob.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB Atlas");

    const jobs = await ProductImportJob.find().sort({ createdAt: -1 }).lean();
    console.log(JSON.stringify(jobs.map(j => ({
      _id: j._id,
      fileName: j.fileName,
      status: j.status,
      processed: j.processed,
      importedCount: j.importedCount,
      failedCount: j.failedCount,
      createdAt: j.createdAt,
      completedAt: j.completedAt,
      rollbackAt: j.rollbackAt,
      createdProductIdsLength: j.createdProductIds ? j.createdProductIds.length : 0
    })), null, 2));

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
