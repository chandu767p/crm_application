const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).populate('role');

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    if (!user.active) {
      return res.status(401).json({ success: false, message: 'Account is deactivated' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Not authorized, token invalid' });
  }
};

const authorize = (...permissions) => {
  return (req, res, next) => {
    if (!req.user.role || !req.user.role.permissions) {
      return res.status(403).json({
        success: false,
        message: `Role information missing or invalid.`,
      });
    }

    if (req.user.role.name === 'admin') {
      return next();
    }

    const hasPermission = permissions.some(p => req.user.role.permissions.includes(p));

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role.name}' is not authorized for this action. Required permission: ${permissions.join(' or ')}`,
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
