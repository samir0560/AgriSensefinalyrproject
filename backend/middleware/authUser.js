const jwt = require('jsonwebtoken');

const getSecret = () => process.env.JWT_SECRET || 'fallback_secret_key';

const protectUser = (req, res, next) => {
  const h = req.headers.authorization;
  if (!h || !h.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
  try {
    const decoded = jwt.verify(h.split(' ')[1], getSecret());
    if (!decoded.userId) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }
    req.userId = decoded.userId;
    next();
  } catch (e) {
    return res.status(401).json({ success: false, message: 'Not authorized, invalid token' });
  }
};

const optionalUser = (req, res, next) => {
  const h = req.headers.authorization;
  if (!h || !h.startsWith('Bearer ')) return next();
  try {
    const decoded = jwt.verify(h.split(' ')[1], getSecret());
    if (decoded.userId) req.userId = decoded.userId;
  } catch (e) {
    /* anonymous chat */
  }
  next();
};

module.exports = { protectUser, optionalUser };
