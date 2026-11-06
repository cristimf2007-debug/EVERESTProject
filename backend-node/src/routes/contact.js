const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { createContact } = require('../controllers/contactController');

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { detail: 'Prea multe mesaje. Reîncearcă peste o oră.' },
});

router.post('/', contactLimiter, createContact);

module.exports = router;
