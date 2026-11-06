const prisma = require('../lib/prisma');

async function channelStats(req, res) {
  const subs = await prisma.channelSub.count();
  return res.json({ subscribers: subs });
}

async function channelStatus(req, res) {
  return res.json({ online: true, viewers: 0 });
}

async function subscribeChannel(req, res) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ detail: 'Neautentificat' });
  const { channel_id } = req.body;
  await prisma.channelSub.upsert({
    where: { user_id_channel_id: { user_id: userId, channel_id } },
    update: {},
    create: { user_id: userId, channel_id },
  });
  return res.json({ ok: true });
}

module.exports = { channelStats, channelStatus, subscribeChannel };
