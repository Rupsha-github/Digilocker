import express from 'express';
import authController from '../controllers/auth.js';
import { requirePendingUser } from '../middlewares/requirePendingUser.js';

const router = express.Router();

// Signup form
router.get('/signup', (req, res) => {
  res.render('signup', {
    emailError: null,
    passwordError: null,
    formData: {},
    wasValidated: false
  });
});

// Signup logic
router.post('/signup', authController.signup);

// OTP verification form
router.get('/verify-otp', requirePendingUser, authController.getVerifyOtp);

// OTP verification logic
router.post('/verify-otp', requirePendingUser, authController.postVerifyOtp);

// Resend OTP
router.post('/resend-otp', requirePendingUser, authController.resendOtp);

export default router;