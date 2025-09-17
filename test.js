import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

transporter.sendMail({
  from: `"Test" <${process.env.EMAIL_USER}>`,
  to: process.env.EMAIL_USER,
  subject: 'Test Email',
  text: 'This is a test email from Nodemailer.'
}, (err, info) => {
  if (err) {
    console.error("❌ Email failed:", err);
  } else {
    console.log("✅ Email sent:", info.response);
  }
});