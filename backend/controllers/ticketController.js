const Ticket = require('../models/Ticket');
const APIFeatures = require('../utils/apiFeatures');

// @desc    Get all tickets
// @route   GET /api/tickets
// @access  Private
exports.getTickets = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const features = new APIFeatures(
      Ticket.find()
        .populate('assignedTo', 'name email')
        .populate('contact', 'name email company'),
      req.query
    );

    await features.resolveRefs({
      contact: { model: 'Contact', field: 'name' },
      assignedTo: { model: 'User', field: 'name' }
    });

    features
      .filter()
      .search(['subject', 'description'])
      .sort()
      .limitFields()
      .paginate();

    const fetchCountFeatures = new APIFeatures(Ticket.find(), req.query);
    await fetchCountFeatures.resolveRefs({
      contact: { model: 'Contact', field: 'name' },
      assignedTo: { model: 'User', field: 'name' }
    });
    const total = await Ticket.countDocuments(
      fetchCountFeatures
        .filter()
        .search(['subject', 'description'])
        .query.getFilter()
    );
    const tickets = await features.query;

    res.json({
      success: true,
      data: tickets,
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

// @desc    Get single ticket
// @route   GET /api/tickets/:id
// @access  Private
exports.getTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('contact', 'name email company');
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
    res.json({ success: true, data: ticket });
  } catch (err) {
    next(err);
  }
};

// @desc    Create ticket
// @route   POST /api/tickets
// @access  Private
exports.createTicket = async (req, res, next) => {
  try {
    if (req.body.contact === '') req.body.contact = null;
    if (req.body.assignedTo === '') req.body.assignedTo = null;
    const ticket = await Ticket.create(req.body);
    const populated = await ticket.populate([
      { path: 'assignedTo', select: 'name email' },
      { path: 'contact', select: 'name email company' }
    ]);
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};

// @desc    Update ticket
// @route   PUT /api/tickets/:id
// @access  Private
exports.updateTicket = async (req, res, next) => {
  try {
    if (req.body.contact === '') req.body.contact = null;
    if (req.body.assignedTo === '') req.body.assignedTo = null;
    const ticket = await Ticket.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('assignedTo', 'name email').populate('contact', 'name email company');
    
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
    res.json({ success: true, data: ticket });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete ticket
// @route   DELETE /api/tickets/:id
// @access  Private
exports.deleteTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.findByIdAndDelete(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
    res.json({ success: true, message: 'Ticket deleted' });
  } catch (err) {
    next(err);
  }
};

// @desc    Bulk delete tickets
// @route   DELETE /api/tickets (body: { ids: [] })
// @access  Private
exports.bulkDeleteTickets = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'No IDs provided' });
    }
    await Ticket.deleteMany({ _id: { $in: ids } });
    res.json({ success: true, message: `${ids.length} tickets deleted` });
  } catch (err) {
    next(err);
  }
};
