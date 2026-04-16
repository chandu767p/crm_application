const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const Role = require('../models/Role');
const logger = require('../utils/logger');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || 'missing',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'missing',
      callbackURL: `${process.env.BACKEND_URL || 'http://localhost:5039'}/api/auth/google/callback`,
      proxy: true,
    },
    async (accessToken, refreshToken, profile, done) => {
      if (process.env.GOOGLE_CLIENT_ID.includes('placeholder')) {
        logger.warn('Google login attempted with placeholder credentials. Please set real GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env');
        return done(new Error('Social Login not configured'), null);
      }
      try {
        const { id, displayName, emails, photos } = profile;
        const email = emails[0].value;
        const avatar = photos[0]?.value;

        // Check if user already exists by googleId
        let user = await User.findOne({ googleId: id });

        if (user) {
          logger.info(`Existing Google user logged in: ${email}`);
          return done(null, user);
        }

        // Check if user exists by email but no googleId
        user = await User.findOne({ email });

        if (user) {
          user.googleId = id;
          if (avatar && !user.avatar) user.avatar = avatar;
          await user.save({ validateBeforeSave: false });
          logger.info(`Linked Google account to existing email: ${email}`);
          return done(null, user);
        }

        // Create new user if doesn't exist
        // Find default 'sales' role
        let role = await Role.findOne({ name: 'sales' });
        if (!role) {
          role = await Role.findOne(); // Fallback to first available role
        }

        user = await User.create({
          name: displayName,
          email,
          googleId: id,
          avatar,
          role: role?._id,
          active: true,
          mustChangePassword: false,
        });

        logger.info(`New user created via Google OAuth: ${email}`);
        done(null, user);
      } catch (err) {
        logger.error('Error in Google Strategy callback:', err);
        done(err, null);
      }
    }
  )
);

// Passport session setup not strictly needed if using JWT, 
// but required for passport to work internally
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => done(err, user));
});
