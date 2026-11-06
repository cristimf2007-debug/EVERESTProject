const express = require('express');
const router = express.Router();
const { listReviews, createReview, deleteReview } = require('../controllers/reviewsController');
const { requireAdmin } = require('../middleware/auth');

router.get('/', listReviews);
router.post('/', createReview);
router.delete('/admin/:review_id', requireAdmin, deleteReview);

module.exports = router;
