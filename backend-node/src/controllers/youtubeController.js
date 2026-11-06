async function youtubeStats(req, res) {
  return res.json({ subscribers: 0, views: 0, videos: 0 });
}

async function youtubeVideos(req, res) {
  return res.json([]);
}

module.exports = { youtubeStats, youtubeVideos };
