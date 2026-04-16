const express = require('express');
const router = express.Router();
const {
  getLeads,
  getLead,
  createLead,
  updateLead,
  deleteLead,
  bulkDeleteLeads,
  addNote,
  convertLead,
} = require('../controllers/leadController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('leads'));

router.route('/').get(getLeads).post(createLead).delete(bulkDeleteLeads);
router.route('/:id').get(getLead).put(updateLead).delete(deleteLead);
router.post('/:id/convert', convertLead);

module.exports = router;
