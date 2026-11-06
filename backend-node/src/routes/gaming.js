const express = require('express');
const router = express.Router();
const { gamingStatus, createGaming } = require('../controllers/gamingController');

router.get('/status', gamingStatus);
router.post('/', createGaming);

module.exports = router;
