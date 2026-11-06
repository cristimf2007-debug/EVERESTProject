const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { register, fanLogin, fanLogout, getMeFan, updateMeFan } = require('../controllers/fanController');
const { listFavorites, addFavorite, removeFavorite } = require('../controllers/fanController');
const { followUser, getFollowStatus } = require('../controllers/fanController');
const { requireFan } = require('../middleware/auth');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { detail: 'Prea multe încercări de autentificare. Reîncearcă mai târziu.' },
});
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { detail: 'Prea multe conturi create. Reîncearcă mai târziu.' },
});

router.post('/register', registerLimiter, register);
router.post('/login', loginLimiter, fanLogin);
router.post('/logout', fanLogout);
router.get('/me', requireFan, getMeFan);
router.patch('/me', requireFan, updateMeFan);

router.get('/favorites', requireFan, listFavorites);
router.post('/favorites/:track_id', requireFan, addFavorite);
router.delete('/favorites/:track_id', requireFan, removeFavorite);

router.post('/follow', requireFan, followUser);
router.get('/follow/status', requireFan, getFollowStatus);

router.get('/:user_id/public', (req, res) => res.json({ user_id: req.params.user_id }));

module.exports = router;
