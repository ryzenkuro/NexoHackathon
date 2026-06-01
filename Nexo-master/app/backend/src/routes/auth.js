import { Router } from 'express';
import {
  registerUser,
  sendOTP,
  verifyRegisterOTP,
  loginUser,
  sendForgotPasswordOTP,
  verifyForgotPasswordOTP,
  resetPassword,
  logout,
} from '../controllers/authController.js';

const router = Router();

// Register flow
router.post('/register', registerUser);
router.post('/register/verify', verifyRegisterOTP);
router.post('/otp/send', sendOTP);

// Login
router.post('/login', loginUser);

// Forgot password flow
router.post('/forgot-password', sendForgotPasswordOTP);
router.post('/forgot-password/verify', verifyForgotPasswordOTP);
router.post('/reset-password', resetPassword);

// Logout
router.post('/logout', logout);

export default router;
