const Admin = require('../models/Admin');
const ActivityLog = require('../models/ActivityLog');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Get all activity logs
const getAllActivities = async (req, res) => {
  try {
    // Get all activities from the last 24 hours (MongoDB TTL index will auto-delete older ones)
    const activities = await ActivityLog.find({})
      .populate('userId', 'username')
      .sort({ timestamp: -1 })
      .limit(100); // Limit to last 100 activities

    res.json({
      success: true,
      activities
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching activities'
    });
  }
};

// Log a new activity
const logActivity = async (req, res) => {
  try {
    const { type, description } = req.body;
    
    // Validate required fields
    if (!type || !description) {
      return res.status(400).json({
        success: false,
        message: 'Type and description are required'
      });
    }

    // Get user IP and user agent from request
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    // Create new activity log
    const activity = new ActivityLog({
      type,
      description,
      ipAddress,
      userAgent
    });

    await activity.save();

    res.status(201).json({
      success: true,
      message: 'Activity logged successfully',
      activity
    });
  } catch (error) {
    console.error('Error logging activity:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while logging activity'
    });
  }
};

// Update admin credentials
const updateAdminCredentials = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    // Find the admin (assuming we're updating the first/only admin)
    let admin = await Admin.findOne();
    
    if (!admin) {
      // If no admin exists, create one
      admin = new Admin({
        username,
        password
      });
    } else {
      // Update existing admin
      admin.username = username;
      admin.password = password; // This will be hashed by the pre-save middleware
    }

    await admin.save();

    res.json({
      success: true,
      message: 'Admin credentials updated successfully',
      admin: {
        id: admin._id,
        username: admin.username,
        createdAt: admin.createdAt
      }
    });
  } catch (error) {
    console.error('Error updating admin credentials:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating admin credentials'
    });
  }
};
// Admin login
const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    // Find admin by username
    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Compare password
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    admin.lastLogin = Date.now();
    await admin.save();

    // Generate JWT token only if JWT_SECRET is set
    let token = null;
    if (process.env.JWT_SECRET) {
      token = jwt.sign(
        { id: admin._id, username: admin.username },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
    }

    res.json({
      success: true,
      message: 'Login successful',
      token, // Can be null if JWT_SECRET not set
      admin: {
        id: admin._id,
        username: admin.username,
        lastLogin: admin.lastLogin
      }
    });
  } catch (error) {
    console.error('Error during admin login:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message // Include error message for debugging
    });
  }
};

// Get admin profile
const getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findOne();
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    res.json({
      success: true,
      admin: {
        id: admin._id,
        username: admin.username,
        createdAt: admin.createdAt,
        lastLogin: admin.lastLogin
      }
    });
  } catch (error) {
    console.error('Error fetching admin profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching admin profile'
    });
  }
};

const initializeDefaultAdmin = async () => {
  try {
    console.log("🔄 Checking admin...");

    const adminCount = await Admin.countDocuments();
    console.log("Admin count:", adminCount);

    console.log("ENV USER:", process.env.ADMIN_USERNAME);
    console.log("ENV PASS:", process.env.ADMIN_PASSWORD);

    if (adminCount === 0) {
      if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD) {
        console.log("❌ ADMIN env variables missing");
        return;
      }

      console.log("⚡ Creating default admin...");

      const defaultAdmin = new Admin({
        username: process.env.ADMIN_USERNAME,
        password: process.env.ADMIN_PASSWORD
      });

      await defaultAdmin.save();

      console.log("✅ Default admin created");
    } else {
      console.log("ℹ️ Admin already exists");
    }
  } catch (error) {
    console.error('❌ Error initializing admin:', error);
  }
};
module.exports = {
  getAllActivities,
  logActivity,
  updateAdminCredentials,
  adminLogin,
  getAdminProfile,
  initializeDefaultAdmin
};
