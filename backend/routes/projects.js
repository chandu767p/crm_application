const express = require('express');
const router = express.Router();
const { getProjects, getProject, createProject, updateProject, deleteProject, bulkDeleteProjects } = require('../controllers/projectController');
const { protect } = require('../middleware/auth');

router.route('/').get(protect, getProjects).post(protect, createProject).delete(protect, bulkDeleteProjects);
router.route('/:id').get(protect, getProject).put(protect, updateProject).delete(protect, deleteProject);

module.exports = router;
