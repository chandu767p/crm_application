const Employee = require('../models/Employee');

exports.getEmployees = async (req, res, next) => {
  try {
    const { search, department, status, page = 1, limit = 20, sort = '-createdAt' } = req.query;
    const query = { active: true };
    if (department) query.department = department;
    if (status) query.status = status;
    if (search) query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { position: { $regex: search, $options: 'i' } },
    ];

    const total = await Employee.countDocuments(query);
    const data = await Employee.find(query)
      .populate('user', 'name email')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ success: true, data, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
};

exports.getEmployee = async (req, res, next) => {
  try {
    const emp = await Employee.findOne({ _id: req.params.id, active: true }).populate('user', 'name email');
    if (!emp) return res.status(404).json({ success: false, message: 'Employee not found' });
    res.json({ success: true, data: emp });
  } catch (err) { next(err); }
};

exports.createEmployee = async (req, res, next) => {
  try {
    const emp = await Employee.create(req.body);
    res.status(201).json({ success: true, data: emp });
  } catch (err) { next(err); }
};

exports.updateEmployee = async (req, res, next) => {
  try {
    const emp = await Employee.findOneAndUpdate({ _id: req.params.id, active: true }, req.body, { new: true, runValidators: true }).populate('user', 'name email');
    if (!emp) return res.status(404).json({ success: false, message: 'Employee not found' });
    res.json({ success: true, data: emp });
  } catch (err) { next(err); }
};

exports.deleteEmployee = async (req, res, next) => {
  try {
    const emp = await Employee.findOneAndUpdate({ _id: req.params.id }, { active: false }, { new: true });
    if (!emp) return res.status(404).json({ success: false, message: 'Employee not found' });
    res.json({ success: true, message: 'Employee deleted' });
  } catch (err) { next(err); }
};

exports.bulkDeleteEmployees = async (req, res, next) => {
  try {
    const { ids } = req.body;
    await Employee.updateMany({ _id: { $in: ids } }, { active: false });
    res.json({ success: true, message: `${ids.length} employees deleted` });
  } catch (err) { next(err); }
};
