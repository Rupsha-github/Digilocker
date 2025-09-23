import express from 'express';
import authController from '../controllers/auth.js';
import { requirePendingUser } from '../middlewares/requirePendingUser.js';
import { isLoggedIn, requireAuth } from '../middlewares/authGuards.js';

const router = express.Router();

// SIGNUP ROUTES
router.route('/signup')
      .get(isLoggedIn, authController.getSignup)
      .post(isLoggedIn, authController.postSignup);

// VERIFY OTP ROUTES
router.route('/verify-otp')
      .get(requirePendingUser, authController.getVerifyOtp)
      .post(requirePendingUser, authController.postVerifyOtp);

// POST : Resend OTP
router.post('/resend-otp', requirePendingUser, authController.resendOtp);

// LOGIN ROUTES
router.route('/login')
      .get(isLoggedIn, authController.getLogin)
      .post(isLoggedIn, authController.postLogin);

// LOGOUT ROUTE
router.post('/logout', requireAuth, authController.postLogout);

// FORGOT PASSWORD VIA OTP ROUTES
router.route('/forgot-password')
      .get(authController.getForgotPassword)
      .post(authController.postForgotPassword);
router.route('/verify-reset-otp')
      .get(authController.getVerifyResetOtp)
      .post(authController.postVerifyResetOtp);
router.post('/reset-password', authController.postResetPassword);


export default router;