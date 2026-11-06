async function getShare(req, res) {
  const { slug } = req.params;
  return res.json({ slug, title: 'BIOXIC Share', url: `/share/${slug}` });
}

module.exports = { getShare };
