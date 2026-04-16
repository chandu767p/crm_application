const Account = require('../models/Account');
const APIFeatures = require('../utils/apiFeatures');

// @desc    Get all accounts
// @route   GET /api/accounts
// @access  Private
exports.getAccounts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const features = new APIFeatures(Account.find().populate('owner', 'name email'), req.query)
      .filter()
      .search(['name', 'industry'])
      .sort()
      .limitFields()
      .paginate();

    const total = await Account.countDocuments(new APIFeatures(Account.find(), req.query).filter().search(['name', 'industry']).query.getFilter());
    const accounts = await features.query;

    res.json({
      success: true,
      data: accounts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single account
// @route   GET /api/accounts/:id
// @access  Private
exports.getAccount = async (req, res, next) => {
  try {
    const account = await Account.findById(req.params.id).populate('owner', 'name email');
    if (!account) return res.status(404).json({ success: false, message: 'Account not found' });
    res.json({ success: true, data: account });
  } catch (err) {
    next(err);
  }
};

// @desc    Create account
// @route   POST /api/accounts
// @access  Private
exports.createAccount = async (req, res, next) => {
  try {
    const account = await Account.create(req.body);
    const populated = await account.populate('owner', 'name email');
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};

// @desc    Update account
// @route   PUT /api/accounts/:id
// @access  Private
exports.updateAccount = async (req, res, next) => {
  try {
    const account = await Account.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('owner', 'name email');
    if (!account) return res.status(404).json({ success: false, message: 'Account not found' });
    res.json({ success: true, data: account });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete account
// @route   DELETE /api/accounts/:id
// @access  Private
exports.deleteAccount = async (req, res, next) => {
  try {
    const account = await Account.findByIdAndDelete(req.params.id);
    if (!account) return res.status(404).json({ success: false, message: 'Account not found' });
    res.json({ success: true, message: 'Account deleted' });
  } catch (err) {
    next(err);
  }
};

// @desc    Bulk delete accounts
// @route   DELETE /api/accounts (body: { ids: [] })
// @access  Private
exports.bulkDeleteAccounts = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'No IDs provided' });
    }
    await Account.deleteMany({ _id: { $in: ids } });
    res.json({ success: true, message: `${ids.length} accounts deleted` });
  } catch (err) {
    next(err);
  }
};
