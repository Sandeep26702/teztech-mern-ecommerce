import nodemailer from "nodemailer";

/**
 * Premium responsive HTML template for transactional emails
 */
const getHtmlTemplate = (subject, textContent) => {
  const formattedText = textContent
    .split("\n")
    .filter(line => line.trim() !== "")
    .map(line => `<p style="margin: 0 0 16px; line-height: 1.6; color: #4b5563; font-size: 15px;">${line}</p>`)
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);">
          <!-- Header -->
          <tr>
            <td style="background-color: #1e3a8a; padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: 1px;">SONANI ELECTRONICS</h1>
              <p style="margin: 4px 0 0; color: #93c5fd; font-size: 14px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Premium Electronic Solutions</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px 40px 30px;">
              <h2 style="margin: 0 0 20px; color: #111827; font-size: 20px; font-weight: 700;">${subject}</h2>
              <div style="margin-bottom: 24px;">
                ${formattedText}
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 32px 40px; border-top: 1px solid #f3f4f6; text-align: center;">
              <p style="margin: 0; color: #9ca3af; font-size: 13px; line-height: 1.5;">This email is sent automatically. Please do not reply directly to this address.</p>
              <p style="margin: 8px 0 0; color: #9ca3af; font-size: 13px; line-height: 1.5;">
                Need assistance? Contact our team at <a href="mailto:support@sonanielectronics.in" style="color: #2563eb; text-decoration: none; font-weight: 600;">support@sonanielectronics.in</a>
              </p>
              <div style="margin-top: 20px; height: 1px; background-color: #e5e7eb;"></div>
              <p style="margin: 20px 0 0; color: #9ca3af; font-size: 12px; font-weight: 500;">© 2026 Sonani Electronics. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const message = {
    from: `"Sonani Support" <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html || getHtmlTemplate(options.subject, options.message)
  };

  await transporter.sendMail(message);
};

export default sendEmail;
