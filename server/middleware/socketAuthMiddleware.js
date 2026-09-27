const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = require('./authMiddleware');

/**
 * Socket.IO Authentication Middleware
 * Verifies JWT from handshake.auth.token and attaches user to socket.
 * Joins the socket to the student's personal isolated room: student:<userId>
 */
const socketAuthMiddleware = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('SOCKET_AUTH_REQUIRED: No token provided'));
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return next(new Error('SOCKET_AUTH_FAILED: User not found'));
    }

    if (!user.isActive) {
      return next(new Error('SOCKET_AUTH_FAILED: Account is deactivated'));
    }

    // Attach verified user to socket
    socket.user = user;
    socket.userId = user._id.toString();
    socket.userRole = user.role;

    // Join the user's personal isolated room immediately
    // Students receive access events via their room: student:<userId>
    if (user.role === 'student') {
      socket.join(`student:${user._id.toString()}`);
    }

    // Invigilators join their own room for future broadcast needs
    if (user.role === 'invigilator') {
      socket.join(`invigilator:${user._id.toString()}`);
    }

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new Error('SOCKET_AUTH_FAILED: Token expired'));
    }
    if (err.name === 'JsonWebTokenError') {
      return next(new Error('SOCKET_AUTH_FAILED: Invalid token'));
    }
    console.error('[Socket Auth Error]', err.message);
    return next(new Error('SOCKET_AUTH_FAILED: Authentication error'));
  }
};

module.exports = socketAuthMiddleware;
