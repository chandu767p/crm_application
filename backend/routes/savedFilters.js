const express = require('express');
const router = express.Router();
const { getSavedFilters, createSavedFilter, setDefaultFilter, deleteSavedFilter } = require('../controllers/savedFilterController');
const { protect } = require('../middleware/auth');

router.route('/').get(protect, getSavedFilters).post(protect, createSavedFilter);
router.put('/:id/default', protect, setDefaultFilter);
router.delete('/:id', protect, deleteSavedFilter);

module.exports = router;
