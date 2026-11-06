const express = require('express');
const multer = require('multer');
const router = express.Router();
const {
  listAdmins, createAdmin, deleteAdmin, listContacts, listAnnouncements,
  createAnnouncement, deleteAnnouncement, getSiteContent, updateSiteContent,
  activityLog, overviewPanel, securityPanel,
} = require('../controllers/adminController');
const { requireAdmin } = require('../middleware/auth');
const { createTvSchedule, deleteTvSchedule } = require('../controllers/tvController');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

router.get('/admins', requireAdmin, listAdmins);
router.post('/admins', requireAdmin, createAdmin);
router.delete('/admins/:email', requireAdmin, deleteAdmin);

router.get('/contacts', requireAdmin, listContacts);

router.get('/announcements', listAnnouncements);
router.post('/announcements', requireAdmin, createAnnouncement);
router.delete('/announcements/:aid', requireAdmin, deleteAnnouncement);

router.get('/content', getSiteContent);
router.put('/content', requireAdmin, updateSiteContent);

router.get('/panel/activity', requireAdmin, activityLog);
router.get('/panel/overview', requireAdmin, overviewPanel);
router.get('/panel/security', requireAdmin, securityPanel);
router.post('/panel/moderate', requireAdmin, (req, res) => res.json({ ok: true }));
router.post('/panel/security/unban', requireAdmin, (req, res) => res.json({ ok: true }));

router.get('/tracks', (req, res) => res.json([]));
router.post('/tracks', requireAdmin, upload.fields([{ name: 'audio', maxCount: 1 }, { name: 'cover', maxCount: 1 }]), (req, res) => {
  const { createTrack } = require('../controllers/tracksController');
  createTrack(req, res);
});
router.patch('/tracks/:track_id', requireAdmin, (req, res) => {
  const { updateTrack } = require('../controllers/tracksController');
  updateTrack(req, res);
});
router.delete('/tracks/:track_id', requireAdmin, (req, res) => {
  const { deleteTrack } = require('../controllers/tracksController');
  deleteTrack(req, res);
});
router.post('/tracks/:track_id/cover', requireAdmin, upload.single('cover'), (req, res) => res.json({ ok: true }));

router.get('/radio/skip', requireAdmin, (req, res) => res.json({ ok: true }));
router.post('/radio/skip', requireAdmin, (req, res) => res.json({ ok: true }));

router.get('/chat', requireAdmin, (req, res) => res.json([]));
router.delete('/chat/:mid', requireAdmin, (req, res) => res.json({ ok: true }));
router.post('/chat/ban', requireAdmin, (req, res) => res.json({ ok: true }));

router.post('/gaming', requireAdmin, (req, res) => res.json({ ok: true }));

router.get('/requests', (req, res) => res.json([]));
router.delete('/requests/:rid', requireAdmin, (req, res) => res.json({ ok: true }));

router.post('/tv/schedule', requireAdmin, createTvSchedule);
router.delete('/tv/schedule/:entry_id', requireAdmin, deleteTvSchedule);

router.post('/videos', requireAdmin, (req, res) => res.json({ ok: true }));
router.delete('/videos/:video_id', requireAdmin, (req, res) => res.json({ ok: true }));
router.post('/videos/comments/:comment_id/pin', requireAdmin, (req, res) => res.json({ ok: true }));

router.get('/stats', requireAdmin, overviewPanel);
router.get('/users', requireAdmin, (req, res) => res.json([]));

module.exports = router;
