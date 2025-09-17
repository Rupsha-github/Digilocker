import { db } from '../database/dbConnection.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
dotenv.config();


// Helper to send OTP email
async function sendOtpEmail(to, otp) {
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  await transporter.sendMail({
    from: '"Digilocker" <no-reply@digilocker.com>',
    to,
    subject: 'Verify your email',
    text: `Your OTP is ${otp}. It expires in 10 minutes.`
  });
}

// POST /auth/signup
async function signup(req, res) {
  const { username, email, password, passwordConfirm } = req.body;
  const normalizedEmail = email.trim().toLowerCase(); // to avoid duplicates because of case sensitivity

  try {
    const [existing] = await db.execute(
      'SELECT id FROM users WHERE email = ?',
      [normalizedEmail]
    );

    if (existing.length > 0) {
      return res.status(400).render('signup', {
        emailError: 'Email already exists.',
        passwordError: null,
        formData: req.body,
        wasValidated: true
      });
    }

    if (password !== passwordConfirm) {
      return res.status(400).render('signup', {
        emailError: null,
        passwordError: 'Passwords do not match.',
        formData: req.body,
        wasValidated: true
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000;

    req.session.pendingUser = {
      username,
      email: normalizedEmail,
      hashedPassword,
      otp,
      expiresAt
    };

    await sendOtpEmail(normalizedEmail, otp);
    res.redirect('/auth/verify-otp');
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).send('Server error. Please try again later.');
  }
}

// GET /auth/verify-otp
function getVerifyOtp(req, res) {
  // console.log("verify-otp route hit");
  res.render('verifyOtp', { error: null, resent: false });
}

// POST /auth/verify-otp
async function postVerifyOtp(req, res) {
  const { otp } = req.body;
  const pendingUser = req.session.pendingUser;

  if (!pendingUser) return res.redirect('/auth/signup');

  const { username, email, hashedPassword, otp: sessionOtp, expiresAt } = pendingUser;

  if (Date.now() > expiresAt) {
    req.session.pendingUser = null;
    return res.render('verifyOtp', {
      error: 'OTP expired. Please sign up again.',
      resent: false
    });
  }

  if (otp !== sessionOtp) {
    return res.render('verifyOtp', {
      error: 'Invalid OTP. Please try again.',
      resent: false
    });
  }

  const id = uuidv4();
  // console.log("UUID for new user:", id);

  await db.execute(
    'INSERT INTO users (id, username, email, password) VALUES (?, ?, ?, ?)',
    [id, username, email, hashedPassword]
  );

  req.session.pendingUser = null;
  req.flash('success', 'Signup and email verification was successful! You can now log in.');
  res.redirect('/login');
}

// POST /auth/resend-otp
async function resendOtp(req, res) {
  const pendingUser = req.session.pendingUser;
  if (!pendingUser) return res.redirect('/auth/signup');

  const otp = crypto.randomInt(100000, 999999).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000;

  pendingUser.otp = otp;
  pendingUser.expiresAt = expiresAt;

  await sendOtpEmail(pendingUser.email, otp);

  res.render('verifyOtp', { error: null, resent: true });
}

// POST /auth/login
async function login(req, res) {
  const { email, password } = req.body;
  const normalizedEmail = email.trim().toLowerCase();

  try {
    // console.log("Login attempt", normalizedEmail);
    const [rows] = await db.execute(
      'SELECT * FROM users WHERE email = ?',
      [normalizedEmail]
    );

    if (rows.length === 0) {
      req.flash('error', 'Email does not exist. Please signup first.');
      return res.redirect('/auth/login');
    }

    const user = rows[0];
    // console.log(user);
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      console.log(req.body);
      req.flash('error', 'Invalid password.');
      console.log("Flash error set:", req.flash('error'));
      req.flash('formData', req.body);
      return res.redirect('/auth/login');
    }

    req.session.userId = user.id;
    req.flash('success', 'Login successful! Welcome to Digilocker.');
    res.redirect('/');

  } catch (err) {
    console.log(err);
    res.status(500).send('Server error. Please try again later.')
  }
}

const authController = {
  signup,
  getVerifyOtp,
  postVerifyOtp,
  resendOtp, 
  login
};

export default authController;