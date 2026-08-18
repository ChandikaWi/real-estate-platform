import User from '../models/User.js';
import Property from '../models/Property.js';
import Favorite from '../models/Favorite.js';
import Message from '../models/Message.js';
import generateToken from '../utils/generateToken.js';
import Notification from '../models/Notification.js';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';

// @desc    Register a new user
// @route   POST /api/auth/register
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role
    });

    // SMART ALERT - Notify all Admins of a new user
    const admins = await User.find({ role: 'admin' });
    const adminNotifs = admins.map(admin => ({
      userId: admin._id,
      type: 'system',
      message: `👋 New ${user.role} joined the platform: ${user.name}.`,
      link: '/admin/users'
    }));
    if (adminNotifs.length > 0) await Notification.insertMany(adminNotifs);
    
    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      // Block login if the user is banned by Admin
      if (user.isBanned) {
        return res.status(403).json({ message: 'Your account has been restricted by the administrator.' });
      }

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePhoto: user.profilePhoto,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    if (req.body.profilePhoto !== undefined) user.profilePhoto = req.body.profilePhoto;
    if (req.body.phoneNumber !== undefined) user.phoneNumber = req.body.phoneNumber;
    
    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      profilePhoto: updatedUser.profilePhoto,
      token: req.headers.authorization.split(' ')[1] // keep the same token
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete user account and associated data
// @route   DELETE /api/auth/profile
export const deleteUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Cascade Deletion to keep database clean
    if (user.role === 'seller') {
      await Property.deleteMany({ sellerId: user._id });
    }
    await Favorite.deleteMany({ userId: user._id });
    await Message.deleteMany({ $or: [{ senderId: user._id }, { receiverId: user._id }] });

    await user.deleteOne();
    res.json({ message: 'Account successfully deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Forgot Password - Generates token and sends email
// @route   POST /api/auth/forgot-password
export const forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      // Security best practice - Do not reveal if the email exists or not
      return res.status(200).json({ message: 'If an account with that email exists, a reset link has been sent.' });
    }

    // Generate a random 20-character hex token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash the token and save it to the database (with a 15-minute expiration)
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
    await user.save();

    // Create reset URL
    const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;

    // Configure Nodemailer
    const transporter = nodemailer.createTransport({
      service: 'Gmail', 
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const message = `
      <h1>Password Reset Request</h1>
      <p>You requested a password reset. Click the link below to set a new password:</p>
      <a href="${resetUrl}" clicktracking=off>${resetUrl}</a>
      <p>This link will expire in 15 minutes.</p>
    `;

    await transporter.sendMail({
      from: '"Premium Real Estate" <noreply@realestate.com>',
      to: user.email,
      subject: 'Password Reset Request',
      html: message,
    });

    res.status(200).json({ message: 'If an account with that email exists, a reset link has been sent.' });
  } catch (error) {
    // If email fails, clear the tokens so they can try again
    const user = await User.findOne({ email: req.body.email });
    if (user) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
    }
    res.status(500).json({ message: 'Email could not be sent' });
  }
};

// @desc    Reset Password - Verifies token and updates password
// @route   PUT /api/auth/reset-password/:token
export const resetPassword = async (req, res) => {
  try {
    // Re-hash the token from the URL to compare with the database
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }, // Ensure token hasn't expired
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};