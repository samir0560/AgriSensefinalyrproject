const mongoose = require('mongoose');

const soilDataSchema = new mongoose.Schema({

  pH: {
    type: Number, // pH level
    min: 0,
    max: 14,
    required: true
  },
  nitrogen: {
    type: Number, // in ppm or kg/ha
    required: true
  },
  phosphorus: {
    type: Number, // in ppm or kg/ha
    required: true
  },
  potassium: {
    type: Number, // in ppm or kg/ha
    required: true
  },
  organicMatter: {
    type: Number, // percentage
    default: null
  },
  moisture: {
    type: Number, // percentage
    default: null
  },
  temperature: {
    type: Number, // in Celsius
    default: null
  },
  soilType: {
    type: String, // sandy, clay, loamy, etc.
    trim: true
  },
  conductivity: {
    type: Number, // electrical conductivity
    default: null
  },
  texture: {
    type: String, // clay, silt, sand percentages
    trim: true
  },
  color: {
    type: String,
    trim: true
  },
  depth: {
    type: Number, // in cm
    default: null
  },
  drainage: {
    type: String, // good, moderate, poor
    trim: true
  },
  compaction: {
    type: Number, // 1-5 scale
    min: 1,
    max: 5,
    default: null
  },
  salinity: {
    type: Number, // in dS/m
    default: null
  },
  cationExchangeCapacity: {
    type: Number, // in meq/100g
    default: null
  },
  calcium: {
    type: Number, // in ppm
    default: null
  },
  magnesium: {
    type: Number, // in ppm
    default: null
  },
  sulfur: {
    type: Number, // in ppm
    default: null
  },
  iron: {
    type: Number, // in ppm
    default: null
  },
  zinc: {
    type: Number, // in ppm
    default: null
  },
  manganese: {
    type: Number, // in ppm
    default: null
  },
  copper: {
    type: Number, // in ppm
    default: null
  },
  boron: {
    type: Number, // in ppm
    default: null
  },
  collectedBy: {
    type: String, // who collected the data
    trim: true
  },
  collectionMethod: {
    type: String, // manual, sensor, etc.
    trim: true
  },
  source: {
    type: String, // 'field', 'lab', 'sensor', etc.
    default: 'field'
  },
  notes: {
    type: String, // additional notes
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for timestamp-based queries
soilDataSchema.index({ timestamp: -1 });

// Update the updatedAt field before saving
soilDataSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('SoilData', soilDataSchema);