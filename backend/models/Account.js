const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Account name is required'],
      trim: true,
      unique: true,
      maxlength: [100, 'Account name cannot exceed 100 characters'],
    },
    website: {
      type: String,
      trim: true,
    },
    industry: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    address: {
      street: String,
      city: String,
      state: String,
      zip: String,
      country: String,
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
  },
  { timestamps: true }
);

accountSchema.index({ name: 'text', description: 'text' });
accountSchema.index({ industry: 1 });

module.exports = mongoose.model('Account', accountSchema);
