const prisma = require('../lib/prisma');

async function listTrackComments(req, res) {
  const comments = await prisma.comment.findMany({
    where: { track_id: req.params.track_id },
    orderBy: { created_at: 'desc' },
    include: { user: { select: { id: true, email: true, avatar_url: true } } },
  });
  return res.json(comments);
}

async function createTrackComment(req, res) {
  const { content, user_id } = req.body;
  if (!content) return res.status(400).json({ detail: 'Conținutul este necesar' });
  const comment = await prisma.comment.create({
    data: { track_id: req.params.track_id, user_id: user_id || null, content },
    include: { user: { select: { id: true, email: true, avatar_url: true } } },
  });
  return res.json(comment);
}

async function deleteTrackComment(req, res) {
  await prisma.comment.delete({ where: { id: req.params.comment_id } });
  return res.json({ ok: true });
}

module.exports = { listTrackComments, createTrackComment, deleteTrackComment };
