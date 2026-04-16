const express = require('express');
const router = express.Router();
const { getEmployees, getEmployee, createEmployee, updateEmployee, deleteEmployee, bulkDeleteEmployees } = require('../controllers/employeeController');
const { protect } = require('../middleware/auth');

router.route('/').get(protect, getEmployees).post(protect, createEmployee).delete(protect, bulkDeleteEmployees);
router.route('/:id').get(protect, getEmployee).put(protect, updateEmployee).delete(protect, deleteEmployee);

module.exports = router;
