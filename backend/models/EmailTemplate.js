const mongoose = require('mongoose');

const emailTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Template name is required'],
      trim: true,
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    body: {
      type: String,
      required: [true, 'Body is required'],
    },
    category: {
      type: String,
      enum: ['followup', 'welcome', 'proposal', 'custom'],
      default: 'custom',
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

emailTemplateSchema.index({ name: 'text', subject: 'text' });
emailTemplateSchema.index({ category: 1 });

module.exports = mongoose.model('EmailTemplate', emailTemplateSchema);
