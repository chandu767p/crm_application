const mongoose = require('mongoose');

const calendarEventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: { type: String, trim: true },
    start: { type: Date, required: [true, 'Start date is required'] },
    end: { type: Date, required: [true, 'End date is required'] },
    allDay: { type: Boolean, default: false },
    type: {
      type: String,
      enum: ['meeting', 'call', 'task', 'reminder', 'event'],
      default: 'event',
    },
    color: { type: String, default: '#2563eb' },
    relatedTo: { type: mongoose.Schema.Types.ObjectId, refPath: 'onModel' },
    onModel: {
      type: String,
      enum: ['Lead', 'Contact', 'Account', 'Deal', 'Task'],
    },
    attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    location: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

calendarEventSchema.index({ start: 1, end: 1 });
calendarEventSchema.index({ createdBy: 1 });

module.exports = mongoose.model('CalendarEvent', calendarEventSchema);
