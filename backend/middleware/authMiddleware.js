const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const { logPerformance } = require('../utils/performanceLogger');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      logPerformance('User authenticated');
      next();
    } catch (error) {
      logPerformance('Token authentication failed');
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    logPerformance('No token provided');
    res.status(401).json({ message: 'Not authorized, no token' });
  }
});

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      logPerformance('User role not authorized');
      return res.status(403).json({ message: `User role ${req.user.role} is not authorized to access this route` });
    }
    logPerformance('User role authorized');
    next();
  };
};

module.exports = { protect, authorize };
