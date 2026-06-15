import User from "../models/User.js";

const seedAdmin = async () => {
  try {
    // Fetch the correct admin credential variables from .env
    const adminEmail = process.env.SUPER_ADMIN_EMAIL;
    const adminPassword = process.env.SUPER_ADMIN_PASSWORD;

    // Check if the admin account with the specified email already exists
    const adminExists = await User.findOne({ email: adminEmail });
    
    if (adminExists) {
      console.log("ℹ️  Admin account already exists.");
      return;
    }

    // Create the new Admin (Password hashing is handled by the model pre-save hook)
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