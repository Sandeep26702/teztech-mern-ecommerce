import 'dotenv/config';
import mongoose from 'mongoose';
import Product from '../src/models/Product.js';

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const totalBefore = await Product.countDocuments();
    console.log('Count before insert:', totalBefore);

    // Insert test product
    const testProduct = await Product.create({
      name: 'TEST PERSISTENCE',
      baseSku: 'test-persist-' + Date.now(),
      price: 199,
      status: 'Active'
    });
    console.log('Inserted test product with ID:', testProduct._id);

    const totalAfter = await Product.countDocuments();
    console.log('Count right after insert:', totalAfter);

    console.log('Sleeping for 5 seconds...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    const totalAfterSleep = await Product.countDocuments();
    console.log('Count after 5s sleep:', totalAfterSleep);

    // Clean up
    await Product.deleteOne({ _id: testProduct._id });
    console.log('Cleaned up test product.');

    const totalFinal = await Product.countDocuments();
    console.log('Final count:', totalFinal);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

run();
