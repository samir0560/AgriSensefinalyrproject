// Crop Routes
const express = require('express');
const router = express.Router();
const {
    getCropRecommendation,
    getAllCrops,
    getCropById
} = require('../controllers/cropController');
const { optionalUser } = require('../middleware/authUser');
const { recordFeatureResponse } = require('../middleware/recordFeatureResponse');

// @route   POST /api/crop/recommend
// @desc    Get crop recommendation based on parameters
// @access  Public (optional Bearer: saves result for logged-in users)
router.post('/recommend', optionalUser, recordFeatureResponse('crop'), getCropRecommendation);

// @route   GET /api/crop
// @desc    Get all crops
// @access  Public
router.get('/', getAllCrops);

// @route   GET /api/crop/:id
// @desc    Get crop by ID
// @access  Public
router.get('/:id', getCropById);

module.exports = router;