const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'smarttrack-secret-key';

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access denied' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      const error = new Error('Invalid token');
      error.status = 403;
      return next(error);
    }
    req.user = user;
    next();
  });
};

module.exports = {
  asyncHandler,
  authenticateToken
};
