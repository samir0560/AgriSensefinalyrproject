const Admin = require('../models/Admin');
const ActivityLog = require('../models/ActivityLog');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Get all activity logs
const getAllActivities = async (req, res) => {
  try {
    const activities = await ActivityLog.find({})
      .populate('userId', 'username')
      .sort({ timestamp: -1 })
      .limit(100);

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
    
    if (!type || !description) {
      return res.status(400).json({
        success: false,
        message: 'Type and description are required'
      });
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

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

    let admin = await Admin.findOne();
    
    if (!admin) {
      admin = new Admin({
        username,
        password
      });
    } else {
      admin.username = username;
      admin.password = password;
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

// Admin login - FIXED VERSION
const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log('Login attempt for username:', username);

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
      console.log('Admin not found:', username);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    console.log('Admin found, comparing password...');

    // Compare password
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      console.log('Password mismatch for:', username);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    console.log('Password matched for:', username);

    // Update last login
    admin.lastLogin = Date.now();
    await admin.save();

    // Generate JWT token - FIX: Always generate token, use default secret if not set
    const jwtSecret = process.env.JWT_SECRET || 'agrisense_default_secret_key_2024';
    if (!process.env.JWT_SECRET) {
      console.warn('⚠️ JWT_SECRET not set in environment variables. Using default secret. Please set JWT_SECRET in production!');
    }
    
    const token = jwt.sign(
      { id: admin._id, username: admin.username },
      jwtSecret,
      { expiresIn: '7d' }
    );

    console.log('Login successful for:', username);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        lastLogin: admin.lastLogin
      }
    });
  } catch (error) {
    console.error('Error during admin login:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message
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

// Initialize default admin - FIXED VERSION
const initializeDefaultAdmin = async () => {
  try {
    console.log("🔄 Checking admin...");
    
    // Make sure Admin model is accessible
    if (!Admin) {
      console.error("❌ Admin model not loaded");
      return;
    }
    
    const adminCount = await Admin.countDocuments();
    console.log("Admin count:", adminCount);

    console.log("ENV USER:", process.env.ADMIN_USERNAME);
    console.log("ENV PASS SET:", process.env.ADMIN_PASSWORD ? "Yes" : "No");

    if (adminCount === 0) {
      // Use environment variables or fallback defaults
      const defaultUsername = process.env.ADMIN_USERNAME || 'admin';
      const defaultPassword = process.env.ADMIN_PASSWORD || 'admin123';
      
      if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD) {
        console.log(`⚠️ Using default credentials: ${defaultUsername}/${defaultPassword}`);
        console.log("⚠️ Please set ADMIN_USERNAME and ADMIN_PASSWORD environment variables for security!");
      }

      console.log("⚡ Creating default admin...");

      const defaultAdmin = new Admin({
        username: defaultUsername,
        password: defaultPassword
      });

      await defaultAdmin.save();
      console.log(`✅ Default admin created with username: ${defaultUsername}`);
      console.log(`✅ You can now login with username: ${defaultUsername} and password: ${defaultPassword}`);
    } else {
      console.log("ℹ️ Admin already exists");
      // Log existing admin usernames (without passwords)
      const admins = await Admin.find({}).select('username');
      console.log("Existing admins:", admins.map(a => a.username));
    }
  } catch (error) {
    console.error('❌ Error initializing admin:', error);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
  }
};

// Debug function to check admin status (for troubleshooting)
const checkAdminStatus = async (req, res) => {
  try {
    const adminCount = await Admin.countDocuments();
    const admins = await Admin.find({}).select('username createdAt lastLogin');
    
    res.json({
      success: true,
      adminCount,
      admins: admins,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        JWT_SECRET_SET: !!process.env.JWT_SECRET,
        ADMIN_USERNAME_SET: !!process.env.ADMIN_USERNAME,
        ADMIN_PASSWORD_SET: !!process.env.ADMIN_PASSWORD
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  getAllActivities,
  logActivity,
  updateAdminCredentials,
  adminLogin,
  getAdminProfile,
  initializeDefaultAdmin,
  checkAdminStatus
};
