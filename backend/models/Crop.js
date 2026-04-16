const mongoose = require('mongoose');

const cropSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  season: {
    type: String,
    required: true,
    trim: true
  },
  optimalPH: {
    type: Number,
    min: 0,
    max: 14
  },
  pHTolerance: {
    type: Number,
    default: 1.0
  },
  optimalNitrogen: {
    type: Number,
    min: 0
  },
  optimalPhosphorus: {
    type: Number,
    min: 0
  },
  optimalPotassium: {
    type: Number,
    min: 0
  },
  minTemperature: {
    type: Number
  },
  maxTemperature: {
    type: Number
  },
  optimalHumidity: {
    type: Number,
    min: 0,
    max: 100
  },
  minRainfall: {
    type: Number
  },
  maxRainfall: {
    type: Number
  },
  growthPeriod: {
    type: Number, // in days
    min: 0
  },
  description: {
    type: String,
    trim: true
  },
  image: {
    type: String,
    trim: true
  },
  marketDemand: {
    type: Number, // 1-5 scale
    min: 1,
    max: 5
  },
  seasons: [{
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
cropSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Crop', cropSchema);