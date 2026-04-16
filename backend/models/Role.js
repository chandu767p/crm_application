const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Role name is required'],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    permissions: [
      {
        type: String,
        enum: [
          'dashboard',
          'users',
          'leads',
          'contacts',
          'roles',
          'tickets',
          'tasks',
          'deals',
          'accounts',
          'activities',
          'calls',
          'emails',
          'meetings',
          'employees',
          'projects',
          'calendar',
          'email-templates'
        ],
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Role', roleSchema);
