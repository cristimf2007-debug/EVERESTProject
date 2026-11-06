const express = require('express');
const router = express.Router();
const { online } = require('../controllers/onlineController');

router.get('/', online);

module.exports = router;
