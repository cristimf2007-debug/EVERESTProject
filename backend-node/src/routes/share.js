const express = require('express');
const router = express.Router();
const { getShare } = require('../controllers/shareController');

router.get('/:slug', getShare);

module.exports = router;
