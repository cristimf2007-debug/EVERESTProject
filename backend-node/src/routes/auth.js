const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { login, me, logout } = require('../controllers/authController');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { detail: 'Prea multe încercări de autentificare. Reîncearcă mai târziu.' },
});

router.post('/login', loginLimiter, login);
router.get('/me', me);
router.post('/logout', logout);

module.exports = router;
