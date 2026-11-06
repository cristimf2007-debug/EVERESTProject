const express = require('express');
const router = express.Router();
const { liveStatus, liveSchedule, createLiveSchedule, deleteLiveSchedule, createSongRequest, listSongRequests, deleteSongRequest } = require('../controllers/liveController');
const { requireAdmin } = require('../middleware/auth');

router.get('/status', liveStatus);
router.get('/schedule', liveSchedule);
router.post('/schedule', requireAdmin, createLiveSchedule);
router.delete('/schedule/:sid', requireAdmin, deleteLiveSchedule);
router.post('/requests', createSongRequest);
router.get('/requests', listSongRequests);
router.delete('/requests/:rid', requireAdmin, deleteSongRequest);

module.exports = router;
