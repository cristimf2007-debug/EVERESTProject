const express = require('express');
const router = express.Router();
const { listTrackComments, createTrackComment, deleteTrackComment } = require('../controllers/commentsController');
const { requireAdmin } = require('../middleware/auth');

router.get('/tracks/:track_id/comments', listTrackComments);
router.post('/tracks/:track_id/comments', createTrackComment);
router.delete('/admin/comments/:comment_id', requireAdmin, deleteTrackComment);

module.exports = router;
