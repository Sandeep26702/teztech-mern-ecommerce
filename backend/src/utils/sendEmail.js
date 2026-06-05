import { Resend } from "resend";

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

const sendEmail = async (options) => {
  const resend = new Resend(process.env.RESEND_API_KEY);

  const payload = {
    from: process.env.EMAIL_FROM || "Sonani Electronics <SonaniElectronic@polysheet.in>",
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html || getHtmlTemplate(options.subject, options.message)
  };

  try {
    const { data, error } = await resend.emails.send(payload);

    if (error) {
      console.error(`❌ Resend API Error:`, error);
      throw new Error(error.message);
    }
    
    return data;
  } catch (error) {
    console.error(`❌ Resend Background Error:`, error.message);
    throw error; // Let the caller catch it if they are awaiting, otherwise it logs in the caller
  }
};

export default sendEmail;
