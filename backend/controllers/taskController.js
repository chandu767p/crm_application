const Task = require('../models/Task');
const APIFeatures = require('../utils/apiFeatures');
const { logActivity, logFieldChanges } = require('../utils/activityLogger');

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Private
exports.getTasks = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const features = new APIFeatures(
      Task.find()
        .populate('assignedTo', 'name email')
        .populate('relatedTo', 'name subject'),
      req.query
    );

    await features.resolveRefs({
      assignedTo: { model: 'User', field: 'name' }
    });

    features
      .filter()
      .search(['title', 'description'])
      .sort()
      .limitFields()
      .paginate();

    const fetchCountFeatures = new APIFeatures(Task.find(), req.query);
    await fetchCountFeatures.resolveRefs({
      assignedTo: { model: 'User', field: 'name' }
    });
    const total = await Task.countDocuments(fetchCountFeatures.filter().search(['title', 'description']).query.getFilter());
    const tasks = await features.query;

    res.json({
      success: true,
      data: tasks,
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

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
exports.getTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('relatedTo', 'name subject');
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
};

// @desc    Create task
// @route   POST /api/tasks
// @access  Private
exports.createTask = async (req, res, next) => {
  try {
    if (req.body.assignedTo === '') req.body.assignedTo = null;
    if (req.body.relatedTo === '') req.body.relatedTo = null;
    
    const task = await Task.create(req.body);
    const populated = await task.populate([
      { path: 'assignedTo', select: 'name email' },
      { path: 'relatedTo', select: 'name subject' }
    ]);

    // Log Activity
    await logActivity(req, task._id, 'Task', 'created', {
      subject: 'Task Created',
      description: `Created task "${task.title}"`
    });

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTask = async (req, res, next) => {
  try {
    const oldTask = await Task.findById(req.params.id);
    if (!oldTask) return res.status(404).json({ success: false, message: 'Task not found' });

    if (req.body.assignedTo === '') req.body.assignedTo = null;
    if (req.body.relatedTo === '') req.body.relatedTo = null;

    const task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate([
      { path: 'assignedTo', select: 'name email' },
      { path: 'relatedTo', select: 'name subject' }
    ]);

    // Track field changes
    const fieldsToTrack = ['title', 'status', 'priority', 'dueDate', 'assignedTo'];
    await logFieldChanges(req, task._id, 'Task', oldTask, task, fieldsToTrack);

    res.json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    await Task.findByIdAndDelete(req.params.id);

    // Log Activity
    await logActivity(req, req.params.id, 'Task', 'deleted', {
      subject: 'Task Deleted',
      description: `Deleted task "${task.title}"`
    });

    res.json({ success: true, message: 'Task deleted' });
  } catch (err) {
    next(err);
  }
};

// @desc    Bulk delete tasks
// @route   DELETE /api/tasks (body: { ids: [] })
// @access  Private
exports.bulkDeleteTasks = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'No IDs provided' });
    }
    await Task.deleteMany({ _id: { $in: ids } });
    res.json({ success: true, message: `${ids.length} tasks deleted` });
  } catch (err) {
    next(err);
  }
};
