const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const db = require('./database');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails[0].value;
      const name = profile.displayName;
      const googleId = profile.id;

      // Check if user exists
      const [existingUsers] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

      if (existingUsers.length > 0) {
        // User exists, update google_id if not set
        const user = existingUsers[0];
        if (!user.google_id) {
          await db.query('UPDATE users SET google_id = ? WHERE id = ?', [googleId, user.id]);
        }
        return done(null, user);
      }

      // Create new user
      const [result] = await db.query(
        'INSERT INTO users (name, email, google_id) VALUES (?, ?, ?)',
        [name, email, googleId]
      );

      const newUser = {
        id: result.insertId,
        name,
        email,
        google_id: googleId
      };

      return done(null, newUser);
    } catch (error) {
      return done(error, null);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const [users] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
    done(null, users[0]);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
