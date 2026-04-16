const EmailTemplate = require('../models/EmailTemplate');

const ALLOWED_FIELDS = ['name', 'subject', 'body', 'category', 'active'];

const DEFAULT_SAMPLE_DATA = {
  name: 'John Doe',
  company: 'Acme Corp',
  email: 'john@acme.com',
  date: new Date().toLocaleDateString(),
  agent: 'Sales Agent',
  proposalValue: '$12,500',
};

const pickAllowedFields = (payload = {}) =>
  ALLOWED_FIELDS.reduce((acc, key) => {
    if (payload[key] !== undefined) acc[key] = payload[key];
    return acc;
  }, {});

const renderTemplateString = (template = '', sampleData = {}) =>
  template.replace(/{{\s*([\w.]+)\s*}}/g, (_match, key) => {
    const value = sampleData[key];
    return value === undefined || value === null ? `{{${key}}}` : String(value);
  });

const buildSampleData = (sampleData = {}, user) => ({
  ...DEFAULT_SAMPLE_DATA,
  agent: user?.name || DEFAULT_SAMPLE_DATA.agent,
  ...sampleData,
});

exports.getTemplates = async (req, res, next) => {
  try {
    const {
      search,
      category,
      active,
      page = 1,
      limit = 20,
      sort = '-updatedAt',
    } = req.query;

    const parsedPage = Number(page) || 1;
    const parsedLimit = Number(limit) || 20;
    const query = {};

    if (category) query.category = category;
    if (active === 'true' || active === 'false') query.active = active === 'true';
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { body: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await EmailTemplate.countDocuments(query);
    const data = await EmailTemplate.find(query)
      .populate('createdBy', 'name email')
      .sort(sort)
      .skip((parsedPage - 1) * parsedLimit)
      .limit(parsedLimit);

    res.json({
      success: true,
      data,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        pages: Math.ceil(total / parsedLimit) || 1,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getTemplate = async (req, res, next) => {
  try {
    const template = await EmailTemplate.findById(req.params.id).populate('createdBy', 'name email');

    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    res.json({ success: true, data: template });
  } catch (err) {
    next(err);
  }
};

exports.createTemplate = async (req, res, next) => {
  try {
    const payload = pickAllowedFields(req.body);
    const template = await EmailTemplate.create({
      ...payload,
      createdBy: req.user._id,
    });

    await template.populate('createdBy', 'name email');

    res.status(201).json({ success: true, data: template });
  } catch (err) {
    next(err);
  }
};

exports.updateTemplate = async (req, res, next) => {
  try {
    const payload = pickAllowedFields(req.body);
    const template = await EmailTemplate.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    }).populate('createdBy', 'name email');

    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    res.json({ success: true, data: template });
  } catch (err) {
    next(err);
  }
};

exports.deleteTemplate = async (req, res, next) => {
  try {
    const template = await EmailTemplate.findByIdAndDelete(req.params.id);

    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    res.json({ success: true, message: 'Template deleted' });
  } catch (err) {
    next(err);
  }
};

exports.previewTemplate = async (req, res, next) => {
  try {
    const template = await EmailTemplate.findById(req.params.id);

    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    const sampleData = buildSampleData(req.body?.sampleData, req.user);
    const subject = renderTemplateString(template.subject, sampleData);
    const preview = renderTemplateString(template.body, sampleData);

    res.json({ success: true, subject, preview, sampleData });
  } catch (err) {
    next(err);
  }
};
