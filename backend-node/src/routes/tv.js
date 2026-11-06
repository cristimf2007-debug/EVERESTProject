const express = require('express');
const router = express.Router();
const { tvSchedule, createTvSchedule, deleteTvSchedule } = require('../controllers/tvController');
const { requireAdmin } = require('../middleware/auth');

router.get('/schedule', tvSchedule);
router.post('/schedule', requireAdmin, createTvSchedule);
router.delete('/schedule/:entry_id', requireAdmin, deleteTvSchedule);

module.exports = router;
