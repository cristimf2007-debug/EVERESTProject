const express = require('express');
const multer = require('multer');
const router = express.Router();
const { listTracks, getTrack, createTrack, updateTrack, deleteTrack, playTrack, likeTrack } = require('../controllers/tracksController');
const { requireAdmin } = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

router.get('/', listTracks);
router.get('/:track_id', getTrack);
router.get('/:track_id/play', playTrack);
router.post('/:track_id/like', likeTrack);
router.post('/', requireAdmin, upload.fields([{ name: 'audio', maxCount: 1 }, { name: 'cover', maxCount: 1 }]), createTrack);
router.patch('/:track_id', requireAdmin, updateTrack);
router.delete('/:track_id', requireAdmin, deleteTrack);

module.exports = router;
