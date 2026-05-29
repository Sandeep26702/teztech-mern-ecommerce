import sendEmail from './src/utils/sendEmail.js';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
  if (!process.env.RESEND_API_KEY) {
    console.error("❌ Error: RESEND_API_KEY is not found in the .env file! Please make sure you have SAVED the .env file in your editor.");
    process.exit(1);
  }
  
  try {
    console.log("Testing email sending using Resend...");
    const emailTo = process.env.EMAIL_USER || 'teztechintern@gmail.com';
    const res = await sendEmail({
      email: emailTo,
      subject: "Test Email from Resend",
      message: "This is a test email to verify that Resend integration works."
    });
    console.log(`✅ Email sent successfully to ${emailTo}! Response:`, res);
  } catch (error) {
    console.error("❌ Failed to send email:", error.message);
  }
}
test();
