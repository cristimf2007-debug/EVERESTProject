const prisma = require('../lib/prisma');
const { hashPassword, verifyPassword, createToken } = require('../lib/auth');

async function login(req, res) {
  const { email, password } = req.body || {};
  if (
    typeof email !== 'string' || email.length > 254 ||
    typeof password !== 'string' || password.length < 1 || password.length > 1024
  ) return res.status(400).json({ detail: 'Email sau parolă invalidă' });

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user || !user.password_hash || !verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ detail: 'Email sau parolă greșită' });
  }

  const token = createToken(user.id, user.email);
  res.cookie('access_token', token, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict', maxAge: 86400 * 1000, path: '/',
  });

  return res.json({ token, user: { email: user.email, role: user.role } });
}

async function me(req, res) {
  try {
    let token = req.cookies && req.cookies.access_token;
    if (!token) {
      const auth = req.headers.authorization || '';
      if (auth.startsWith('Bearer ')) token = auth.slice(7);
    }
    if (!token) return res.json({ user: null });

    const payload = jwtVerify(token);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) return res.json({ user: null });
    return res.json({ email: user.email, role: user.role });
  } catch {
    return res.json({ user: null });
  }
}

async function logout(req, res) {
  res.clearCookie('access_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });
  return res.json({ ok: true });
}

async function ensureAdmin() {
  const configuredEmail = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!configuredEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(configuredEmail) ||
      !password || Buffer.byteLength(password) < 16 || Buffer.byteLength(password) > 72) {
    throw new Error('Set a valid ADMIN_EMAIL and a unique ADMIN_PASSWORD between 16 and 72 bytes');
  }
  const email = configuredEmail.toLowerCase().trim();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    await prisma.user.create({
      data: { email, password_hash: hashPassword(password), role: 'admin' },
    });
  } else if (existing.role !== 'admin') {
    throw new Error('ADMIN_EMAIL belongs to a non-admin account; resolve the account explicitly');
  } else if (!existing.password_hash || !verifyPassword(password, existing.password_hash)) {
    await prisma.user.update({ where: { email }, data: { password_hash: hashPassword(password) } });
  }
  return email;
}

function jwtVerify(token) {
  const jwt = require('jsonwebtoken');
  return jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
}

module.exports = { login, me, logout, ensureAdmin };
