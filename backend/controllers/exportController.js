const User = require('../models/User');
const Lead = require('../models/Lead');
const Contact = require('../models/Contact');
const Ticket = require('../models/Ticket');
const Task = require('../models/Task');
const Deal = require('../models/Deal');
const Account = require('../models/Account');
const Activity = require('../models/Activity');
const CustomerActivity = require('../models/CustomerActivity');
const Role = require('../models/Role');
const APIFeatures = require('../utils/apiFeatures');

const flattenObject = (obj, prefix = '') => {
  return Object.keys(obj || {}).reduce((acc, key) => {
    // Ignore database ids / internal fields in exports
    if (key === '_id' || key === '__v') return acc;

    const pre = prefix ? `${prefix}.` : '';
    const val = obj[key];

    if (
      val &&
      typeof val === 'object' &&
      !Array.isArray(val) &&
      !(val instanceof Date) &&
      !(val instanceof require('mongoose').Types.ObjectId)
    ) {
      Object.assign(acc, flattenObject(val, pre + key));
    } else if (Array.isArray(val)) {
      acc[pre + key] = val.map(v => typeof v === 'object' ? JSON.stringify(v) : v).join(', ');
    } else {
      acc[pre + key] = val === null || val === undefined ? '' : val;
    }
    return acc;
  }, {});
};

const toCSV = (rows, requestedColumns) => {
  // If no rows, try to derive columns from requestedColumns if they exist
  let headers = requestedColumns;
  if (!headers || headers.length === 0) {
    if (rows.length > 0) {
      headers = Object.keys(rows[0]);
    } else {
      return '';
    }
  }

  const csvRows = [headers.join(',')];

  for (const row of rows) {
    const values = headers.map((h) => {
      // Data is already flattened, so we can access row[h] directly.
      let val = row[h];
      if (val === undefined && h.includes('.')) {
        val = h.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : ''), row);
      }
      
      const str = val === null || val === undefined ? '' : String(val);
      // Escape commas and quotes for CSV safety
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
};

// @desc    Export module data as CSV
// @route   GET /api/export/:module
// @access  Private
exports.exportData = async (req, res, next) => {
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
      activities: CustomerActivity,
      roles: Role
    };

    const Model = modelMap[module];
    if (!Model) {
      return res.status(400).json({ success: false, message: 'Invalid module' });
    }

    // Use APIFeatures for consistent filtering/searching (but skip pagination)
    const baseQuery = Model.find();
    
    // Add default active filter if applicable
    if (Model.schema.paths.active) {
      baseQuery.find({ active: { $ne: false } });
    }

    const features = new APIFeatures(baseQuery, req.query);
    
    // Auto-resolve references based on module
    const refConfig = {
      leads: { account: { model: 'Account', field: 'name' }, assignedTo: { model: 'User', field: 'name' } },
      contacts: { account: { model: 'Account', field: 'name' }, assignedTo: { model: 'User', field: 'name' } },
      deals: { account: { model: 'Account', field: 'name' }, contact: { model: 'Contact', field: 'name' }, assignedTo: { model: 'User', field: 'name' } },
      tasks: { assignedTo: { model: 'User', field: 'name' } },
      activities: { createdBy: { model: 'User', field: 'name' } }
    };

    if (refConfig[module]) {
      await features.resolveRefs(refConfig[module]);
    }

    features
      .filter()
      .search(module === 'deals' || module === 'roles' ? ['name'] : ['name', 'email', 'subject'])
      .sort();

    // Population for human-readable names in export
    if (['leads', 'contacts', 'deals', 'tasks', 'activities', 'tickets', 'accounts', 'users'].includes(module)) {
      if (!['activities', 'users', 'roles', 'accounts'].includes(module)) {
        features.query = features.query.populate('assignedTo', 'name email');
      }
      if (['leads', 'contacts', 'deals'].includes(module)) {
        features.query = features.query.populate('account', 'name website');
      }
      if (module === 'deals' || module === 'tickets') {
        features.query = features.query.populate('contact', 'name email');
      }
      if (module === 'accounts') {
        features.query = features.query.populate('owner', 'name email');
      }
      if (module === 'users') {
        features.query = features.query.populate('role', 'name');
      }
      if (['tasks', 'activities'].includes(module)) {
        features.query = features.query.populate('relatedTo', 'name subject title');
      }
      if (module === 'activities') {
        features.query = features.query.populate('createdBy', 'name');
      }
    }

    let docs = await features.query.lean();
    docs = JSON.parse(JSON.stringify(docs));

    // Column selection from query param: ?columns=name,email,phone
    const requestedColumns = req.query.columns ? req.query.columns.split(',') : null;

    const rows = docs.map((doc) => {
      const flat = flattenObject(doc);
      if (requestedColumns) {
        return requestedColumns.reduce((acc, col) => {
          acc[col] = flat[col] !== undefined ? flat[col] : '';
          return acc;
        }, {});
      }
      return flat;
    });

    const csv = toCSV(rows, requestedColumns);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${module}_export_${Date.now()}.csv"`);
    res.send(csv);
  } catch (err) {
    next(err);
  }
};

