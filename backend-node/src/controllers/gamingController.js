const prisma = require('../lib/prisma');

async function gamingStatus(req, res) {
  return res.json({ online: false, players: 0 });
}

async function createGaming(req, res) {
  return res.json({ ok: true });
}

module.exports = { gamingStatus, createGaming };
