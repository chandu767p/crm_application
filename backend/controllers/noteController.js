const Note = require('../models/Note');
const { logActivity } = require('../utils/activityLogger');

// @desc    Get notes for a lead
// @route   GET /api/leads/:leadId/notes
// @access  Private
exports.getLeadNotes = async (req, res, next) => {
  try {
    const notes = await Note.find({ leadId: req.params.leadId })
      .populate('createdBy', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: notes,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Add a note to a lead
// @route   POST /api/leads/:leadId/notes
// @access  Private
exports.addNote = async (req, res, next) => {
  try {
    const note = await Note.create({
      content: req.body.content,
      leadId: req.params.leadId,
      createdBy: req.user.id,
    });

    const populatedNote = await Note.findById(note._id).populate('createdBy', 'name email avatar');

    // Log Activity
    await logActivity(req, req.params.leadId, 'Lead', 'note_added', {
      subject: 'Note Added',
      description: `Added a note: "${req.body.content.substring(0, 50)}${req.body.content.length > 50 ? '...' : ''}"`
    });

    res.status(201).json({
      success: true,
      data: populatedNote,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update a note
// @route   PUT /api/notes/:id
// @access  Private
exports.updateNote = async (req, res, next) => {
  try {
    let note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    // Check permissions: owner or admin
    if (note.createdBy.toString() !== req.user.id && req.user.role.name !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this note' });
    }

    note = await Note.findByIdAndUpdate(req.params.id, { content: req.body.content }, {
      new: true,
      runValidators: true,
    }).populate('createdBy', 'name email avatar');

    // Log Activity
    await logActivity(req, note.leadId, 'Lead', 'note_updated', {
      subject: 'Note Updated',
      description: `Updated a note`
    });

    res.json({
      success: true,
      data: note,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a note
// @route   DELETE /api/notes/:id
// @access  Private
exports.deleteNote = async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    // Check permissions: owner or admin
    if (note.createdBy.toString() !== req.user.id && req.user.role.name !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this note' });
    }

    const leadId = note.leadId;
    await Note.findByIdAndDelete(req.params.id);

    // Log Activity
    await logActivity(req, leadId, 'Lead', 'note_deleted', {
      subject: 'Note Deleted',
      description: `Deleted a note`
    });

    res.json({
      success: true,
      message: 'Note deleted',
    });
  } catch (err) {
    next(err);
  }
};
