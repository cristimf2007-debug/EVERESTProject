const prisma = require('../lib/prisma');

async function trackVisit(req, res) {
  const { path } = req.body || {};
  if (!path) return res.status(400).json({ detail: 'Path este necesar' });

  await prisma.visit.upsert({
    where: { path },
    update: { count: { increment: 1 }, last_visit: new Date() },
    create: { path, count: 1 },
  });
  return res.json({ ok: true });
}

module.exports = { trackVisit };
