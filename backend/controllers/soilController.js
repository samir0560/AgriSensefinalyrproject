// Soil Data Controller
const SoilData = require('../models/SoilData');
const axios = require('axios');
const { findBestCropRecommendations } = require('../utils/datasetProcessor');

// @desc    Create new soil data entry
// @route   POST /api/soil
// @access  Public
const createSoilData = async (req, res) => {
  try {
    const { 
      location, 
      soilType, 
      pH, 
      nitrogen, 
      phosphorus, 
      potassium, 
      organicMatter, 
      moisture, 
      temperature 
    } = req.body;

    // Validate required fields
    if (!location || !location.coordinates || !soilType || pH === undefined || 
        nitrogen === undefined || phosphorus === undefined || potassium === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required parameters: location, soilType, pH, nitrogen, phosphorus, potassium'
      });
    }

    // Validate coordinates
    if (!Array.isArray(location.coordinates) || location.coordinates.length !== 2) {
      return res.status(400).json({
        success: false,
        message: 'Location coordinates must be an array of [longitude, latitude]'
      });
    }

    const newSoilData = new SoilData({
      location: {
        type: 'Point',
        coordinates: location.coordinates // [longitude, latitude]
      },
      soilType,
      pH,
      nitrogen,
      phosphorus,
      potassium,
      organicMatter: organicMatter || null,
      moisture: moisture || null,
      temperature: temperature || null
    });

    const savedSoilData = await newSoilData.save();

    res.status(201).json({
      success: true,
      data: savedSoilData
    });
  } catch (error) {
    console.error('Soil data creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during soil data creation',
      error: error.message
    });
  }
};

// @desc    Get soil data by location (radius search)
// @route   GET /api/soil/nearby
// @access  Public
const getNearbySoilData = async (req, res) => {
  try {
    const { lat, lon, radius = 10 } = req.query; // radius in kilometers

    // Validate required parameters
    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        message: 'Please provide latitude and longitude parameters'
      });
    }

    // Convert radius from km to meters for MongoDB query
    const radiusInMeters = radius * 1000;

    const nearbySoilData = await SoilData.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lon), parseFloat(lat)]
          },
          $maxDistance: radiusInMeters
        }
      }
    }).limit(20); // Limit to 20 results

    res.status(200).json({
      success: true,
      count: nearbySoilData.length,
      data: nearbySoilData
    });
  } catch (error) {
    console.error('Get nearby soil data error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during fetching nearby soil data',
      error: error.message
    });
  }
};

// @desc    Get soil data by ID
// @route   GET /api/soil/:id
// @access  Public
const getSoilDataById = async (req, res) => {
  try {
    const { id } = req.params;

    const soilData = await SoilData.findById(id);

    if (!soilData) {
      return res.status(404).json({
        success: false,
        message: 'Soil data not found'
      });
    }

    res.status(200).json({
      success: true,
      data: soilData
    });
  } catch (error) {
    console.error('Get soil data by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during fetching soil data',
      error: error.message
    });
  }
};

// @desc    Update soil data
// @route   PUT /api/soil/:id
// @access  Public
const updateSoilData = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove location from update data as it's not typically changed
    const { location, ...updateFields } = updateData;

    const updatedSoilData = await SoilData.findByIdAndUpdate(
      id,
      { ...updateFields, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!updatedSoilData) {
      return res.status(404).json({
        success: false,
        message: 'Soil data not found'
      });
    }

    res.status(200).json({
      success: true,
      data: updatedSoilData
    });
  } catch (error) {
    console.error('Update soil data error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during updating soil data',
      error: error.message
    });
  }
};

// @desc    Delete soil data
// @route   DELETE /api/soil/:id
// @access  Public
const deleteSoilData = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedSoilData = await SoilData.findByIdAndDelete(id);

    if (!deletedSoilData) {
      return res.status(404).json({
        success: false,
        message: 'Soil data not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Soil data deleted successfully'
    });
  } catch (error) {
    console.error('Delete soil data error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during deleting soil data',
      error: error.message
    });
  }
};

