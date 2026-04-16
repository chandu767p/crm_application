const express = require('express');
const router = express.Router();
const {
  getActivities,
  getActivity,
  getTimeline,
  deleteActivity,
} = require('../controllers/activityController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// Timeline endpoint — available to anyone who can view records
router.get('/timeline/:model/:id', getTimeline);

// System audit log — restrict to admins/managers
router.use(authorize('activities', 'calls', 'emails', 'meetings'));
router.route('/').get(getActivities);
router.route('/:id').get(getActivity).delete(deleteActivity);

module.exports = router;
