const prisma = require('../lib/prisma');

async function listAdmins(req, res) {
  const admins = await prisma.user.findMany({
    where: { role: 'admin' },
    select: { id: true, email: true, role: true, created_at: true },
  });
  return res.json(admins);
}

async function createAdmin(req, res) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ detail: 'Email și parolă sunt necesare' });
  const { hashPassword } = require('../lib/auth');
  const admin = await prisma.user.create({
    data: { email, password_hash: hashPassword(password), role: 'admin' },
    select: { id: true, email: true, role: true },
  });
  return res.json(admin);
}

async function deleteAdmin(req, res) {
  const { email } = req.params;
  await prisma.user.delete({ where: { email } });
  return res.json({ ok: true });
}

async function listContacts(req, res) {
  const contacts = await prisma.contact.findMany({ orderBy: { created_at: 'desc' } });
  return res.json(contacts);
}

async function listAnnouncements(req, res) {
  const announcements = await prisma.announcement.findMany({
    where: { is_active: true },
    orderBy: { created_at: 'desc' },
  });
  return res.json(announcements);
}

async function createAnnouncement(req, res) {
  const { title, content } = req.body;
  const announcement = await prisma.announcement.create({ data: { title, content } });
  return res.json(announcement);
}

async function deleteAnnouncement(req, res) {
  await prisma.announcement.delete({ where: { id: req.params.aid } });
  return res.json({ ok: true });
}

async function getSiteContent(req, res) {
  const items = await prisma.siteContent.findMany();
  const obj = {};
  for (const item of items) obj[item.key] = item.value;
  return res.json(obj);
}

async function updateSiteContent(req, res) {
  const data = req.body;
  for (const [k, v] of Object.entries(data)) {
    await prisma.siteContent.upsert({
      where: { key: k },
      update: { value: String(v).slice(0, 5000) },
      create: { key: k, value: String(v).slice(0, 5000) },
    });
  }
  return res.json({ ok: true });
}

async function activityLog(req, res) {
  const logs = await prisma.activityLog.findMany({
    orderBy: { ts: 'desc' },
    take: 100,
  });
  return res.json(logs);
}

async function overviewPanel(req, res) {
  const [users, tracks, videos, reviews, contacts] = await Promise.all([
    prisma.user.count(),
    prisma.track.count(),
    prisma.video.count(),
    prisma.review.count(),
    prisma.contact.count(),
  ]);
  return res.json({ users, tracks, videos, reviews, contacts });
}

async function securityPanel(req, res) {
  const bans = await prisma.securityBan.findMany({ orderBy: { banned_at: 'desc' } });
  const events = await prisma.securityEvent.findMany({ orderBy: { created_at: 'desc' }, take: 50 });
  return res.json({ bans, events });
}

module.exports = {
  listAdmins, createAdmin, deleteAdmin, listContacts, listAnnouncements,
  createAnnouncement, deleteAnnouncement, getSiteContent, updateSiteContent,
  activityLog, overviewPanel, securityPanel,
};
