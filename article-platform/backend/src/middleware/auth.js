const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const authenticateAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const verifyPassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

const hashPassword = async (password) => {
  return bcrypt.hash(password, 10);
};

const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });
};

module.exports = {
  authenticateAdmin,
  verifyPassword,
  hashPassword,
  generateToken
};