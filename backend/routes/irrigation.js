// Irrigation Routes
const express = require('express');
const router = express.Router();
const {
    getIrrigationRecommendation,
    getAllIrrigationMethods,
    getIrrigationMethodById
} = require('../controllers/irrigationController');
const { optionalUser } = require('../middleware/authUser');
const { recordFeatureResponse } = require('../middleware/recordFeatureResponse');

// @route   POST /api/irrigation/recommend
// @desc    Get irrigation recommendation based on parameters
// @access  Public (optional Bearer: saves result for logged-in users)
router.post('/recommend', optionalUser, recordFeatureResponse('irrigation'), getIrrigationRecommendation);

// @route   GET /api/irrigation
// @desc    Get all irrigation methods
// @access  Public
router.get('/', getAllIrrigationMethods);

// @route   GET /api/irrigation/:id
// @desc    Get irrigation method by ID
// @access  Public
router.get('/:id', getIrrigationMethodById);

module.exports = router;