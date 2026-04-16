const Lead = require('../models/Lead');
const Contact = require('../models/Contact');
const Activity = require('../models/Activity');
const APIFeatures = require('../utils/apiFeatures');
const { logActivity, logFieldChanges } = require('../utils/activityLogger');

// @desc    Get all leads
// @route   GET /api/leads
// @access  Private
exports.getLeads = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const features = new APIFeatures(
      Lead.find({ active: { $ne: false } })
        .populate('assignedTo', 'name email')
        .populate('account', 'name'),
      req.query
    );

    await features.resolveRefs({
      account: { model: 'Account', field: 'name' },
      assignedTo: { model: 'User', field: 'name' }
    });

    features
      .filter()
      .search(['name', 'email'])
      .sort()
      .limitFields()
      .paginate();

    const fetchCountFeatures = new APIFeatures(Lead.find({ active: { $ne: false } }), req.query);
    await fetchCountFeatures.resolveRefs({
      account: { model: 'Account', field: 'name' },
      assignedTo: { model: 'User', field: 'name' }
    });
    const total = await Lead.countDocuments(fetchCountFeatures.filter().search(['name', 'email']).query.getFilter());
    const leads = await features.query;

    res.json({
      success: true,
      data: leads,
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

// @desc    Get single lead
// @route   GET /api/leads/:id
// @access  Private
exports.getLead = async (req, res, next) => {
  try {
    const lead = await Lead.findOne({ _id: req.params.id, active: { $ne: false } })
      .populate('assignedTo', 'name email')
      .populate('account', 'name');
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    res.json({ success: true, data: lead });
  } catch (err) {
    next(err);
  }
};

// @desc    Create lead
// @route   POST /api/leads
// @access  Private
exports.createLead = async (req, res, next) => {
  try {
    if (!req.body.account) delete req.body.account;
    if (!req.body.assignedTo) delete req.body.assignedTo;
    
    const lead = await Lead.create(req.body);
    const populated = await lead.populate([
      { path: 'assignedTo', select: 'name email' },
      { path: 'account', select: 'name' }
    ]);

    // Log Activity
    await logActivity(req, lead._id, 'Lead', 'created', {
      subject: 'Lead Created',
      description: `Created lead "${lead.name}"`
    });

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};

// @desc    Update lead
// @route   PUT /api/leads/:id
// @access  Private
exports.updateLead = async (req, res, next) => {
  try {
    const oldLead = await Lead.findById(req.params.id);
    if (!oldLead) return res.status(404).json({ success: false, message: 'Lead not found' });

    if (!req.body.account) delete req.body.account;
    if (!req.body.assignedTo) delete req.body.assignedTo;

    const lead = await Lead.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate([
      { path: 'assignedTo', select: 'name email' },
      { path: 'account', select: 'name' }
    ]);

    // Track field changes
    const fieldsToTrack = ['name', 'status', 'email', 'phone', 'source', 'value', 'assignedTo'];
    await logFieldChanges(req, lead._id, 'Lead', oldLead, lead, fieldsToTrack);

    res.json({ success: true, data: lead });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete lead
// @route   DELETE /api/leads/:id
// @access  Private
exports.deleteLead = async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

    // Use soft delete if available, or permanent delete
    if (lead.active !== undefined) {
      lead.active = false;
      await lead.save();
    } else {
      await Lead.findByIdAndDelete(req.params.id);
    }

    // Log Activity
    await logActivity(req, req.params.id, 'Lead', 'deleted', {
      subject: 'Lead Deleted',
      description: `Deleted lead "${lead.name}"`
    });

    res.json({ success: true, message: 'Lead deleted' });
  } catch (err) {
    next(err);
  }
};

// @desc    Bulk delete leads
// @route   DELETE /api/leads (body: { ids: [] })
// @access  Private
exports.bulkDeleteLeads = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'No IDs provided' });
    }
    await Lead.deleteMany({ _id: { $in: ids } });
    res.json({ success: true, message: `${ids.length} leads deleted` });
  } catch (err) {
    next(err);
  }
};

// @desc    Add note to lead
// @route   POST /api/leads/:id/notes
// @access  Private
exports.addNote = async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

    lead.notes.push({ content: req.body.content, createdBy: req.user.id });
    await lead.save();
    await lead.populate('assignedTo', 'name email');
    res.json({ success: true, data: lead });
  } catch (err) {
    next(err);
  }
};

// @desc    Convert lead to contact
// @route   POST /api/leads/:id/convert
// @access  Private
exports.convertLead = async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

    if (lead.status === 'won') {
      return res.status(400).json({ success: false, message: 'Lead is already converted (won)' });
    }

    // Create Contact
    const contact = await Contact.create({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      account: lead.account,
      source: lead.source,
      status: 'active',
      assignedTo: lead.assignedTo,
    });

    // Mark lead as won
    lead.status = 'won';
    await lead.save();

    // Log system activity
    await Activity.create({
      type: 'system',
      subject: `Lead ${lead.name} converted to Contact`,
      relatedTo: lead._id,
      onModel: 'Lead',
      createdBy: req.user ? req.user.id : lead.assignedTo,
    });

    res.json({ success: true, data: { lead, contact } });
  } catch (err) {
    next(err);
  }
};
