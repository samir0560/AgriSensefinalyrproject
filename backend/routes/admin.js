const express = require('express');
const router = express.Router();
const { 
  getAllActivities, 
  logActivity, 
  updateAdminCredentials, 
  adminLogin,
  getAdminProfile,
  checkAdminStatus
} = require('../controllers/adminController');

// @route   GET api/admin/activities
// @desc    Get all activity logs
// @access  Private
router.get('/activities', getAllActivities);

// @route   POST api/admin/activity
// @desc    Log a new activity
// @access  Public
router.post('/activity', logActivity);

// @route   PUT api/admin/credentials
// @desc    Update admin credentials
// @access  Private
router.put('/credentials', updateAdminCredentials);

// @route   POST api/admin/login
// @desc    Admin login
// @access  Public
router.post('/login', adminLogin);

// @route   GET api/admin/profile
// @desc    Get admin profile
// @access  Private
router.get('/profile', getAdminProfile);

// @route   GET api/admin/debug
// @desc    Debug endpoint to check admin status
// @access  Public (remove in production)
router.get('/debug', checkAdminStatus);

module.exports = router;
