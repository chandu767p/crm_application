const express = require('express');
const router = express.Router();
const { exportData } = require('../controllers/exportController');
const { protect } = require('../middleware/auth');

router.get('/:module', protect, exportData);

module.exports = router;
