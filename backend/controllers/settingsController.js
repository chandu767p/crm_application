const Setting = require('../models/Setting');
const logger = require('../utils/logger');

// @desc    Get all settings
// @route   GET /api/settings
// @access  Private/Admin
exports.getSettings = async (req, res, next) => {
  try {
    const settings = await Setting.find().populate('updatedBy', 'name email');
    res.json({ success: true, count: settings.length, settings });
  } catch (err) {
    next(err);
  }
};

// @desc    Get setting by key
// @route   GET /api/settings/:key
// @access  Private
exports.getSettingByKey = async (req, res, next) => {
  try {
    const setting = await Setting.findOne({ key: req.params.key });
    if (!setting) {
      return res.status(404).json({ success: false, message: 'Setting not found' });
    }
    res.json({ success: true, setting });
  } catch (err) {
    next(err);
  }
};

// @desc    Create or update setting
// @route   POST /api/settings
// @access  Private/Admin
exports.updateSetting = async (req, res, next) => {
  try {
    const { key, value, description, category } = req.body;
    
    let setting = await Setting.findOne({ key });
    
    if (setting) {
      setting.value = value;
      if (description) setting.description = description;
      if (category) setting.category = category;
      setting.updatedBy = req.user.id;
      await setting.save();
    } else {
      setting = await Setting.create({
        key,
        value,
        description,
        category,
        updatedBy: req.user.id
      });
    }

    logger.info(`Setting updated: ${key} by ${req.user.id}`);
    res.json({ success: true, setting });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete setting
// @route   DELETE /api/settings/:key
// @access  Private/Admin
exports.deleteSetting = async (req, res, next) => {
  try {
    const setting = await Setting.findOneAndDelete({ key: req.params.key });
    if (!setting) {
      return res.status(404).json({ success: false, message: 'Setting not found' });
    }
    res.json({ success: true, message: 'Setting deleted' });
  } catch (err) {
    next(err);
  }
};
