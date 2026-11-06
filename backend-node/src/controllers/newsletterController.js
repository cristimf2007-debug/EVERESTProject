const prisma = require('../lib/prisma');

async function subscribe(req, res) {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ detail: 'Email este necesar' });

  await prisma.newsletter.upsert({
    where: { email },
    update: {},
    create: { email },
  });
  return res.json({ ok: true });
}

module.exports = { subscribe };
