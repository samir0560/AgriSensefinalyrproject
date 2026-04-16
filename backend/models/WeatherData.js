const mongoose = require('mongoose');

const weatherDataSchema = new mongoose.Schema({

  temperature: {
    type: Number, // in Celsius
    required: true
  },
  humidity: {
    type: Number, // percentage
    required: true
  },
  pressure: {
    type: Number, // in hPa
    default: null
  },
  rainfall: {
    type: Number, // in mm
    default: 0
  },
  windSpeed: {
    type: Number, // in m/s
    default: 0
  },
  windDirection: {
    type: Number, // in degrees
    default: null
  },
  description: {
    type: String,
    trim: true
  },
  visibility: {
    type: Number, // in meters
    default: null
  },
  uvIndex: {
    type: Number,
    default: null
  },
  source: {
    type: String, // 'openweathermap', 'local', etc.
    default: 'openweathermap'
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for timestamp-based queries
weatherDataSchema.index({ timestamp: -1 });

module.exports = mongoose.model('WeatherData', weatherDataSchema);