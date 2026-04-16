const SavedFilter = require('../models/SavedFilter');

exports.getSavedFilters = async (req, res, next) => {
  try {
    const { module } = req.query;
    const query = { active: true, createdBy: req.user.id };
    if (module) query.module = module;
    const data = await SavedFilter.find(query).sort('-createdAt');
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

exports.createSavedFilter = async (req, res, next) => {
  try {
    const { name, module, filters, isDefault } = req.body;
    if (isDefault) {
      await SavedFilter.updateMany({ module, createdBy: req.user.id }, { isDefault: false });
    }
    const saved = await SavedFilter.create({ name, module, filters, isDefault: !!isDefault, createdBy: req.user.id });
    res.status(201).json({ success: true, data: saved });
  } catch (err) { next(err); }
};

exports.setDefaultFilter = async (req, res, next) => {
  try {
    const filter = await SavedFilter.findOne({ _id: req.params.id, createdBy: req.user.id });
    if (!filter) return res.status(404).json({ success: false, message: 'Filter not found' });
    // Unset all defaults for this module+user, then set this one
    await SavedFilter.updateMany({ module: filter.module, createdBy: req.user.id }, { isDefault: false });
    filter.isDefault = true;
    await filter.save();
    res.json({ success: true, data: filter });
  } catch (err) { next(err); }
};

exports.deleteSavedFilter = async (req, res, next) => {
  try {
    await SavedFilter.findOneAndUpdate({ _id: req.params.id, createdBy: req.user.id }, { active: false });
    res.json({ success: true, message: 'Filter deleted' });
  } catch (err) { next(err); }
};
