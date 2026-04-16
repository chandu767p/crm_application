const express = require('express');
const router = express.Router();
const {
  getTickets,
  getTicket,
  createTicket,
  updateTicket,
  deleteTicket,
  bulkDeleteTickets,
} = require('../controllers/ticketController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('tickets'));

router.route('/').get(getTickets).post(createTicket).delete(bulkDeleteTickets);
router.route('/:id').get(getTicket).put(updateTicket).delete(deleteTicket);

module.exports = router;
