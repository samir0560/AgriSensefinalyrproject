const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { FeatureResponse, FEATURE_TYPES } = require('../models/FeatureResponse');
const { cloneLimited } = require('../utils/featureResponseUtils');

const getSecret = () => process.env.JWT_SECRET || 'fallback_secret_key';

const signUserToken = (userId) =>
  jwt.sign({ userId: userId.toString() }, getSecret(), { expiresIn: '30d' });

const register = async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const nameTrimmed = name != null ? String(name).trim() : '';
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }
    if (!nameTrimmed || nameTrimmed.length < 2) {
      return res.status(400).json({ success: false, message: 'Name is required (at least 2 characters)' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }
    const normalized = String(email).trim().toLowerCase();
    const exists = await User.findOne({ email: normalized });
    if (exists) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }
    const user = new User({
      email: normalized,
      password,
      name: nameTrimmed
    });
    await user.save();

    const token = signUserToken(user._id);
    res.status(201).json({
      success: true,
      message: 'Account created',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }
    const normalized = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalized });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    const match = await user.comparePassword(password);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    user.lastLogin = Date.now();
    await user.save();

    const token = signUserToken(user._id);
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('getMe error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, email, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const nameTrimmed = name != null ? String(name).trim() : '';
    if (!nameTrimmed || nameTrimmed.length < 2) {
      return res.status(400).json({ success: false, message: 'Name is required (at least 2 characters)' });
    }

    if (!email || !String(email).trim()) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }
    const normalizedEmail = String(email).trim().toLowerCase();

    const wantsPasswordChange = newPassword != null && String(newPassword).length > 0;
    if (wantsPasswordChange) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is required to set a new password'
        });
      }
      const ok = await user.comparePassword(currentPassword);
      if (!ok) {
        return res.status(401).json({ success: false, message: 'Current password is incorrect' });
      }
      if (String(newPassword).length < 6) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters'
        });
      }
      user.password = newPassword;
    }

    if (normalizedEmail !== user.email) {
      const taken = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: user._id }
      });
      if (taken) {
        return res.status(400).json({ success: false, message: 'That email is already in use' });
      }
      user.email = normalizedEmail;
    }

    user.name = nameTrimmed;
    await user.save();

    const safe = await User.findById(user._id).select('-password');
    res.json({
      success: true,
      message: 'Profile updated',
      user: {
        id: safe._id,
        email: safe.email,
        name: safe.name,
        createdAt: safe.createdAt,
        lastLogin: safe.lastLogin
      }
    });
  } catch (error) {
    console.error('updateProfile error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'That email is already in use' });
    }
    res.status(500).json({ success: false, message: 'Server error while updating profile' });
  }
};

const logClientFeatureResult = async (req, res) => {
  try {
    const { featureType, request: reqSnap, response: respSnap } = req.body;
    if (!featureType || !FEATURE_TYPES.includes(featureType)) {
      return res.status(400).json({ success: false, message: 'Invalid feature type' });
    }
    await FeatureResponse.create({
      user: req.userId,
      featureType,
      request: cloneLimited(reqSnap || {}),
      response: cloneLimited(respSnap || {})
    });
    res.json({ success: true });
  } catch (error) {
    console.error('logClientFeatureResult error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getMyFeatureResponses = async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100);
    const skip = Math.max(parseInt(req.query.skip, 10) || 0, 0);
    const total = await FeatureResponse.countDocuments({ user: req.userId });
    const items = await FeatureResponse.find({ user: req.userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    res.json({
      success: true,
      total,
      data: items.map((doc) => ({
        id: String(doc._id),
        featureType: doc.featureType,
        request: doc.request,
        response: doc.response,
        createdAt: doc.createdAt
      }))
    });
  } catch (error) {
    console.error('getMyFeatureResponses error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  logClientFeatureResult,
  getMyFeatureResponses
};
