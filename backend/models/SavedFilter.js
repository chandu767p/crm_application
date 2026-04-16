const mongoose = require('mongoose');

const savedFilterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Filter name is required'],
      trim: true,
    },
    module: {
      type: String,
      required: [true, 'Module is required'],
      enum: ['leads', 'contacts', 'deals', 'accounts', 'tasks', 'tickets', 'employees', 'projects'],
    },
    filters: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    isDefault: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

savedFilterSchema.index({ module: 1, createdBy: 1 });

module.exports = mongoose.model('SavedFilter', savedFilterSchema);
