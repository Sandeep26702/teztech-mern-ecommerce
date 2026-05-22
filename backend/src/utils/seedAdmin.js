import User from "../models/User.js";

const seedAdmin = async () => {
  try {
    // .env se sahi naam waale variables uthao
    const adminEmail = process.env.SUPER_ADMIN_EMAIL;
    const adminPassword = process.env.SUPER_ADMIN_PASSWORD;

    // Check agar wo specific email wala admin pehle se hai
    const adminExists = await User.findOne({ email: adminEmail });
    
    if (adminExists) {
      console.log("ℹ️  Admin account already exists.");
      return;
    }

    // Naya Admin Create Karein (Hashing Model ka pre-save hook handle karega)
    await User.create({
      name: "Super Admin",
      email: adminEmail,
      password: adminPassword,
      role: "admin",
      isEmailVerified: true,
      isVerified: true,
      phone: "9999999999"
    });

    console.log("🎉 Admin Account Created Successfully!");
    console.log(`📧 Email: ${adminEmail}`);
    
  } catch (error) {
    console.error("❌ Admin Seeding Error:", error.message);
  }
};

export default seedAdmin;