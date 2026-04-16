// Disease Routes
const express = require('express');
const router = express.Router();
const {
    predictDisease,
    getAllDiseases,
    getDiseaseById,
    upload
} = require('../controllers/diseaseController');
const { optionalUser } = require('../middleware/authUser');
const { recordFeatureResponse } = require('../middleware/recordFeatureResponse');

// @route   POST /api/disease/predict
// @desc    Predict disease from image
// @access  Public (optional Bearer: saves result for logged-in users)
router.post(
  '/predict',
  optionalUser,
  upload.single('image'),
  recordFeatureResponse('disease'),
  predictDisease
);

// @route   GET /api/disease
// @desc    Get all diseases
// @access  Public
router.get('/', getAllDiseases);

// @route   GET /api/disease/:id
// @desc    Get disease by ID
// @access  Public
router.get('/:id', getDiseaseById);

module.exports = router;