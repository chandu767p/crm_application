const Contact = require('../models/Contact');
const APIFeatures = require('../utils/apiFeatures');
const { logActivity, logFieldChanges, logRecordView } = require('../utils/activityLogger');

// @desc    Get all contacts
// @route   GET /api/contacts
// @access  Private
exports.getContacts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const features = new APIFeatures(
      Contact.find().populate('assignedTo', 'name email').populate('account', 'name'),
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

    const fetchCountFeatures = new APIFeatures(Contact.find(), req.query);
    await fetchCountFeatures.resolveRefs({
      account: { model: 'Account', field: 'name' },
      assignedTo: { model: 'User', field: 'name' }
    });
    const total = await Contact.countDocuments(fetchCountFeatures.filter().search(['name', 'email']).query.getFilter());
    const contacts = await features.query;

    res.json({
      success: true,
      data: contacts,
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

// @desc    Get single contact
// @route   GET /api/contacts/:id
// @access  Private
exports.getContact = async (req, res, next) => {
  try {
    const contact = await Contact.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('account', 'name');
    if (!contact) return res.status(404).json({ success: false, message: 'Contact not found' });

    // Log View
    await logRecordView(req, contact._id, 'Contact', contact.name);

    res.json({ success: true, data: contact });
  } catch (err) {
    next(err);
  }
};

// @desc    Create contact
// @route   POST /api/contacts
// @access  Private
exports.createContact = async (req, res, next) => {
  try {
    if (req.body.account === '') req.body.account = null;
    if (req.body.assignedTo === '') req.body.assignedTo = null;
    const contact = await Contact.create(req.body);
    const populated = await contact.populate([
      { path: 'assignedTo', select: 'name email' },
      { path: 'account', select: 'name' }
    ]);

    // Log Creation
    await logActivity(req, contact._id, 'Contact', 'created', {
      subject: 'Contact Created',
      description: `Created contact "${contact.name}"`
    });

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};

// @desc    Update contact
// @route   PUT /api/contacts/:id
// @access  Private
exports.updateContact = async (req, res, next) => {
  try {
    const oldContact = await Contact.findById(req.params.id);
    if (!oldContact) return res.status(404).json({ success: false, message: 'Contact not found' });

    if (req.body.account === '') req.body.account = null;
    if (req.body.assignedTo === '') req.body.assignedTo = null;
    const contact = await Contact.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate([
      { path: 'assignedTo', select: 'name email' },
      { path: 'account', select: 'name' }
    ]);

    // Track field changes
    const fieldsToTrack = ['name', 'status', 'email', 'phone', 'account', 'assignedTo'];
    await logFieldChanges(req, contact._id, 'Contact', oldContact, contact, fieldsToTrack);

    res.json({ success: true, data: contact });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete contact
// @route   DELETE /api/contacts/:id
// @access  Private
exports.deleteContact = async (req, res, next) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact) return res.status(404).json({ success: false, message: 'Contact not found' });

    await Contact.findByIdAndDelete(req.params.id);

    // Log Deletion
    await logActivity(req, req.params.id, 'Contact', 'deleted', {
      subject: 'Contact Deleted',
      description: `Deleted contact "${contact.name}"`
    });

    res.json({ success: true, message: 'Contact deleted' });
  } catch (err) {
    next(err);
  }
};

// @desc    Bulk delete contacts
// @route   DELETE /api/contacts (body: { ids: [] })
// @access  Private
exports.bulkDeleteContacts = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'No IDs provided' });
    }
    await Contact.deleteMany({ _id: { $in: ids } });
    res.json({ success: true, message: `${ids.length} contacts deleted` });
  } catch (err) {
    next(err);
  }
};
