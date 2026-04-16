const express = require('express');
const router = express.Router();
const { getEvents, getAllEvents, getEvent, createEvent, updateEvent, deleteEvent } = require('../controllers/calendarController');
const { protect } = require('../middleware/auth');

router.get('/all', protect, getAllEvents);
router.route('/').get(protect, getEvents).post(protect, createEvent);
router.route('/:id').get(protect, getEvent).put(protect, updateEvent).delete(protect, deleteEvent);

module.exports = router;
