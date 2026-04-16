const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updatePassword,
  forceChangePassword,
  forgotPassword,
  resetPassword,
  setup2FA,
  verify2FA,
  disable2FA,
  login2FA,
  updatePreferences,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/update-password', protect, updatePassword);
router.put('/force-change-password', protect, forceChangePassword);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.post('/2fa/setup', protect, setup2FA);
router.post('/2fa/verify', protect, verify2FA);
router.post('/2fa/disable', protect, disable2FA);
router.post('/2fa/login', login2FA);
router.put('/preferences', protect, updatePreferences);

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', passport.authenticate('google', { session: false }), (req, res) => {
  // Generate JWT token for social login
  const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });

  // Redirect to frontend with token
  const redirectUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/login?token=${token}`;
  res.redirect(redirectUrl);
});

module.exports = router;
