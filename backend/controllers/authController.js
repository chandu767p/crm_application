const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const User = require('../models/User');
const { logActivity } = require('../utils/activityLogger');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

const sendToken = (user, statusCode, res, extra = {}) => {
  const token = signToken(user._id);
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      active: user.active,
      mustChangePassword: user.mustChangePassword,
      twoFactorEnabled: user.twoFactorEnabled,
      preferences: user.preferences,
    },
    ...extra,
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }
    const user = await User.create({ name, email, password, role, mustChangePassword: true });
    await user.populate('role');

    // Log registration
    await logActivity({ ...req, user: { id: user._id } }, user._id, 'User', 'created', {
      subject: 'New User Registered',
      description: `User ${user.name} registered and created an account.`
    });

    sendToken(user, 201, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }
    const user = await User.findOne({ email }).select('+password +twoFactorSecret').populate('role');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    if (!user.active) {
      return res.status(401).json({ success: false, message: 'Account is deactivated' });
    }

    // If 2FA is enabled, return a partial token for 2FA step
    if (user.twoFactorEnabled) {
      const tempToken = jwt.sign({ id: user._id, twoFactorPending: true }, process.env.JWT_SECRET, { expiresIn: '5m' });
      return res.status(200).json({
        success: true,
        twoFactorRequired: true,
        tempToken,
        message: 'Enter your 2FA code to continue',
      });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Log Activity
    await logActivity({ ...req, user: { id: user._id } }, user._id, 'User', 'login', {
      subject: 'User Login',
      description: `User ${user.name} logged in successfully.`
    });

    sendToken(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('role');
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// @desc    Update password
// @route   PUT /api/auth/update-password
// @access  Private
exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password').populate('role');
    if (!(await user.matchPassword(currentPassword))) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }
    user.password = newPassword;
    user.mustChangePassword = false;
    await user.save();
    sendToken(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Force change password (first-login)
// @route   PUT /api/auth/force-change-password
// @access  Private
exports.forceChangePassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }
    const user = await User.findById(req.user.id).populate('role');
    user.password = newPassword;
    user.mustChangePassword = false;
    await user.save();
    sendToken(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Forgot password - send reset email
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      // Return success regardless to prevent email enumeration
      return res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
    }
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    try {
      await sendPasswordResetEmail(user.email, resetUrl, user.name);
    } catch (emailErr) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({ success: false, message: 'Email could not be sent. Check email configuration.' });
    }

    res.json({ success: true, message: 'Password reset email sent.' });
  } catch (err) {
    next(err);
  }
};

// @desc    Reset password via token
// @route   POST /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    }).populate('role');

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token.' });
    }

    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.mustChangePassword = false;
    await user.save();
    sendToken(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Setup 2FA - generate secret and QR code
// @route   POST /api/auth/2fa/setup
// @access  Private
exports.setup2FA = async (req, res, next) => {
  try {
    const secret = speakeasy.generateSecret({
      name: `Do Systems CRM (${req.user.email})`,
      length: 20,
    });

    // Store secret temporarily (not yet enabled)
    await User.findByIdAndUpdate(req.user.id, { twoFactorSecret: secret.base32 });

    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
    res.json({
      success: true,
      secret: secret.base32,
      qrCode: qrCodeUrl,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Verify and enable 2FA
// @route   POST /api/auth/2fa/verify
// @access  Private
exports.verify2FA = async (req, res, next) => {
  try {
    const { token } = req.body;
    const user = await User.findById(req.user.id).select('+twoFactorSecret');
    if (!user.twoFactorSecret) {
      return res.status(400).json({ success: false, message: 'No 2FA setup in progress. Run setup first.' });
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 1,
    });

    if (!verified) {
      return res.status(400).json({ success: false, message: 'Invalid 2FA code. Please try again.' });
    }

    user.twoFactorEnabled = true;
    await user.save({ validateBeforeSave: false });
    res.json({ success: true, message: '2FA has been enabled successfully.' });
  } catch (err) {
    next(err);
  }
};

// @desc    Disable 2FA
// @route   POST /api/auth/2fa/disable
// @access  Private
exports.disable2FA = async (req, res, next) => {
  try {
    const { token } = req.body;
    const user = await User.findById(req.user.id).select('+twoFactorSecret');
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 1,
    });
    if (!verified) {
      return res.status(400).json({ success: false, message: 'Invalid 2FA code.' });
    }
    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    await user.save({ validateBeforeSave: false });
    res.json({ success: true, message: '2FA has been disabled.' });
  } catch (err) {
    next(err);
  }
};

// @desc    Validate 2FA code during login
// @route   POST /api/auth/2fa/login
// @access  Public (with temp token)
exports.login2FA = async (req, res, next) => {
  try {
    const { tempToken, token } = req.body;
    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid or expired session. Please log in again.' });
    }
    if (!decoded.twoFactorPending) {
      return res.status(400).json({ success: false, message: 'Invalid 2FA session.' });
    }

    const user = await User.findById(decoded.id).select('+twoFactorSecret').populate('role');
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 1,
    });

    if (!verified) {
      return res.status(400).json({ success: false, message: 'Invalid 2FA code. Please try again.' });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Log Activity
    await logActivity({ ...req, user: { id: user._id } }, user._id, 'User', 'login', {
      subject: 'User Login (2FA)',
      description: `User ${user.name} logged in successfully via 2FA.`
    });

    sendToken(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Update user preferences (theme/language)
// @route   PUT /api/auth/preferences
// @access  Private
exports.updatePreferences = async (req, res, next) => {
  try {
    const { theme, language } = req.body;
    const update = {};
    if (theme) update['preferences.theme'] = theme;
    if (language) update['preferences.language'] = language;
    const user = await User.findByIdAndUpdate(req.user.id, update, { new: true }).populate('role');
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};
