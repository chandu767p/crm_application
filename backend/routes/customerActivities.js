const express = require('express');
const router = express.Router();
const {
  getCustomerActivities,
  getCustomerActivity,
  createCustomerActivity,
  updateCustomerActivity,
  deleteCustomerActivity,
} = require('../controllers/customerActivityController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('activities', 'calls', 'emails', 'meetings'));

router.route('/').get(getCustomerActivities).post(createCustomerActivity);
router.route('/:id').get(getCustomerActivity).put(updateCustomerActivity).delete(deleteCustomerActivity);

module.exports = router;
