const nodemailer = require("nodemailer");
import dotenv from "dotenv";
dotenv.config();
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USERNAME, // Your email
    pass: process.env.GMAIL_APP_PASSWORD, // Your app password (if using Gmail, enable App Passwords)
  },
});

export const sendMail = async () => {
  try {
    // Prepare email content
    const emailContent = `
      <h2>AI Route Access Alert</h2>
    `;

    // Define mail options
    const mailOptions = {
      from: process.env.GMAIL_USERNAME,
      to: "dev.work.gzie@gmail.com", // Your email to receive notifications
      subject: "HyperBuild AI Route Access Alert",
      html: emailContent, // Send as HTML
    };

    // Send email
    await transporter.sendMail(mailOptions);
    console.log(`Notification sent for user`);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};
