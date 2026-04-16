const Deal = require('../models/Deal');
const APIFeatures = require('../utils/apiFeatures');

// @desc    Get all deals
// @route   GET /api/deals
// @access  Private
exports.getDeals = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100; // Default 100 for Kanban

    const features = new APIFeatures(
      Deal.find()
        .populate('assignedTo', 'name email')
        .populate('contact', 'name company')
        .populate('account', 'name'),
      req.query
    );
    
    await features.resolveRefs({
      contact: { model: 'Contact', field: 'name' },
      account: { model: 'Account', field: 'name' },
      assignedTo: { model: 'User', field: 'name' }
    });

    features
      .filter()
      .search(['name'])
      .sort()
      .limitFields()
      .paginate();

    const fetchCountFeatures = new APIFeatures(Deal.find(), req.query);
    await fetchCountFeatures.resolveRefs({
      contact: { model: 'Contact', field: 'name' },
      account: { model: 'Account', field: 'name' },
      assignedTo: { model: 'User', field: 'name' }
    });
    const total = await Deal.countDocuments(fetchCountFeatures.filter().search(['name']).query.getFilter());
    const deals = await features.query;

    res.json({
      success: true,
      data: deals,
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

// @desc    Get single deal
// @route   GET /api/deals/:id
// @access  Private
exports.getDeal = async (req, res, next) => {
  try {
    const deal = await Deal.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('contact', 'name company')
      .populate('account', 'name');
    if (!deal) return res.status(404).json({ success: false, message: 'Deal not found' });
    res.json({ success: true, data: deal });
  } catch (err) {
    next(err);
  }
};

// @desc    Create deal
// @route   POST /api/deals
// @access  Private
exports.createDeal = async (req, res, next) => {
  try {
    if (req.body.contact === '') req.body.contact = null;
    if (req.body.assignedTo === '') req.body.assignedTo = null;
    const deal = await Deal.create(req.body);
    const populated = await deal.populate([
      { path: 'assignedTo', select: 'name email' },
      { path: 'contact', select: 'name company' },
      { path: 'account', select: 'name' }
    ]);
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};

// @desc    Update deal
// @route   PUT /api/deals/:id
// @access  Private
exports.updateDeal = async (req, res, next) => {
  try {
    if (req.body.contact === '') req.body.contact = null;
    if (req.body.assignedTo === '') req.body.assignedTo = null;
    const deal = await Deal.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('assignedTo', 'name email')
      .populate('contact', 'name company')
      .populate('account', 'name');

    if (!deal) return res.status(404).json({ success: false, message: 'Deal not found' });
    res.json({ success: true, data: deal });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete deal
// @route   DELETE /api/deals/:id
// @access  Private
exports.deleteDeal = async (req, res, next) => {
  try {
    const deal = await Deal.findByIdAndDelete(req.params.id);
    if (!deal) return res.status(404).json({ success: false, message: 'Deal not found' });
    res.json({ success: true, message: 'Deal deleted' });
  } catch (err) {
    next(err);
  }
};

// @desc    Bulk delete deals
// @route   DELETE /api/deals
// @access  Private
exports.bulkDeleteDeals = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'No IDs provided' });
    }
    await Deal.deleteMany({ _id: { $in: ids } });
    res.json({ success: true, message: `${ids.length} deals deleted` });
  } catch (err) {
    next(err);
  }
};
