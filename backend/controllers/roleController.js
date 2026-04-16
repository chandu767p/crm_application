const Role = require('../models/Role');
const { logActivity, logFieldChanges, logRecordView } = require('../utils/activityLogger');

const buildQuery = (query) => {
  const filter = {};
  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: 'i' } },
      { description: { $regex: query.search, $options: 'i' } },
    ];
  }
  return filter;
};

// @desc    Get all roles
// @route   GET /api/roles
// @access  Private/Admin
exports.getRoles = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const sortField = req.query.sortField || 'name';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    const filter = buildQuery(req.query);
    const total = await Role.countDocuments(filter);
    const roles = await Role.find(filter)
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      data: roles,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single role
// @route   GET /api/roles/:id
// @access  Private/Admin
exports.getRole = async (req, res, next) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) return res.status(404).json({ success: false, message: 'Role not found' });

    // Log View
    await logRecordView(req, role._id, 'Role', role.name);

    res.json({ success: true, data: role });
  } catch (err) {
    next(err);
  }
};

// @desc    Create role
// @route   POST /api/roles
// @access  Private/Admin
exports.createRole = async (req, res, next) => {
  try {
    const role = await Role.create(req.body);

    // Log Creation
    await logActivity(req, role._id, 'Role', 'created', {
      subject: 'Role Created',
      description: `Created new user role "${role.name}"`
    });

    res.status(201).json({ success: true, data: role });
  } catch (err) {
    next(err);
  }
};

// @desc    Update role
// @route   PUT /api/roles/:id
// @access  Private/Admin
exports.updateRole = async (req, res, next) => {
  try {
    const oldRole = await Role.findById(req.params.id);
    if (!oldRole) return res.status(404).json({ success: false, message: 'Role not found' });

    const role = await Role.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    // Track changes
    await logFieldChanges(req, role._id, 'Role', oldRole, role, ['name', 'description', 'permissions']);

    res.json({ success: true, data: role });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete role
// @route   DELETE /api/roles/:id
// @access  Private/Admin
exports.deleteRole = async (req, res, next) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) return res.status(404).json({ success: false, message: 'Role not found' });

    await Role.findByIdAndDelete(req.params.id);

    // Log Deletion
    await logActivity(req, req.params.id, 'Role', 'deleted', {
      subject: 'Role Deleted',
      description: `Deleted user role "${role.name}"`
    });

    res.json({ success: true, message: 'Role deleted' });
  } catch (err) {
    next(err);
  }
};

// @desc    Bulk delete roles
// @route   DELETE /api/roles
// @access  Private/Admin
exports.bulkDeleteRoles = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'No IDs provided' });
    }
    await Role.deleteMany({ _id: { $in: ids } });
    res.json({ success: true, message: `${ids.length} roles deleted` });
  } catch (err) {
    next(err);
  }
};
