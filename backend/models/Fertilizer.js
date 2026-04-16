const mongoose = require('mongoose');

const fertilizerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    trim: true
  },
  npk: {
    type: String, // Format: "N-P-K" e.g. "10-10-10"
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  suitableCrops: [{
    type: String,
    trim: true
  }],
  applicationRate: {
    type: Number, // kg per hectare
    min: 0
  },
  applicationMethod: {
    type: String,
    trim: true
  },
  frequency: {
    type: String,
    trim: true
  },
  bestSeason: {
    type: String,
    trim: true
  },
  composition: {
    nitrogen: {
      type: Number,
      min: 0
    },
    phosphorus: {
      type: Number,
      min: 0
    },
    potassium: {
      type: Number,
      min: 0
    }
  },
  benefits: [{
    type: String,
    trim: true
  }],
  image: {
    type: String,
    trim: true
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

// Update the updatedAt field before saving
fertilizerSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Fertilizer', fertilizerSchema);