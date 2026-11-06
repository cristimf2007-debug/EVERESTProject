const prisma = require('../lib/prisma');
const { hashPassword } = require('../lib/auth');

async function register(req, res) {
  const { email, password, name } = req.body || {};
  if (
    typeof email !== 'string' || email.length > 254 ||
    typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password) > 72 ||
    (name != null && (typeof name !== 'string' || name.length > 60))
  ) return res.status(400).json({ detail: 'Email, parolă sau nume invalid' });

  const normalizedEmail = email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalizedEmail)) {
    return res.status(400).json({ detail: 'Adresa de email nu pare validă' });
  }
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) return res.status(400).json({ detail: 'Email deja înregistrat' });

  const user = await prisma.user.create({
    data: { email: normalizedEmail, password_hash: hashPassword(password), role: 'fan' },
    select: { id: true, email: true, role: true },
  });
  return res.json(user);
}

async function fanLogin(req, res) {
  const { email, password } = req.body || {};
  if (typeof email !== 'string' || email.length > 254 || typeof password !== 'string' || Buffer.byteLength(password) > 72) {
    return res.status(400).json({ detail: 'Email sau parolă invalidă' });
  }
  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user || user.role !== 'fan' || !user.password_hash) return res.status(401).json({ detail: 'Email sau parolă greșită' });
  if (user.is_banned) return res.status(403).json({ detail: 'Contul a fost suspendat' });

  const bcrypt = require('bcryptjs');
  if (!bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ detail: 'Email sau parolă greșită' });
  }

  const { createToken } = require('../lib/auth');
  const token = createToken(user.id, user.email);

  res.cookie('access_token', token, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict', maxAge: 86400 * 1000, path: '/',
  });
  return res.json({ token, user: { email: user.email, role: user.role } });
}

async function fanLogout(req, res) {
  res.clearCookie('access_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });
  return res.json({ ok: true });
}

async function getMeFan(req, res) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ detail: 'Neautentificat' });
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true, avatar_url: true, banner_url: true, bio: true },
  });
  if (!user) return res.status(404).json({ detail: 'Utilizator inexistent' });
  return res.json(user);
}

async function updateMeFan(req, res) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ detail: 'Neautentificat' });
  const { bio, avatar_url, banner_url } = req.body;
  const user = await prisma.user.update({
    where: { id: userId },
    data: { bio, avatar_url, banner_url },
    select: { id: true, email: true, role: true, avatar_url: true, banner_url: true, bio: true },
  });
  return res.json(user);
}

async function listFavorites(req, res) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ detail: 'Neautentificat' });
  const favorites = await prisma.fanFavorite.findMany({
    where: { user_id: userId },
    include: { track: true },
    orderBy: { created_at: 'desc' },
  });
  return res.json(favorites);
}

async function addFavorite(req, res) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ detail: 'Neautentificat' });
  const { track_id } = req.params;
  const fav = await prisma.fanFavorite.upsert({
    where: { user_id_track_id: { user_id: userId, track_id } },
    update: {},
    create: { user_id: userId, track_id },
  });
  return res.json(fav);
}

async function removeFavorite(req, res) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ detail: 'Neautentificat' });
  await prisma.fanFavorite.delete({ where: { user_id_track_id: { user_id: userId, track_id: req.params.track_id } } });
  return res.json({ ok: true });
}

async function followUser(req, res) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ detail: 'Neautentificat' });
  const { following_id } = req.body;
  const follow = await prisma.follow.create({
    data: { follower_id: userId, following_id },
  });
  return res.json(follow);
}

async function getFollowStatus(req, res) {
  const userId = req.user?.id;
  const { following_id } = req.query;
  const follow = await prisma.follow.findUnique({
    where: { follower_id_following_id: { follower_id: userId, following_id } },
  });
  return res.json({ following: !!follow });
}

module.exports = {
  register, fanLogin, fanLogout, getMeFan, updateMeFan,
  listFavorites, addFavorite, removeFavorite, followUser, getFollowStatus,
};
