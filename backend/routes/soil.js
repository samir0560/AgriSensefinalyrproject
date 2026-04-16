// Soil Data Routes
const express = require('express');
const router = express.Router();
const {
    createSoilData,
    getNearbySoilData,
    getSoilDataById,
    updateSoilData,
    deleteSoilData,
    getSoilAnalysis
} = require('../controllers/soilController');
const { optionalUser } = require('../middleware/authUser');
const { recordFeatureResponse } = require('../middleware/recordFeatureResponse');

// @route   POST /api/soil
// @desc    Create new soil data entry
// @access  Public (optional Bearer: saves result for logged-in users)
router.post('/', optionalUser, recordFeatureResponse('soil_submit'), createSoilData);

// @route   GET /api/soil/nearby
// @desc    Get soil data near a location
// @access  Public
router.get('/nearby', getNearbySoilData);

// @route   GET /api/soil/:id
// @desc    Get soil data by ID
// @access  Public
router.get('/:id', getSoilDataById);

// @route   PUT /api/soil/:id
// @desc    Update soil data
// @access  Public
router.put('/:id', updateSoilData);

// @route   DELETE /api/soil/:id
// @desc    Delete soil data
// @access  Public
router.delete('/:id', deleteSoilData);

// @route   POST /api/soil/analysis
// @desc    Get soil analysis and recommendations
// @access  Public (optional Bearer: saves result for logged-in users)
router.post('/analysis', optionalUser, recordFeatureResponse('soil_analysis'), getSoilAnalysis);

module.exports = router;