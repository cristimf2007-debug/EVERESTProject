const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

const JWT_SECRET = process.env.JWT_SECRET;

async function requireAdmin(req, res, next) {
  try {
    let token = req.cookies && req.cookies.access_token;
    if (!token) {
      const auth = req.headers.authorization || '';
      if (auth.startsWith('Bearer ')) token = auth.slice(7);
    }
    if (!token) return res.status(401).json({ detail: 'Neautentificat' });

    const payload = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    if (payload.type !== 'access') return res.status(401).json({ detail: 'Token invalid' });
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) return res.status(401).json({ detail: 'Utilizator inexistent' });
    if (user.role !== 'admin') return res.status(403).json({ detail: 'Acces interzis — doar administratori' });

    req.user = { id: user.id, email: user.email, role: user.role };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return res.status(401).json({ detail: 'Token expirat' });
    return res.status(401).json({ detail: 'Token invalid' });
  }
}

async function requireAdminOptional(req, res, next) {
  try {
    let token = req.cookies && req.cookies.access_token;
    if (!token) {
      const auth = req.headers.authorization || '';
      if (auth.startsWith('Bearer ')) token = auth.slice(7);
    }
    if (!token) return next();

    const payload = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    if (payload.type !== 'access') return next();
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.role !== 'admin') return next();
    req.user = { id: user.id, email: user.email, role: user.role };
    next();
  } catch {
    next();
  }
}

async function requireFan(req, res, next) {
  try {
    let token = req.cookies && req.cookies.access_token;
    if (!token) {
      const auth = req.headers.authorization || '';
      if (auth.startsWith('Bearer ')) token = auth.slice(7);
    }
    if (!token) return res.status(401).json({ detail: 'Neautentificat' });

    const payload = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    if (payload.type !== 'access') return res.status(401).json({ detail: 'Token invalid' });
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) return res.status(401).json({ detail: 'Utilizator inexistent' });
    if (user.role !== 'fan') return res.status(403).json({ detail: 'Acces interzis — doar fani' });
    if (user.is_banned) return res.status(403).json({ detail: 'Contul a fost suspendat' });

    req.user = { id: user.id, email: user.email, role: user.role };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return res.status(401).json({ detail: 'Token expirat' });
    return res.status(401).json({ detail: 'Token invalid' });
  }
}

module.exports = { requireAdmin, requireAdminOptional, requireFan };
