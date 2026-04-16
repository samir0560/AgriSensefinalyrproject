const mongoose = require('mongoose');

const FEATURE_TYPES = [
  'crop',
  'fertilizer',
  'disease',
  'irrigation',
  'weather_current',
  'weather_forecast',
  'weather_historical',
  'soil_analysis',
  'soil_submit'
];

const featureResponseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  featureType: {
    type: String,
    required: true,
    enum: FEATURE_TYPES,
    index: true
  },
  request: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  response: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

featureResponseSchema.index({ user: 1, createdAt: -1 });

module.exports = {
  FeatureResponse: mongoose.model('FeatureResponse', featureResponseSchema),
  FEATURE_TYPES
};
