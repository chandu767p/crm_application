const express = require('express');
const router = express.Router();
const {
  getContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact,
  bulkDeleteContacts,
} = require('../controllers/contactController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('contacts'));

router.route('/').get(getContacts).post(createContact).delete(bulkDeleteContacts);
router.route('/:id').get(getContact).put(updateContact).delete(deleteContact);

module.exports = router;
