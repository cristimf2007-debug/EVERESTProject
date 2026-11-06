const prisma = require('../lib/prisma');

async function radioNow(req, res) {
  let radio = await prisma.radio.findFirst();
  if (!radio) {
    radio = await prisma.radio.create({
      data: { is_playing: false, position: 0, duration: 0, queue: [], updated_at: new Date() },
    });
  }

  let currentTrack = null;
  if (radio.current_track_id) {
    currentTrack = await prisma.track.findUnique({ where: { id: radio.current_track_id } });
  }

  const listeners = await prisma.radioListener.count();
  const queue = radio.queue || [];

  return res.json({
    live: radio.is_playing,
    track: currentTrack,
    duration: radio.duration,
    position: radio.position,
    queue,
    server_time: new Date().toISOString(),
    listeners,
  });
}

async function radioHeartbeat(req, res) {
  const { sid } = req.body || {};
  if (!sid) return res.status(400).json({ detail: 'sid este necesar' });

  await prisma.radioListener.upsert({
    where: { sid },
    update: {},
    create: { sid },
  });

  return res.json({ ok: true });
}

module.exports = { radioNow, radioHeartbeat };
