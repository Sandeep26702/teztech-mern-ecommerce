import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../src/models/User.js';

const TEST_EMAIL = "test_otp_flow_123@gmail.com";
const TEST_PASSWORD = "Password123!";
const TEST_NAME = "Test OTP User";
const TEST_PHONE = "9876543210";

async function runTests() {
  console.log("=== STARTING AUTH FLOW TESTS ===");
  
  // 1. Connect to MongoDB
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("MONGO_URI not found in .env");
    process.exit(1);
  }
  
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB.");

  // Clean up any old test user
  await User.deleteOne({ email: TEST_EMAIL });
  console.log("Cleaned up existing test user (if any).");

  const baseUrl = "http://localhost:5000/api/auth";

  try {
    // Test 1: Register User
    console.log("\n--- Testing Registration API ---");
    const regRes = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: TEST_NAME,
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        phone: TEST_PHONE
      })
    });
    
    const regData = await regRes.json();
    console.log("Registration Response Status:", regRes.status);
    console.log("Registration Response Body:", regData);

    if (regRes.status !== 201 || !regData.success) {
      throw new Error("Registration failed");
    }

    // Check DB state for the created user
    const userInDb = await User.findOne({ email: TEST_EMAIL });
    if (!userInDb) {
      throw new Error("User not saved in MongoDB!");
    }
    console.log("User found in DB. isVerified:", userInDb.isVerified, "otp:", userInDb.otp, "otpExpire:", userInDb.otpExpire);

    if (userInDb.isVerified !== false) {
      throw new Error("User should be unverified after registration!");
    }
    if (!userInDb.otp || userInDb.otp.length !== 6) {
      throw new Error("Invalid OTP saved in DB!");
    }

    const testOtp = userInDb.otp;

    // Test 2: Attempt Login (Should fail because isVerified is false)
    console.log("\n--- Testing Login before Verification (Should fail) ---");
    const loginFailRes = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      })
    });

    const loginFailData = await loginFailRes.json();
    console.log("Login (Fail) Response Status:", loginFailRes.status);
    console.log("Login (Fail) Response Body:", loginFailData);

    if (loginFailRes.status !== 403 || loginFailData.success) {
      throw new Error("Login should have failed for unverified user!");
    }
    if (loginFailData.isVerified !== false) {
      throw new Error("Login failure response should indicate isVerified is false!");
    }

    // Test 3: Resend OTP
    console.log("\n--- Testing Resend OTP API ---");
    const resendRes = await fetch(`${baseUrl}/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL })
    });

    const resendData = await resendRes.json();
    console.log("Resend OTP Response Status:", resendRes.status);
    console.log("Resend OTP Response Body:", resendData);

    if (resendRes.status !== 200 || !resendData.success) {
      throw new Error("Resend OTP failed");
    }

    // Get the new OTP from DB
    const userInDbAfterResend = await User.findOne({ email: TEST_EMAIL });
    console.log("New OTP in DB:", userInDbAfterResend.otp);
    if (userInDbAfterResend.otp === testOtp) {
      throw new Error("OTP should have changed after resend!");
    }
    const newOtp = userInDbAfterResend.otp;

    // Test 4: Verify OTP with invalid OTP
    console.log("\n--- Testing Verify OTP (with invalid OTP, should fail) ---");
    const verifyFailRes = await fetch(`${baseUrl}/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_EMAIL,
        otp: "000000"
      })
    });
    const verifyFailData = await verifyFailRes.json();
    console.log("Verify OTP (Fail) Response Status:", verifyFailRes.status);
    console.log("Verify OTP (Fail) Response Body:", verifyFailData);

    if (verifyFailRes.status !== 400 || verifyFailData.success) {
      throw new Error("Verify OTP should have failed with invalid OTP");
    }

    // Test 5: Verify OTP with correct OTP
    console.log("\n--- Testing Verify OTP (with correct OTP, should succeed) ---");
    const verifySuccessRes = await fetch(`${baseUrl}/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_EMAIL,
        otp: newOtp
      })
    });
    const verifySuccessData = await verifySuccessRes.json();
    console.log("Verify OTP (Success) Response Status:", verifySuccessRes.status);
    console.log("Verify OTP (Success) Response Body:", verifySuccessData);

    if (verifySuccessRes.status !== 200 || !verifySuccessData.success) {
      throw new Error("Verify OTP failed with correct OTP");
    }
    if (!verifySuccessData.token) {
      throw new Error("JWT token was not returned after OTP verification!");
    }

    // Check DB state to ensure otp fields are cleared and isVerified is true
    const userInDbAfterVerify = await User.findOne({ email: TEST_EMAIL });
    console.log("User state after verification - isVerified:", userInDbAfterVerify.isVerified, "otp:", userInDbAfterVerify.otp);
    if (userInDbAfterVerify.isVerified !== true) {
      throw new Error("User isVerified should be true!");
    }
    if (userInDbAfterVerify.otp !== undefined && userInDbAfterVerify.otp !== null) {
      throw new Error("OTP field should be cleared from database!");
    }

    // Test 6: Login after Verification (Should succeed)
    console.log("\n--- Testing Login after Verification (Should succeed) ---");
    const loginSuccessRes = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      })
    });

    const loginSuccessData = await loginSuccessRes.json();
    console.log("Login (Success) Response Status:", loginSuccessRes.status);
    console.log("Login (Success) Response Body:", loginSuccessData);

    if (loginSuccessRes.status !== 200 || !loginSuccessData.success) {
      throw new Error("Login failed for verified user!");
    }
    if (!loginSuccessData.token) {
      throw new Error("JWT token was not returned after login!");
    }

    console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY! 🎉");
  } catch (err) {
    console.error("\n❌ TEST FAILED:", err.message);
  } finally {
    // Clean up test user
    await User.deleteOne({ email: TEST_EMAIL });
    console.log("Cleaned up test user.");
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

runTests();
