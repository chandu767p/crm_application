const mongoose = require('mongoose');

const customerActivitySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['call', 'email', 'meeting'],
      required: [true, 'Activity type is required'],
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
    duration: {
      type: Number, // In minutes
      default: 0,
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
      enum: ['Lead', 'Contact', 'Account', 'Deal', 'Task'],
      required: true,
    },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled'],
      default: 'completed',
    },
    purpose: {
      type: String,
      enum: ['discovery', 'follow_up', 'negotiation', 'support', 'demo', 'other'],
    },
    outcome: {
      type: String,
      enum: ['answered', 'no_answer', 'busy', 'left_voicemail', 'scheduled_follow_up', 'closed', 'refused'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

customerActivitySchema.index({ relatedTo: 1 });
customerActivitySchema.index({ activityDate: -1 });

module.exports = mongoose.model('CustomerActivity', customerActivitySchema);
