const prisma = require('../lib/prisma');

async function liveStatus(req, res) {
  const live = await prisma.live.findFirst();
  if (!live) {
    const created = await prisma.live.create({
      data: { is_live: false, listeners: 0, updated_at: new Date() },
    });
    return res.json(created);
  }
  return res.json(live);
}

async function liveSchedule(req, res) {
  const schedule = await prisma.liveSchedule.findMany({
    orderBy: { start_time: 'asc' },
    include: { track: true },
  });
  return res.json(schedule);
}

async function createLiveSchedule(req, res) {
  const { title, description, start_time, end_time, track_id } = req.body;
  const entry = await prisma.liveSchedule.create({
    data: { title, description, start_time: new Date(start_time), end_time: new Date(end_time), track_id },
    include: { track: true },
  });
  return res.json(entry);
}

async function deleteLiveSchedule(req, res) {
  await prisma.liveSchedule.delete({ where: { id: req.params.sid } });
  return res.json({ ok: true });
}

async function createSongRequest(req, res) {
  const { track_id, user_name } = req.body;
  const request = await prisma.songRequest.create({
    data: { track_id, user_name: user_name || 'Anonim' },
    include: { track: true },
  });
  return res.json(request);
}

async function listSongRequests(req, res) {
  const requests = await prisma.songRequest.findMany({
    orderBy: { requested_at: 'desc' },
    include: { track: true },
  });
  return res.json(requests);
}

async function deleteSongRequest(req, res) {
  await prisma.songRequest.delete({ where: { id: req.params.rid } });
  return res.json({ ok: true });
}

module.exports = {
  liveStatus, liveSchedule, createLiveSchedule, deleteLiveSchedule,
  createSongRequest, listSongRequests, deleteSongRequest,
};
