const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    phone: { type: String, trim: true },
    department: {
      type: String,
      enum: ['sales', 'marketing', 'engineering', 'support', 'hr', 'finance', 'operations', 'other'],
      default: 'other',
    },
    position: { type: String, trim: true },
    salary: { type: Number, default: 0 },
    joinDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['active', 'inactive', 'on_leave'],
      default: 'active',
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    avatar: { type: String },
    notes: { type: String, trim: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

employeeSchema.index({ name: 'text', email: 'text' });
employeeSchema.index({ department: 1 });
employeeSchema.index({ status: 1 });

module.exports = mongoose.model('Employee', employeeSchema);
