const CustomerActivity = require('../models/CustomerActivity');

// @desc    Get all activities (optionally filtered by related entity)
// @route   GET /api/customer-activities
// @access  Private
exports.getCustomerActivities = async (req, res, next) => {
  try {
    const { 
      relatedTo, 
      onModel, 
      type, 
      status, 
      page = 1, 
      limit = 20, 
      sort = '-activityDate',
      search,
      startDate,
      endDate,
      purpose,
      outcome,
      createdBy
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const filter = {};

    // Basic filters
    if (relatedTo) filter.relatedTo = relatedTo;
    if (onModel) filter.onModel = onModel;
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (purpose) filter.purpose = purpose;
    if (outcome) filter.outcome = outcome;
    if (createdBy) filter.createdBy = createdBy;

    // Search filter (Subject)
    if (search) {
      filter.subject = { $regex: search, $options: 'i' };
    }

    // Date range filter
    if (startDate || endDate) {
      filter.activityDate = {};
      if (startDate) filter.activityDate.$gte = new Date(startDate);
      if (endDate) filter.activityDate.$lte = new Date(endDate);
    }

    const total = await CustomerActivity.countDocuments(filter);
    
    // Determine fields to select based on UI requirements
    const activities = await CustomerActivity.find(filter)
      .populate('createdBy', 'name')
      .populate({ path: 'relatedTo', select: 'name title subject' })
      .select('-description') // Exclude heavy description for list view
      .sort(sort.split(',').join(' ')) // Handle multiple sort fields if needed
      .skip(skip)
      .limit(parseInt(limit));

    res.json({ 
      success: true, 
      data: activities,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create activity
// @route   POST /api/customer-activities
// @access  Private
exports.createCustomerActivity = async (req, res, next) => {
  try {
    req.body.createdBy = req.user._id;
    const activity = await CustomerActivity.create(req.body);
    const populated = await activity.populate('createdBy', 'name');
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};

exports.getCustomerActivity = async (req, res, next) => {
  try {
    const activity = await CustomerActivity.findById(req.params.id)
      .populate('createdBy', 'name')
      .populate({ path: 'relatedTo', select: 'name title subject' });
    
    if (!activity) return res.status(404).json({ success: false, message: 'Activity not found' });
    res.json({ success: true, data: activity });
  } catch (err) {
    next(err);
  }
};

exports.updateCustomerActivity = async (req, res, next) => {
  try {
    const activity = await CustomerActivity.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!activity) return res.status(404).json({ success: false, message: 'Activity not found' });
    const populated = await activity.populate('createdBy', 'name');
    res.json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete activity
// @route   DELETE /api/customer-activities/:id
// @access  Private
exports.deleteCustomerActivity = async (req, res, next) => {
  try {
    const activity = await CustomerActivity.findByIdAndDelete(req.params.id);
    if (!activity) return res.status(404).json({ success: false, message: 'Activity not found' });
    res.json({ success: true, message: 'Activity deleted' });
  } catch (err) {
    next(err);
  }
};
