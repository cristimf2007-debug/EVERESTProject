const express = require('express');
const router = express.Router();
const { trackVisit } = require('../controllers/visitController');

router.post('/', trackVisit);

module.exports = router;
