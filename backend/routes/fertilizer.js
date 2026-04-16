// Fertilizer Routes
const express = require('express');
const router = express.Router();
const {
    getFertilizerRecommendation,
    getAllFertilizers,
    getFertilizerById
} = require('../controllers/fertilizerController');
const { optionalUser } = require('../middleware/authUser');
const { recordFeatureResponse } = require('../middleware/recordFeatureResponse');

// @route   POST /api/fertilizer/recommend
// @desc    Get fertilizer recommendation based on parameters
// @access  Public (optional Bearer: saves result for logged-in users)
router.post('/recommend', optionalUser, recordFeatureResponse('fertilizer'), getFertilizerRecommendation);

// @route   GET /api/fertilizer
// @desc    Get all fertilizers
// @access  Public
router.get('/', getAllFertilizers);

// @route   GET /api/fertilizer/:id
// @desc    Get fertilizer by ID
// @access  Public
router.get('/:id', getFertilizerById);

module.exports = router;