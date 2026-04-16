const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: { expires: '24h' } // Automatically delete after 24 hours
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: false // Optional, in case of system activities
  },
  ipAddress: {
    type: String,
    required: false
  },
  userAgent: {
    type: String,
    required: false
  }
});

module.exports = mongoose.model('ActivityLog', activityLogSchema);