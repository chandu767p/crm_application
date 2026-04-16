const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['system'],
      default: 'system',
    },
    action: {
      type: String,
      enum: ['created', 'updated', 'deleted', 'note_added', 'note_updated', 'note_deleted', 'status_changed', 'assigned', 'converted', 'logged'],
      default: 'logged',
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      maxlength: [200],
    },
    description: {
      type: String,
      trim: true,
    },
    field: {
      type: String,
      trim: true,
    },
    oldValue: {
      type: mongoose.Schema.Types.Mixed,
    },
    newValue: {
      type: mongoose.Schema.Types.Mixed,
    },
    entityType: {
      type: String,
      enum: ['Lead', 'Contact', 'Account', 'Deal', 'Task', 'Note'],
    },
    activityDate: {
      type: Date,
      default: Date.now,
    },
    relatedTo: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'onModel',
      required: true,
    },
    onModel: {
      type: String,
      enum: ['Lead', 'Contact', 'Account', 'Deal'],
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

activitySchema.index({ relatedTo: 1 });
activitySchema.index({ activityDate: -1 });

module.exports = mongoose.model('Activity', activitySchema);
