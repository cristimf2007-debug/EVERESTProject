async function online(req, res) {
  return res.json({ online: true, listeners: 0 });
}

module.exports = { online };
