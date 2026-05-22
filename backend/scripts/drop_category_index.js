import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("MONGO_URI not defined in .env");
  process.exit(1);
}

async function run() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected successfully.");

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const categoriesExists = collections.some(col => col.name === "categories");

    if (!categoriesExists) {
      console.log("categories collection does not exist.");
      await mongoose.disconnect();
      return;
    }

    const indexes = await db.collection("categories").indexes();
    console.log("Current indexes on categories collection:");
    console.log(JSON.stringify(indexes, null, 2));

    const nameIndex = indexes.find(idx => idx.name === "name_1" || (idx.key && idx.key.name));
    if (nameIndex) {
      console.log("Found index for name. Dropping name_1 index...");
      try {
        await db.collection("categories").dropIndex("name_1");
        console.log("Index 'name_1' dropped successfully.");
      } catch (err) {
        console.error("Failed to drop name_1 index:", err.message);
      }
    } else {
      console.log("No index named 'name_1' found.");
    }

    const updatedIndexes = await db.collection("categories").indexes();
    console.log("Updated indexes on categories collection:");
    console.log(JSON.stringify(updatedIndexes, null, 2));

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

run();
