const express = require('express');
const router = express.Router();
const { getSettings, getSettingByKey, updateSetting, deleteSetting } = require('../controllers/settingsController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', authorize('admin'), getSettings);
router.get('/:key', getSettingByKey);
router.post('/', authorize('admin'), updateSetting);
router.delete('/:key', authorize('admin'), deleteSetting);

module.exports = router;
