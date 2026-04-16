const Project = require('../models/Project');

exports.getProjects = async (req, res, next) => {
  try {
    const { search, status, priority, page = 1, limit = 20, sort = '-createdAt' } = req.query;
    const query = { active: true };
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (search) query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];

    const total = await Project.countDocuments(query);
    const data = await Project.find(query)
      .populate('assignedTo', 'name email')
      .populate('account', 'name')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ success: true, data, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
};

exports.getProject = async (req, res, next) => {
  try {
    const proj = await Project.findOne({ _id: req.params.id, active: true })
      .populate('assignedTo', 'name email')
      .populate('account', 'name');
    if (!proj) return res.status(404).json({ success: false, message: 'Project not found' });
    res.json({ success: true, data: proj });
  } catch (err) { next(err); }
};

exports.createProject = async (req, res, next) => {
  try {
    const proj = await Project.create(req.body);
    await proj.populate('assignedTo', 'name email');
    res.status(201).json({ success: true, data: proj });
  } catch (err) { next(err); }
};

exports.updateProject = async (req, res, next) => {
  try {
    const proj = await Project.findOneAndUpdate({ _id: req.params.id, active: true }, req.body, { new: true, runValidators: true })
      .populate('assignedTo', 'name email')
      .populate('account', 'name');
    if (!proj) return res.status(404).json({ success: false, message: 'Project not found' });
    res.json({ success: true, data: proj });
  } catch (err) { next(err); }
};

exports.deleteProject = async (req, res, next) => {
  try {
    const proj = await Project.findOneAndUpdate({ _id: req.params.id }, { active: false }, { new: true });
    if (!proj) return res.status(404).json({ success: false, message: 'Project not found' });
    res.json({ success: true, message: 'Project deleted' });
  } catch (err) { next(err); }
};

exports.bulkDeleteProjects = async (req, res, next) => {
  try {
    const { ids } = req.body;
    await Project.updateMany({ _id: { $in: ids } }, { active: false });
    res.json({ success: true, message: `${ids.length} projects deleted` });
  } catch (err) { next(err); }
};
