const express = require('express');
const router = express.Router();
const {
  getLeadNotes,
  addNote,
  updateNote,
  deleteNote,
} = require('../controllers/noteController');
const { protect } = require('../middleware/auth');

// Routes for lead-specific notes
router.route('/leads/:leadId/notes')
  .get(protect, getLeadNotes)
  .post(protect, addNote);

// Routes for individual notes
router.route('/notes/:id')
  .put(protect, updateNote)
  .delete(protect, deleteNote);

module.exports = router;
