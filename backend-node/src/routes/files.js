const express = require('express');
const router = express.Router();
const { serveFile } = require('../controllers/filesController');

router.get('/:path(.*)', serveFile);

module.exports = router;
