const express = require('express');
const router = express.Router();
const {
  getAccounts,
  getAccount,
  createAccount,
  updateAccount,
  deleteAccount,
  bulkDeleteAccounts,
} = require('../controllers/accountController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('accounts'));

router.route('/').get(getAccounts).post(createAccount).delete(bulkDeleteAccounts);
router.route('/:id').get(getAccount).put(updateAccount).delete(deleteAccount);

module.exports = router;
