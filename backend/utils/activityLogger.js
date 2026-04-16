const Activity = require('../models/Activity');

/**
 * Log a system activity
 * @param {Object} req - The request object (to get req.user)
 * @param {String} entityId - The ID of the related Lead/Task
 * @param {String} entityType - 'Lead' or 'Task'
 * @param {String} action - 'created', 'updated', 'deleted', etc.
 * @param {Object} details - { field, oldValue, newValue, description, subject }
 */
 const logActivity = async (req, entityId, entityType, action, details = {}) => {
  try {
    const activityData = {
      type: 'system',
      action,
      entityType,
      relatedTo: entityId || null,
      onModel: details.onModel || entityType,
      createdBy: req.user ? req.user.id : (details.createdBy || null),
      subject: details.subject || `${entityType} ${action}`,
      description: details.description || '',
      field: details.field || null,
      oldValue: details.oldValue,
      newValue: details.newValue,
      requestUrl: req.originalUrl || req.url,
      requestMethod: req.method,
    };

    // Special case for manual "logged" activities if needed
    if (details.type) activityData.type = details.type;

    return await Activity.create(activityData);
  } catch (err) {
    console.error('Activity Logging Error:', err);
  }
};

/**
 * Log a record view
 */
const logRecordView = async (req, entityId, entityType, entityName) => {
  return logActivity(req, entityId, entityType, 'viewed', {
    subject: `Viewed ${entityType}: ${entityName || entityId}`,
    description: `User accessed the details of ${entityType} "${entityName || entityId}"`
  });
};

/**
 * Compare two objects and log changes for specified fields
 * @param {Object} req - Request object
 * @param {String} entityId - ID
 * @param {String} entityType - 'Lead' or 'Task'
 * @param {Object} oldData - Original data
 * @param {Object} newData - Updated data
 * @param {Array} fieldsToTrack - List of field names to track
 */
const logFieldChanges = async (req, entityId, entityType, oldData, newData, fieldsToTrack) => {
  const promises = [];

  fieldsToTrack.forEach(field => {
    let oldVal = oldData[field];
    let newVal = newData[field];

    // Handle ObjectIds (strings vs objects)
    if (oldVal && oldVal._id) oldVal = oldVal._id.toString();
    if (newVal && newVal._id) newVal = newVal._id.toString();
    
    // Normalize null/undefined
    if (oldVal === undefined) oldVal = null;
    if (newVal === undefined) newVal = null;

    if (String(oldVal) !== String(newVal)) {
      const description = `${field} changed from "${oldVal || 'None'}" to "${newVal || 'None'}"`;
      
      promises.push(logActivity(req, entityId, entityType, 'updated', {
        field,
        oldValue: oldVal,
        newValue: newVal,
        description,
        subject: `Updated ${field}`
      }));
    }
  });

  return Promise.all(promises);
};

module.exports = {
  logActivity,
  logFieldChanges,
  logRecordView
};
