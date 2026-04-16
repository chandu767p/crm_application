const express = require('express');
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

module.exports = router;
