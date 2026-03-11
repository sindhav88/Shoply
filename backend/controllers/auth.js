const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
console.log('JWT_SECRET:', process.env.JWT_SECRET);

// Reset password using token
exports.resetPassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const authHeader = req.headers['authorization'];
    if (!authHeader || !oldPassword || !newPassword) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    const token = authHeader.replace('Bearer ', '');
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired token.' });
    }
    const user = await User.findById(payload.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Old password is incorrect.' });
    }
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Failed to reset password.' });
  }
};
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Register a new user
exports.register = async (req, res) => {
  try {
    const { name, email, password, mobile, gender } = req.body;
    // Validate input
    if (!name || !email || !password || !mobile || !gender) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use.' });
    }
    // Create and save the new user
    const user = new User({
      name,
      email,
      password,
      mobile,
      gender
    });
    await user.save();
    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(201).json({ token, message: 'Registration successful.' });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed. Please try again later.' });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body;
    console.log('Login attempt:', { identifier, password: password ? '***' : undefined });
    // Validate input 
    if (!identifier || !password) {
      console.log('Login failed: Missing fields');
      return res.status(400).json({ error: 'All fields are required.' });
    }
    // Find user by email or mobile
    const user = await User.findOne({
      $or: [
        { email: identifier },
        { mobile: identifier }
      ]
    });
    if (!user) {
      console.log('Login failed: No user found for identifier', identifier);
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match:', isMatch);
    if (!isMatch) {
      console.log('Login failed: Incorrect password');
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    // Default admin credentials
    const DEFAULT_ADMIN_EMAIL = 'admin@gmail.com';
    const DEFAULT_ADMIN_PASSWORD = '121212';
    const DEFAULT_ADMIN_ROLE = 'admin';

    // Check for default admin login
    if (identifier === DEFAULT_ADMIN_EMAIL && password === DEFAULT_ADMIN_PASSWORD) {
      // Generate a dummy admin token
      const token = jwt.sign({ userId: 'admin', role: DEFAULT_ADMIN_ROLE }, process.env.JWT_SECRET, { expiresIn: '1h' });
      console.log('Default admin login successful');
      return res.json({ 
        userId: 'admin',
        token, 
        message: 'Admin login successful.',
        user: {
          name: 'Admin',
          email: DEFAULT_ADMIN_EMAIL,
          mobile: '9725247990',
          gender: 'male',
          role: DEFAULT_ADMIN_ROLE
        }
      });
    }
    // Generate JWT token for regular users
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    console.log('Login successful:', { userId: user._id, identifier });
    res.json({ userId: user._id, token, message: 'Login successful.' });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed. Please try again later.' });
  }
};

// Forgot password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    console.log('Forgot password attempt for:', email);
    
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      console.log('Forgot password failed: No user found for email', email);
      return res.status(404).json({ error: 'No account found with this email address.' });
    }
    
    // Generate reset token (valid for 1 hour)
    const resetToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    
    // In a real application, you would send an email here
    // For now, we'll just log the reset link
    const resetLink = `${req.protocol}://${req.get('host')}/auth/reset-password?token=${resetToken}`;
    console.log('Password reset link:', resetLink);
    
    // TODO: Send email with reset link
    // For development, you can check the console for the reset link
    
    res.json({ 
      message: 'Password reset link has been sent to your email address.',
      resetLink: resetLink // Remove this in production
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Failed to process password reset request.' });
  }
};