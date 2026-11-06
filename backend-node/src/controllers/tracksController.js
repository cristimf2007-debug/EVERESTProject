const prisma = require('../lib/prisma');
const { putObject } = require('../lib/storage');
const { v4: uuidv4 } = require('uuid');

async function listTracks(req, res) {
  const tracks = await prisma.track.findMany({
    orderBy: { created_at: 'desc' },
    select: {
      id: true, title: true, artist: true, genre: true, tags: true, lyrics: true,
      audio_url: true, cover_url: true, download_enabled: true, plays: true,
      likes: true, duration: true, created_at: true,
    },
  });
  return res.json(tracks);
}

async function getTrack(req, res) {
  const track = await prisma.track.findUnique({ where: { id: req.params.track_id } });
  if (!track) return res.status(404).json({ detail: 'Piesa nu a fost găsită' });
  return res.json(track);
}

async function createTrack(req, res) {
  const title = req.body.title;
  const playlist = req.body.playlist || '';
  const audioFile = req.file;
  const coverFile = req.files && req.files.cover;

  if (!title) return res.status(400).json({ detail: 'Titlul piesei este necesar' });
  if (!audioFile) return res.status(400).json({ detail: 'Fișierul audio este necesar' });

  let audioUrl = '';
  try {
    const path = `bioxic/uploads/audio/${uuidv4()}.${audioFile.originalname.split('.').pop()}`;
    const result = await putObject(path, audioFile.buffer, audioFile.mimetype);
    audioUrl = `/api/files/${result.path}`;
    await prisma.file.create({
      data: {
        storage_path: result.path,
        serve_url: audioUrl,
        original_filename: audioFile.originalname,
        content_type: audioFile.mimetype,
        size: audioFile.size,
      },
    });
  } catch (err) {
    console.error('Seed audio upload failed:', err);
  }

  let coverUrl = '';
  if (coverFile) {
    try {
      const path = `bioxic/uploads/cover/${uuidv4()}.${coverFile.originalname.split('.').pop()}`;
      const result = await putObject(path, coverFile.buffer, coverFile.mimetype);
      coverUrl = `/api/files/${result.path}`;
    } catch (err) {
      console.error('Cover upload failed:', err);
    }
  }

  const track = await prisma.track.create({
    data: {
      title, artist: 'BIOXIC', genre: playlist || 'remix',
      audio_url: audioUrl, cover_url: coverUrl,
      download_enabled: true, plays: 0, likes: 0, duration: 0,
    },
  });
  return res.json(track);
}

async function updateTrack(req, res) {
  const { title, genre, download_enabled, lyrics } = req.body;
  const track = await prisma.track.update({
    where: { id: req.params.track_id },
    data: { title, genre, download_enabled: download_enabled === 'true', lyrics },
  });
  return res.json(track);
}

async function deleteTrack(req, res) {
  await prisma.track.delete({ where: { id: req.params.track_id } });
  return res.json({ ok: true });
}

async function playTrack(req, res) {
  await prisma.track.update({
    where: { id: req.params.track_id },
    data: { plays: { increment: 1 } },
  });
  return res.json({ ok: true });
}

async function likeTrack(req, res) {
  await prisma.track.update({
    where: { id: req.params.track_id },
    data: { likes: { increment: 1 } },
  });
  return res.json({ ok: true });
}

module.exports = {
  listTracks, getTrack, createTrack, updateTrack, deleteTrack, playTrack, likeTrack,
};
