const prisma = require('../lib/prisma');

async function listVideos(req, res) {
  const videos = await prisma.video.findMany({ orderBy: { created_at: 'desc' } });
  return res.json(videos);
}

async function createVideo(req, res) {
  const { title, description, video_url, cover_url } = req.body;
  const video = await prisma.video.create({ data: { title, description, video_url, cover_url } });
  return res.json(video);
}

async function deleteVideo(req, res) {
  await prisma.video.delete({ where: { id: req.params.video_id } });
  return res.json({ ok: true });
}

async function listVideoComments(req, res) {
  const comments = await prisma.videoComment.findMany({
    where: { video_id: req.params.video_id },
    orderBy: [{ is_pinned: 'desc' }, { created_at: 'desc' }],
    include: { user: { select: { id: true, email: true } } },
  });
  return res.json(comments);
}

async function createVideoComment(req, res) {
  const { content, user_id } = req.body;
  const comment = await prisma.videoComment.create({
    data: { video_id: req.params.video_id, user_id: user_id || null, content },
    include: { user: { select: { id: true, email: true } } },
  });
  return res.json(comment);
}

async function likeVideo(req, res) {
  const { user_id } = req.body;
  await prisma.videoLike.upsert({
    where: { video_id_user_id: { video_id: req.params.video_id, user_id } },
    update: {},
    create: { video_id: req.params.video_id, user_id },
  });
  await prisma.video.update({ where: { id: req.params.video_id }, data: { likes: { increment: 1 } } });
  return res.json({ ok: true });
}

async function viewVideo(req, res) {
  await prisma.video.update({ where: { id: req.params.video_id }, data: { views: { increment: 1 } } });
  return res.json({ ok: true });
}

async function pinVideoComment(req, res) {
  await prisma.videoComment.update({
    where: { id: req.params.comment_id },
    data: { is_pinned: true },
  });
  return res.json({ ok: true });
}

module.exports = {
  listVideos, createVideo, deleteVideo, listVideoComments, createVideoComment,
  likeVideo, viewVideo, pinVideoComment,
};
