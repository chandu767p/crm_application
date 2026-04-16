const express = require('express');
const {
  getRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
  bulkDeleteRoles,
} = require('../controllers/roleController');
// Re-using user protect to restrict access, we will assume protect handles basic auth restriction
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.use(authorize('roles'));

router.route('/')
  .get(getRoles)
  .post(createRole)
  .delete(bulkDeleteRoles);

router.route('/:id')
  .get(getRole)
  .put(updateRole)
  .delete(deleteRole);

module.exports = router;
