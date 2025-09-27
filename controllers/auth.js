import { db } from '../database/dbConnection.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
dotenv.config();


// Helper to send OTP email
async function sendOtpEmail(to, otp, context = 'Verify your email') {
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
    subject: context,
    text: `Your OTP is ${otp}. It expires in 10 minutes.`
  });
}


// GET : /auth/signup
export const getSignup = (req, res) => {
  res.render('signup', {
    emailError: null,
    passwordError: null,
    formData: {},
    wasValidated: false
  });
};

// POST : /auth/signup
async function postSignup(req, res) {
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

// GET : /auth/verify-otp
function getVerifyOtp(req, res) {
  // console.log("verify-otp route hit");
  res.render('verifyOtp', { error: null, resent: false });
}

// POST : /auth/verify-otp
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
  res.redirect('/auth/login');
}

// POST : /auth/resend-otp
async function resendOtp(req, res) {
  const pendingUser = req.session.pendingUser;
  if (!pendingUser) return res.redirect('/auth/signup');

  const otp = crypto.randomInt(100000, 999999).toString();
  // console.log(otp);
  const expiresAt = Date.now() + 10 * 60 * 1000;

  pendingUser.otp = otp;
  pendingUser.expiresAt = expiresAt;

  await sendOtpEmail(pendingUser.email, otp);

  res.render('verifyOtp', { error: null, resent: true });
}

// GET : /auth/login
export const getLogin = (req, res) => {
  res.render('login');
};


// POST : /auth/login
async function postLogin(req, res) {
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
      req.session.save(() => {
        res.redirect('/auth/login');
      });
      return;
    }

    const user = rows[0];
    // console.log(user);
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      req.flash('error', 'Invalid password.');
      req.session.save(() => {
        res.redirect('/auth/login');
      });
      return;
    }


    req.session.userId = user.id;
    req.flash('success', 'Login successful! Welcome to Digilocker.');
    res.redirect('/');

  } catch (err) {
    console.log(err);
    res.status(500).send('Server error. Please try again later.')
  }
}

// Logout
export const postLogout = (req, res) => {
  req.flash('success', 'You have logged out successfully');
  req.session.userId = null; // user logged out
  res.redirect('/');
};

// GET : /auth/forgot-password
export const getForgotPassword = (req, res) => {
  res.render('forgot-password');
}

// POST : /auth/forgot-password
export const postForgotPassword = async (req, res) => {
  const {email} = req.body;
  const normalizedEmail = email.trim().toLowerCase();

  const [user] = await db.execute('SELECT * FROM users WHERE email = ?', [normalizedEmail]);
  if(user.length === 0) {
    req.flash('error', 'Email not found');
    return res.redirect('/auth/forgot-password');
  }

  const otp = crypto.randomInt(100000, 999999).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000;

  req.session.resetOtp = otp;
  req.session.resetEmail = normalizedEmail;
  req.session.resetExpires = expiresAt;

  await sendOtpEmail(normalizedEmail, otp, 'Reset your Digilocker password');
  res.redirect('/auth/verify-reset-otp');
}

// GET : /auth/verify-reset-otp
export const getVerifyResetOtp = (req, res) => {
  res.render('verify-reset-otp', { error: null });
};

// POST : /auth/verify-reset-otp
export async function postVerifyResetOtp(req, res) {
  const { otp } = req.body;
  const { resetOtp, resetEmail, resetExpires } = req.session;

  if (!resetOtp || !resetEmail || Date.now() > resetExpires) {
    req.session.resetOtp = null;
    req.session.resetEmail = null;
    return res.render('verify-reset-otp', { error: 'OTP expired. Please try again.' });
  }

  if (otp !== resetOtp) {
    return res.render('verify-reset-otp', { error: 'Invalid OTP. Please try again.' });
  }

  res.render('reset-password', { email: resetEmail });
}

// GET : /auth/reset-password
export async function getResetPassword(req, res) {
  const error = req.flash('error');
  const email = req.session.resetEmail;
  if (!email) return res.redirect('/auth/forgot-password');
  res.render('reset-password', { email, error });
}

// POST : /auth/reset-password
export async function postResetPassword(req, res) {
  const { email, newPassword } = req.body;

  const [rows] = await db.execute('SELECT password FROM users WHERE email = ?', [email]);
  if (rows.length === 0) {
    req.flash('error', 'User not found.');
    return res.redirect('/auth/forgot-password');
  }

  const currentHashedPassword = rows[0].password;
  const isSame = await bcrypt.compare(newPassword, currentHashedPassword);
  if (isSame) {
    req.flash('error', 'New password cannot be the same as the old password.');
    return res.redirect('/auth/reset-password');
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  await db.execute('UPDATE users SET password = ? WHERE email = ?', [hashed, email]);

  req.session.resetOtp = null;
  req.session.resetEmail = null;
  req.session.resetExpires = null;

  req.flash('success', 'Password updated successfully. You can now log in.');
  res.redirect('/auth/login');
}

// Export all
const authController = {
  getSignup,
  postSignup,
  getVerifyOtp,
  postVerifyOtp,
  resendOtp,
  getLogin,
  postLogin,
  postLogout,
  getForgotPassword,
  postForgotPassword,
  getVerifyResetOtp,
  postVerifyResetOtp,
  getResetPassword,
  postResetPassword
};

export default authController;
