const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema(
  {
    street: String,
    city: String,
    state: String,
    zip: String,
    country: String,
  },
  { _id: false }
);

const contactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    phone: {
      type: String,
      trim: true,
      maxlength: [20, 'Phone cannot exceed 20 characters'],
    },
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
    },
    jobTitle: {
      type: String,
      trim: true,
    },
    address: addressSchema,
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    status: {
      type: String,
      default: 'active',
    },
    source: {
      type: String,
      enum: ['website', 'referral', 'social_media', 'email_campaign', 'cold_call', 'event', 'other'],
      default: 'other',
    },
    active: {
      type: Boolean,
      default: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

contactSchema.index({ name: 'text', email: 'text' });
contactSchema.index({ account: 1 });
contactSchema.index({ tags: 1 });

module.exports = mongoose.model('Contact', contactSchema);
