const express = require('express');
const router = express.Router();
const {
  getDeals,
  getDeal,
  createDeal,
  updateDeal,
  deleteDeal,
  bulkDeleteDeals,
} = require('../controllers/dealController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('deals'));

router.route('/').get(getDeals).post(createDeal).delete(bulkDeleteDeals);
router.route('/:id').get(getDeal).put(updateDeal).delete(deleteDeal);

module.exports = router;
