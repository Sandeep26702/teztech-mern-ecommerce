import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

const productSchema = new mongoose.Schema({
  name: String,
  status: String
}, { strict: false });

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

async function run() {
  await mongoose.connect(MONGO_URI);
  
  const p1 = await Product.findOne({ name: /TTCFM105/i }).lean();
  const p2 = await Product.findOne({ name: /TFCR29/i }).lean();
  const p3 = await Product.findOne({ name: /STRIP PATTA/i }).lean();

  console.log("Product 1 (TTCFM105):", JSON.stringify(p1, null, 2));
  console.log("Product 2 (TFCR29):", JSON.stringify(p2, null, 2));
  console.log("Product 3 (STRIP PATTA):", JSON.stringify(p3, null, 2));

  await mongoose.disconnect();
}
run();
