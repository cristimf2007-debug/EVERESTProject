const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { listChat, createChat, deleteChat } = require('../controllers/chatController');
const { requireAdmin } = require('../middleware/auth');

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { detail: 'Prea multe mesaje. Reîncearcă mai târziu.' },
});

router.get('/', listChat);
router.post('/', chatLimiter, createChat);
router.delete('/:mid', requireAdmin, deleteChat);

module.exports = router;
