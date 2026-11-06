const express = require('express');
const router = express.Router();
const { channelStats, channelStatus, subscribeChannel } = require('../controllers/channelController');

router.get('/stats', channelStats);
router.get('/status', channelStatus);
router.post('/subscribe', subscribeChannel);

module.exports = router;
