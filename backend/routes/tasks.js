const express = require('express');
const router = express.Router();
const {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  bulkDeleteTasks,
} = require('../controllers/taskController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('tasks'));

router.route('/').get(getTasks).post(createTask).delete(bulkDeleteTasks);
router.route('/:id').get(getTask).put(updateTask).delete(deleteTask);

module.exports = router;
