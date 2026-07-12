const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  // Try to retrieve token from HTTP-only cookie first, then fallback to Authorization header
  let token = req.cookies?.token;

  if (!token) {
    const authHeader = req.headers['authorization'];
    token = authHeader && authHeader.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  const JWT_SECRET = process.env.JWT_SECRET || 'testsecret';
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied: insufficient privileges' });
    }
    next();
  };
};

module.exports = { authenticateToken, requireRole };
