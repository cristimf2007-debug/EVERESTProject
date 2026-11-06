const prisma = require('../lib/prisma');

async function listChat(req, res) {
  const messages = await prisma.chat.findMany({
    orderBy: { created_at: 'asc' },
    take: 100,
  });
  return res.json(messages);
}

async function createChat(req, res) {
  const { username, message, user_id } = req.body || {};
  if (typeof message !== 'string' || !message.trim() || message.length > 1000) {
    return res.status(400).json({ detail: 'Mesajul trebuie să conțină între 1 și 1000 de caractere' });
  }
  if (username != null && (typeof username !== 'string' || username.length > 40)) {
    return res.status(400).json({ detail: 'Numele de utilizator poate avea cel mult 40 de caractere' });
  }
  const msg = await prisma.chat.create({
    data: { username: username?.trim() || 'Anonim', message: message.trim(), user_id: null },
  });
  return res.json(msg);
}

async function deleteChat(req, res) {
  await prisma.chat.delete({ where: { id: req.params.mid } });
  return res.json({ ok: true });
}

module.exports = { listChat, createChat, deleteChat };
