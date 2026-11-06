const express = require('express');
const router = express.Router();
const { listNotifications, markRead } = require('../controllers/notificationsController');

router.get('/', listNotifications);
router.post('/read', markRead);

module.exports = router;
