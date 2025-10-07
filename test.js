import { Resend } from 'resend';
import dotenv from 'dotenv';
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

async function testResendEmail() {
  try {
    const response = await resend.emails.send({
      from: 'Digilocker <onboarding@resend.dev>',
      to: process.env.TEST_EMAIL || 'rupshasaha3002@gmail.com',
      subject: 'Test Email from Resend',
      text: 'This is a test email sent using Resend API.'
    });

    console.log('Email sent successfully via Resend:', response);
  } catch (err) {
    console.error('Resend email failed:', err);
  }
}

testResendEmail();