const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { generateVerificationCode, sendVerificationEmail } = require('../utils/emailService');
const passport = require('../config/passport');

// Google OAuth - Initiate
router.get('/google', (req, res, next) => {
  console.log('🔵 Google OAuth initiated');
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false
  })(req, res, next);
});

// Google OAuth - Callback
router.get('/google/callback', 
  (req, res, next) => {
    console.log('🔵 Google callback received');
    passport.authenticate('google', { 
      session: false, 
      failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_auth_failed` 
    })(req, res, next);
  },
  async (req, res) => {
    try {
      console.log('🔵 Google auth successful, user:', req.user);
      
      // Generate JWT token
      const token = jwt.sign(
        { userId: req.user.id, type: 'user' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      console.log('🔵 Token generated, redirecting to complete profile');
      
      // Redirect to complete profile page
      res.redirect(`${process.env.FRONTEND_URL}/complete-profile?token=${token}`);
    } catch (error) {
      console.error('❌ Google callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
    }
  }
);

// Send verification code
router.post('/send-verification', [
  body('email').isEmail().withMessage('Invalid email address'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    // Check if email already registered
    const [existingUser] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Generate verification code
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store verification code
    await db.query(
      'INSERT INTO email_verifications (email, code, expires_at) VALUES (?, ?, ?)',
      [email, code, expiresAt]
    );

    // Send email
    await sendVerificationEmail(email, code);

    res.json({ message: 'Verification code sent to your email' });
  } catch (error) {
    console.error('Send verification error:', error);
    res.status(500).json({ message: 'Error sending verification code' });
  }
});

// Verify code
router.post('/verify-code', [
  body('email').isEmail(),
  body('code').isLength({ min: 6, max: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, code } = req.body;

    // Find verification code
    const [verifications] = await db.query(
      'SELECT * FROM email_verifications WHERE email = ? AND code = ? AND verified = FALSE AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
      [email, code]
    );

    if (verifications.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }

    // Mark as verified
    await db.query(
      'UPDATE email_verifications SET verified = TRUE WHERE id = ?',
      [verifications[0].id]
    );

    res.json({ message: 'Email verified successfully', verified: true });
  } catch (error) {
    console.error('Verify code error:', error);
    res.status(500).json({ message: 'Error verifying code' });
  }
});

// User Registration with email verification
router.post('/register', [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().withMessage('Invalid email address'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').optional().isMobilePhone(),
  body('verificationCode').isLength({ min: 6, max: 6 }).withMessage('Verification code required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, phone, address, verificationCode } = req.body;

    // Verify the code
    const [verifications] = await db.query(
      'SELECT * FROM email_verifications WHERE email = ? AND code = ? AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
      [email, verificationCode]
    );

    if (verifications.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }

    // Mark as verified
    await db.query(
      'UPDATE email_verifications SET verified = TRUE WHERE id = ?',
      [verifications[0].id]
    );

    // Check if user already exists
    const [existingUser] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const [result] = await db.query(
      'INSERT INTO users (name, email, password, phone, address) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, phone || null, address || null]
    );

    // Generate JWT token
    const token = jwt.sign(
      { userId: result.insertId, type: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: { id: result.insertId, name, email }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// User Login
router.post('/login', [
  body('email').isEmail(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = users[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, type: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Admin Login
router.post('/admin/login', [
  body('email').isEmail(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find admin
    const [admins] = await db.query('SELECT * FROM admin WHERE email = ?', [email]);
    if (admins.length === 0) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    const admin = admins[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, admin.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: admin.id, type: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Admin login successful',
      token,
      admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error during admin login' });
  }
});

module.exports = router;
