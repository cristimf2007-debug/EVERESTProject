const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

function hashPassword(p) {
  return bcrypt.hashSync(p, 10);
}

function verifyPassword(p, h) {
  try { return bcrypt.compareSync(p, h); } catch { return false; }
}

function createToken(userId, email) {
  const payload = { sub: userId, email, type: 'access',
    exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60 };
  return jwt.sign(payload, JWT_SECRET, { algorithm: 'HS256' });
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
}

module.exports = { hashPassword, verifyPassword, createToken, verifyToken };
