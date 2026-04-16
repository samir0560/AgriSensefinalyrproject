const mongoose = require('mongoose');

const irrigationSchema = new mongoose.Schema({
  cropType: {
    type: String,
    required: true,
    trim: true
  },
  method: {
    type: String,
    required: true,
    trim: true
  },
  waterAmount: {
    type: Number, // in mm or liters per square meter
    required: true,
    min: 0
  },
  frequency: {
    type: String, // daily, weekly, etc.
    required: true,
    trim: true
  },
  duration: {
    type: Number, // in minutes
    min: 0
  },
  timing: {
    type: String, // morning, evening, etc.
    trim: true
  },
  season: {
    type: String,
    trim: true
  },
  soilType: {
    type: String,
    trim: true
  },
  temperatureThreshold: {
    type: Number // temperature at which irrigation frequency should change
  },
  humidityThreshold: {
    type: Number // humidity level that affects irrigation needs
  },
  growthStage: {
    type: String,
    trim: true
  },
  efficiency: {
    type: String, // high, medium, low
    trim: true
  },
  waterSource: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  notes: [{
    type: String,
    trim: true
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
irrigationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Irrigation', irrigationSchema);