// @desc    Get soil analysis and recommendations
// @route   POST /api/soil/analysis
// @access  Public
const getSoilAnalysis = async (req, res) => {
  try {
    const { 
      pH, 
      nitrogen, 
      phosphorus, 
      potassium, 
      soilType,
      temperature,
      moisture 
    } = req.body;

    // Validate required parameters
    if (pH === undefined || nitrogen === undefined || phosphorus === undefined || potassium === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide pH, nitrogen, phosphorus, and potassium values'
      });
    }

    // Perform soil analysis and generate recommendations
    const analysis = {
      pHLevel: getPHLevel(pH),
      nutrientLevels: getNutrientLevels(nitrogen, phosphorus, potassium),
      soilType: soilType || 'unknown',
      recommendations: []
    };

    // Generate recommendations based on soil data
    if (pH < 6.0) {
      analysis.recommendations.push({
        type: 'pH adjustment',
        suggestion: 'Soil is too acidic. Consider adding lime to raise pH to optimal range (6.0-7.5).',
        priority: 'high'
      });
    } else if (pH > 7.5) {
      analysis.recommendations.push({
        type: 'pH adjustment',
        suggestion: 'Soil is too alkaline. Consider adding sulfur or organic matter to lower pH to optimal range (6.0-7.5).',
        priority: 'high'
      });
    }

    if (nitrogen < 20) {
      analysis.recommendations.push({
        type: 'nutrient',
        suggestion: 'Nitrogen is low. Consider adding nitrogen-rich fertilizer or organic matter.',
        priority: 'high'
      });
    }

    if (phosphorus < 15) {
      analysis.recommendations.push({
        type: 'nutrient',
        suggestion: 'Phosphorus is low. Consider adding phosphorus-rich fertilizer like bone meal or rock phosphate.',
        priority: 'medium'
      });
    }

    if (potassium < 20) {
      analysis.recommendations.push({
        type: 'nutrient',
        suggestion: 'Potassium is low. Consider adding potassium-rich fertilizer like potash or compost.',
        priority: 'medium'
      });
    }

    if (temperature && temperature > 35) {
      analysis.recommendations.push({
        type: 'temperature',
        suggestion: 'Soil temperature is high. Consider mulching to retain moisture and protect roots.',
        priority: 'medium'
      });
    }

    if (moisture && moisture < 20) {
      analysis.recommendations.push({
        type: 'moisture',
        suggestion: 'Soil moisture is low. Increase irrigation frequency or add water retention materials.',
        priority: 'high'
      });
    }

    // Add crop suitability based on soil conditions using dataset processor
    const recommendedCrops = findBestCropRecommendations(nitrogen, phosphorus, potassium, temperature || 25, moisture || 60, pH, 100); // Using default temp/moisture/rainfall if not provided
    analysis.cropSuitability = recommendedCrops.slice(0, 5).map(crop => crop.name); // Get top 5 crop recommendations

    res.status(200).json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Soil analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during soil analysis',
      error: error.message
    });
  }
};

// Helper function to determine pH level
function getPHLevel(pH) {
  if (pH < 4.5) return 'extremely acidic';
  if (pH < 5.5) return 'very acidic';
  if (pH < 6.0) return 'acidic';
  if (pH < 7.0) return 'slightly acidic';
  if (pH < 7.5) return 'neutral';
  if (pH < 8.5) return 'slightly alkaline';
  if (pH < 9.5) return 'alkaline';
  return 'very alkaline';
}

// Helper function to determine nutrient levels
function getNutrientLevels(nitrogen, phosphorus, potassium) {
  return {
    nitrogen: nitrogen < 20 ? 'low' : nitrogen < 40 ? 'medium' : 'high',
    phosphorus: phosphorus < 15 ? 'low' : phosphorus < 30 ? 'medium' : 'high',
    potassium: potassium < 20 ? 'low' : potassium < 60 ? 'medium' : 'high'
  };
}



module.exports = {
  createSoilData,
  getNearbySoilData,
  getSoilDataById,
  updateSoilData,
  deleteSoilData,
  getSoilAnalysis
};