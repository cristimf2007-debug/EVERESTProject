const { getObject } = require('../lib/storage');

async function serveFile(req, res) {
  const { path } = req.params;
  try {
    const { data, contentType } = await getObject(path);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Accept-Ranges', 'bytes');
    return res.send(data);
  } catch (err) {
    return res.status(404).json({ detail: 'Fișierul nu a fost găsit' });
  }
}

module.exports = { serveFile };
