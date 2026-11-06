async function signMedia(req, res) {
  const { u } = req.query;
  return res.json({ signed_url: u || '', token: 'signed' });
}

module.exports = { signMedia };
