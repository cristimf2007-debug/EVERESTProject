const prisma = require('../lib/prisma');

async function tvSchedule(req, res) {
  const schedule = await prisma.tvSchedule.findMany({ orderBy: [{ day_of_week: 'asc' }, { time: 'asc' }] });
  return res.json(schedule);
}

async function createTvSchedule(req, res) {
  const { day_of_week, time, title, description } = req.body;
  const entry = await prisma.tvSchedule.create({ data: { day_of_week, time, title, description } });
  return res.json(entry);
}

async function deleteTvSchedule(req, res) {
  await prisma.tvSchedule.delete({ where: { id: req.params.entry_id } });
  return res.json({ ok: true });
}

module.exports = { tvSchedule, createTvSchedule, deleteTvSchedule };
