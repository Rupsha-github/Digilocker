import express from 'express';
import authController from '../controllers/auth.js';
import { requirePendingUser } from '../middlewares/requirePendingUser.js';

const router = express.Router();

// GET : Signup form
router.get('/signup', (req, res) => {
  res.render('signup', {
    emailError: null,
    passwordError: null,
    formData: {},
    wasValidated: false
  });
});

// POST : Signup 
router.post('/signup', authController.signup);

// GET : OTP verification form
router.get('/verify-otp', requirePendingUser, authController.getVerifyOtp);

// POST : OTP verification 
router.post('/verify-otp', requirePendingUser, authController.postVerifyOtp);

// POST : Resend OTP
router.post('/resend-otp', requirePendingUser, authController.resendOtp);

// Login form
router.get('/login', (req, res) => {
  res.render('login', {
    formData: req.flash('formData')[0] || {}
  });
  console.log("Flash error received:", res.locals.errorMessage);
});

// Login logic
router.post('/login', authController.login);

export default router;