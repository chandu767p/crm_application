const CalendarEvent = require('../models/CalendarEvent');

exports.getEvents = async (req, res, next) => {
  try {
    const { start, end } = req.query;
    const query = { active: true, createdBy: req.user.id };
    if (start && end) {
      query.start = { $gte: new Date(start) };
      query.end = { $lte: new Date(end) };
    }
    const data = await CalendarEvent.find(query)
      .populate('attendees', 'name email')
      .populate('createdBy', 'name')
      .sort('start');
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

exports.getAllEvents = async (req, res, next) => {
  try {
    const { start, end } = req.query;
    const query = { active: true };
    if (start && end) {
      query.start = { $gte: new Date(start) };
      query.end = { $lte: new Date(end) };
    }
    const data = await CalendarEvent.find(query)
      .populate('attendees', 'name email')
      .populate('createdBy', 'name')
      .sort('start');
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

exports.getEvent = async (req, res, next) => {
  try {
    const event = await CalendarEvent.findOne({ _id: req.params.id, active: true })
      .populate('attendees', 'name email')
      .populate('createdBy', 'name');
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, data: event });
  } catch (err) { next(err); }
};

exports.createEvent = async (req, res, next) => {
  try {
    const event = await CalendarEvent.create({ ...req.body, createdBy: req.user.id });
    await event.populate('attendees', 'name email');
    res.status(201).json({ success: true, data: event });
  } catch (err) { next(err); }
};

exports.updateEvent = async (req, res, next) => {
  try {
    const event = await CalendarEvent.findOneAndUpdate(
      { _id: req.params.id, active: true },
      req.body,
      { new: true, runValidators: true }
    ).populate('attendees', 'name email');
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, data: event });
  } catch (err) { next(err); }
};

exports.deleteEvent = async (req, res, next) => {
  try {
    await CalendarEvent.findOneAndUpdate({ _id: req.params.id }, { active: false });
    res.json({ success: true, message: 'Event deleted' });
  } catch (err) { next(err); }
};
