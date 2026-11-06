const express = require('express');
const router = express.Router();
const { signMedia } = require('../controllers/mediaController');

router.get('/sign', signMedia);

module.exports = router;
