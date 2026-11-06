const prisma = require('../lib/prisma');

async function search(req, res) {
  const { q } = req.query;
  if (!q) return res.json({ tracks: [], videos: [] });

  const [tracks, videos] = await Promise.all([
    prisma.track.findMany({
      where: { OR: [{ title: { contains: q } }, { artist: { contains: q } }, { genre: { contains: q } }] },
      take: 20,
    }),
    prisma.video.findMany({
      where: { OR: [{ title: { contains: q } }, { description: { contains: q } }] },
      take: 20,
    }),
  ]);
  return res.json({ tracks, videos });
}

module.exports = { search };
