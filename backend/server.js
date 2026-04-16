const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();
const { Server } = require('socket.io');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const passport = require('passport');
require('./config/passport');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

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

app.use(passport.initialize());
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || '*' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: 'Too many requests from this IP, please try again after 15 minutes',
});
app.use('/api/', limiter);

// Logging with Winston instead of Morgan
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

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
app.use('/api/settings', require('./routes/settings'));

app.get('/api/health', (_req, res) => res.json({ status: 'OK', timestamp: new Date() }));

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
if (require.main === module) {
  server.listen(PORT, () => {
    logger.info(`🚀 Server running on http://localhost:${PORT}`);
    logger.info(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`   🔌 Socket.IO attached`);
  });
}

module.exports = { app, io, server };
