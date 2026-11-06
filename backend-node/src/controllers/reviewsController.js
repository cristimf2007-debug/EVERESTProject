const prisma = require('../lib/prisma');

async function listReviews(req, res) {
  const reviews = await prisma.review.findMany({
    where: { is_approved: true },
    orderBy: { created_at: 'desc' },
    include: { user: { select: { id: true, email: true, avatar_url: true } } },
  });
  return res.json(reviews);
}

async function createReview(req, res) {
  const { name, rating, comment, user_id } = req.body;
  const review = await prisma.review.create({
    data: { name: name || 'Anonim', rating: rating || 5, comment: comment || null, user_id: user_id || null },
    include: { user: { select: { id: true, email: true, avatar_url: true } } },
  });
  return res.json(review);
}

async function deleteReview(req, res) {
  await prisma.review.delete({ where: { id: req.params.review_id } });
  return res.json({ ok: true });
}

module.exports = { listReviews, createReview, deleteReview };
