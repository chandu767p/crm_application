const mongoose = require('mongoose');

const dealSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Deal name is required'],
      trim: true,
      maxlength: [100, 'Deal name cannot exceed 100 characters'],
    },
    value: {
      type: Number,
      required: [true, 'Deal value is required'],
      min: [0, 'Value cannot be negative'],
    },
    probability: {
      type: Number,
      default: 50,
      min: [0, 'Probability cannot be less than 0'],
      max: [100, 'Probability cannot be more than 100'],
    },
    stage: {
      type: String,
      enum: ['prospect', 'qualified', 'proposal', 'negotiation', 'won', 'lost'],
      default: 'prospect',
    },
    expectedCloseDate: {
      type: Date,
    },
    contact: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contact',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
    },
    notes: [
      {
        content: String,
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

dealSchema.index({ name: 'text' });
dealSchema.index({ stage: 1 });

module.exports = mongoose.model('Deal', dealSchema);
