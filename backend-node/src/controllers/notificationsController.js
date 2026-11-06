const prisma = require('../lib/prisma');

async function listNotifications(req, res) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ detail: 'Neautentificat' });
  const notifications = await prisma.notification.findMany({
    where: { user_id: userId },
    orderBy: { created_at: 'desc' },
  });
  return res.json(notifications);
}

async function markRead(req, res) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ detail: 'Neautentificat' });
  await prisma.notification.updateMany({ where: { user_id: userId }, data: { is_read: true } });
  return res.json({ ok: true });
}

module.exports = { listNotifications, markRead };
