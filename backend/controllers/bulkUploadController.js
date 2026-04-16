const xlsx = require('xlsx');
const { parse } = require('csv-parse/sync');
const User = require('../models/User');
const Lead = require('../models/Lead');
const Contact = require('../models/Contact');
const Ticket = require('../models/Ticket');
const Task = require('../models/Task');
const Deal = require('../models/Deal');
const Account = require('../models/Account');
const Activity = require('../models/Activity');

const parseFile = (file) => {
  const ext = file.originalname.split('.').pop().toLowerCase();

  if (ext === 'csv') {
    const content = file.buffer.toString('utf-8');
    return parse(content, { columns: true, skip_empty_lines: true, trim: true });
  }

  if (ext === 'xlsx' || ext === 'xls') {
    const workbook = xlsx.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    return xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
  }

  throw new Error('Unsupported file format. Use CSV or XLSX.');
};

const validateRow = (row, module) => {
  const errors = [];
  
  // Name is base requirement for most entities
  if (module !== 'tickets' && module !== 'tasks' && module !== 'activities') {
    if (!row.name || !String(row.name).trim()) errors.push('name is required');
  }

  if (row.email && !/^\S+@\S+\.\S+$/.test(row.email)) {
    errors.push('invalid email format');
  }

  if (module === 'users') {
    if (!row.email) errors.push('email is required');
    if (!row.password || String(row.password).length < 6) {
      errors.push('password must be at least 6 characters');
    }
  }

  if (module === 'leads') {
    const validStatuses = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];
    if (row.status && !validStatuses.includes(row.status)) {
      errors.push(`status must be one of: ${validStatuses.join(', ')}`);
    }
  }

  if (module === 'deals') {
    const validStages = ['prospect', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];
    if (!row.value) errors.push('value is required');
    if (row.stage && !validStages.includes(row.stage)) {
      errors.push(`stage must be one of: ${validStages.join(', ')}`);
    }
  }

  if (module === 'accounts') {
    if (!row.name) errors.push('account name is required');
  }

  if (module === 'tickets') {
    const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (!row.subject || !String(row.subject).trim()) errors.push('subject is required');
    if (row.status && !validStatuses.includes(row.status)) errors.push(`status must be one of: ${validStatuses.join(', ')}`);
    if (row.priority && !validPriorities.includes(row.priority)) errors.push(`priority must be one of: ${validPriorities.join(', ')}`);
  }

  if (module === 'tasks') {
    const validStatuses = ['pending', 'in_progress', 'completed'];
    const validPriorities = ['low', 'medium', 'high'];
    if (!row.title || !String(row.title).trim()) errors.push('title is required');
    if (row.status && !validStatuses.includes(row.status)) errors.push(`status must be one of: ${validStatuses.join(', ')}`);
    if (row.priority && !validPriorities.includes(row.priority)) errors.push(`priority must be one of: ${validPriorities.join(', ')}`);
  }

  if (module === 'activities') {
    const validTypes = ['call', 'email', 'meeting', 'note'];
    if (!row.type || !validTypes.includes(row.type)) errors.push(`type must be one of: ${validTypes.join(', ')}`);
    if (!row.subject) errors.push('subject is required');
    if (!row.relatedTo) errors.push('relatedTo (ID) is required for activities');
    if (!row.onModel) errors.push('onModel (Lead/Contact/Account/Deal) is required');
  }

  return errors;
};

// @desc    Bulk upload for any module
// @route   POST /api/bulk-upload/:module
// @access  Private
exports.bulkUpload = async (req, res, next) => {
  try {
    const { module } = req.params;
    const modelMap = {
      users: User,
      leads: Lead,
      contacts: Contact,
      tickets: Ticket,
      tasks: Task,
      deals: Deal,
      accounts: Account,
      activities: Activity
    };

    if (!modelMap[module]) {
      return res.status(400).json({ success: false, message: 'Invalid module' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    let rows;
    try {
      rows = parseFile(req.file);
    } catch (parseErr) {
      return res.status(400).json({ success: false, message: parseErr.message });
    }

    if (rows.length === 0) {
      return res.status(400).json({ success: false, message: 'File is empty' });
    }

    const results = { success: 0, errors: [] };
    const Model = modelMap[module];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;

      const validationErrors = validateRow(row, module);
      if (validationErrors.length > 0) {
        results.errors.push({ row: rowNum, data: row, errors: validationErrors });
        continue;
      }

      try {
        // Module specific transformations
        if (module === 'contacts' && row.tags) {
          row.tags = String(row.tags).split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
        }

        // Expand dots for nested fields (e.g., address.street)
        const expanded = {};
        Object.entries(row).forEach(([key, value]) => {
          if (value === '' || value === null || value === undefined) return;
          
          const keys = key.split('.');
          let current = expanded;
          for (let k = 0; k < keys.length; k++) {
            const part = keys[k];
            if (k === keys.length - 1) {
              current[part] = value;
            } else {
              current[part] = current[part] || {};
              current = current[part];
            }
          }
        });

        await Model.create({ ...expanded, ...row, ...(module === 'activities' ? { createdBy: req.user.id } : {}) });
        results.success++;
      } catch (createErr) {
        let errMsg = createErr.message;
        if (createErr.code === 11000) errMsg = 'Duplicate entry detected';
        results.errors.push({ row: rowNum, data: row, errors: [errMsg] });
      }
    }

    res.json({
      success: true,
      message: `Upload complete: ${results.success} created, ${results.errors.length} failed`,
      data: results,
    });
  } catch (err) {
    next(err);
  }
};
