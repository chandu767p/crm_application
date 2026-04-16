const express = require('express');
const router = express.Router();
const { getTemplates, getTemplate, createTemplate, updateTemplate, deleteTemplate, previewTemplate } = require('../controllers/emailTemplateController');
const { protect } = require('../middleware/auth');

router.route('/').get(protect, getTemplates).post(protect, createTemplate);
router.route('/:id').get(protect, getTemplate).put(protect, updateTemplate).delete(protect, deleteTemplate);
router.post('/:id/preview', protect, previewTemplate);

module.exports = router;
