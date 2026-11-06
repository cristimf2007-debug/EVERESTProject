const express = require('express');
const router = express.Router();
const { radioNow, radioHeartbeat } = require('../controllers/radioController');

router.get('/now', radioNow);
router.post('/heartbeat', radioHeartbeat);

module.exports = router;
