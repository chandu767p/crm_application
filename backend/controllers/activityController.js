const Activity = require('../models/Activity');
const CustomerActivity = require('../models/CustomerActivity');

// @desc    Get system audit activities (filtered by related entity)
// @route   GET /api/activities
// @access  Private
exports.getActivities = async (req, res, next) => {
  try {
    const { relatedTo, onModel, page = 1, limit = 20, sort = '-activityDate', search } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const filter = { type: 'system' };

    if (relatedTo) filter.relatedTo = relatedTo;
    if (onModel) filter.onModel = onModel;
    if (search) filter.subject = { $regex: search, $options: 'i' };

    const total = await Activity.countDocuments(filter);

    const activities = await Activity.find(filter)
      .populate('createdBy', 'name')
      .populate({ path: 'relatedTo', select: 'name title subject' })
      .sort(sort.split(',').join(' '))
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

// @desc    Get merged timeline (system audit + customer interactions) for an entity
// @route   GET /api/activities/timeline/:model/:id
// @access  Private
exports.getTimeline = async (req, res, next) => {
  try {
    const { model, id } = req.params;

    const [systemLogs, customerInteractions] = await Promise.all([
      Activity.find({ relatedTo: id })
        .populate('createdBy', 'name')
        .lean(),
      CustomerActivity.find({ relatedTo: id })
        .populate('createdBy', 'name')
        .lean(),
    ]);

    // Tag source for frontend differentiation
    const tagged = [
      ...systemLogs.map(a => ({ ...a, _source: 'system' })),
      ...customerInteractions.map(a => ({ ...a, _source: 'customer' })),
    ];

    // Sort combined result by activityDate descending
    tagged.sort((a, b) => new Date(b.activityDate) - new Date(a.activityDate));

    res.json({ success: true, data: tagged });
  } catch (err) {
    next(err);
  }
};

exports.getActivity = async (req, res, next) => {
  try {
    const activity = await Activity.findById(req.params.id)
      .populate('createdBy', 'name')
      .populate({ path: 'relatedTo', select: 'name title subject' });

    if (!activity) return res.status(404).json({ success: false, message: 'Activity not found' });
    res.json({ success: true, data: activity });
  } catch (err) {
    next(err);
  }
};

exports.deleteActivity = async (req, res, next) => {
  try {
    const activity = await Activity.findByIdAndDelete(req.params.id);
    if (!activity) return res.status(404).json({ success: false, message: 'Activity not found' });
    res.json({ success: true, message: 'Activity deleted' });
  } catch (err) {
    next(err);
  }
};
