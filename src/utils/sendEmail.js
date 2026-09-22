import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();
export async function sendEmail({ to, subject, text, html }) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "thefabcodeuser9@gmail.com",
        pass: process.env.APP_PASSWORD,
      },
    });

    const mailOptions = {
      from: "thefabcodeuser9@gmail.com",
      to,
      subject,
      ...(html ? { html } : {}),
      text,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Failed to send email:", error);
    throw new Error("Email sending failed");
  }
}
