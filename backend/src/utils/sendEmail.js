import nodemailer from "nodemailer";

/**
 * Basic HTML template for instant transactional emails
 */
const getHtmlTemplate = (subject, textContent) => {
  const formattedText = textContent
    .split("\n")
    .filter(line => line.trim() !== "")
    .map(line => `<p>${line}</p>`)
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="font-family: sans-serif; padding: 20px;">
  <h2>${subject}</h2>
  <div>${formattedText}</div>
  <hr style="margin-top: 20px;" />
  <p style="font-size: 12px; color: #666;">This is an automated message from Sonani Electronics.</p>
</body>
</html>
  `;
};

let transporter;

const sendEmail = async (options) => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      pool: true,
      maxConnections: 5,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  const message = {
    from: `"Sonani Support" <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html || getHtmlTemplate(options.subject, options.message)
  };

  try {
    const info = await transporter.sendMail(message);
    return info;
  } catch (error) {
    console.error(`❌ Nodemailer Background Error:`, error.message);
    throw error; // Let the caller catch it if they are awaiting, otherwise it logs in the caller
  }
};

export default sendEmail;
