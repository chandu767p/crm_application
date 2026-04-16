const express = require('express');
const router = express.Router();
const { getStats } = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('dashboard'));

router.get('/stats', getStats);

module.exports = router;
