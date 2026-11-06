const express = require('express');
const router = express.Router();
const { youtubeStats, youtubeVideos } = require('../controllers/youtubeController');

router.get('/stats', youtubeStats);
router.get('/videos', youtubeVideos);

module.exports = router;
