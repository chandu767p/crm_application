const express = require('express');
const http = require('http');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

// Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// Attach io to every request for use in controllers
app.use((req, _res, next) => { req.io = io; next(); });

// Socket authentication + connection
io.on('connection', (socket) => {
  const userId = socket.handshake.query.userId;
  if (userId) socket.join(`user:${userId}`);
  socket.on('disconnect', () => {});
});

// Export io for controllers
exports.io = io;

app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ─── Routes ───────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/roles', require('./routes/roles'));
app.use('/api/leads', require('./routes/leads'));
app.use('/api/contacts', require('./routes/contacts'));
app.use('/api/accounts', require('./routes/accounts'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/tickets', require('./routes/tickets'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/deals', require('./routes/deals'));
app.use('/api/activities', require('./routes/activities'));
app.use('/api/customer-activities', require('./routes/customerActivities'));
app.use('/api/bulk-upload', require('./routes/bulkUpload'));
app.use('/api/export', require('./routes/export'));
app.use('/api', require('./routes/notes'));

// ─── New Feature Routes ────────────────────────────────────
app.use('/api/employees', require('./routes/employees'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/email-templates', require('./routes/emailTemplates'));
app.use('/api/calendar', require('./routes/calendar'));
app.use('/api/saved-filters', require('./routes/savedFilters'));

app.get('/api/health', (_req, res) => res.json({ status: 'OK', timestamp: new Date() }));

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}\n`);
  console.log(`   🔌 Socket.IO attached\n`);
});

module.exports = { app, io };
