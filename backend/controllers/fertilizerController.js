// Fertilizer Controller
const spawn = require('child_process').spawn;
const path = require('path');
const Fertilizer = require('../models/Fertilizer');
const SoilData = require('../models/SoilData');
const WeatherData = require('../models/WeatherData');
const axios = require('axios');
const AIInsightsService = require('../services/aiInsightsService');
const { findBestFertilizerRecommendations } = require('../utils/datasetProcessor');

// @desc    Get fertilizer recommendation based on parameters
// @route   POST /api/fertilizer/recommend
// @access  Public
const getFertilizerRecommendation = async (req, res) => {
    try {
        let { cropType, soilType, nitrogen, phosphorus, potassium, location } = req.body;

        // If location is provided, automatically fetch soil data
        if (location && location.coordinates) {
            // Fetch soil data near the location
            const soilData = await SoilData.findOne({
                location: {
                    $near: {
                        $geometry: {
                            type: 'Point',
                            coordinates: [location.coordinates[0], location.coordinates[1]]
                        },
                        $maxDistance: 5000 // 5km radius
                    }
                }
            }).sort({ createdAt: -1 }); // Get the most recent soil data

            // If soil data exists, use it to override input values
            if (soilData) {
                soilType = soilType || soilData.soilType;
                nitrogen = nitrogen || soilData.nitrogen;
                phosphorus = phosphorus || soilData.phosphorus;
                potassium = potassium || soilData.potassium;
            }
        }

        // Validate required fields
        if (!cropType || !soilType || !nitrogen || !phosphorus || !potassium) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required parameters: cropType, soilType, nitrogen, phosphorus, potassium'
            });
        }

        // Use dataset processor to get recommendations from actual data
        try {
            const recommendations = findBestFertilizerRecommendations(
                cropType,
                soilType,
                parseFloat(nitrogen),
                parseFloat(phosphorus),
                parseFloat(potassium)
            );

            if (recommendations.length > 0) {
                // Format recommendations to match expected response structure
                const formattedRecommendations = recommendations.map(rec => ({
                    _id: rec.fertilizer,
                    name: rec.fertilizer,
                    type: rec.fertilizer, // Type based on the fertilizer name
                    npk: `${rec.nitrogen}-${rec.phosphorus}-${rec.potassium}`,
                    composition: {
                        nitrogen: rec.nitrogen,
                        phosphorus: rec.phosphorus,
                        potassium: rec.potassium
                    },
                    applicationRate: 100, // Default rate, could be calculated from dataset
                    suitableCrops: [rec.crop],
                    description: `Recommended fertilizer for ${rec.crop} in ${rec.soil} soil`,
                    score: rec.similarity, // Use similarity score
                    confidence: rec.confidence,
                    recommendedAmount: 100 // Default amount
                }));

                const response = {
                    success: true,
                    data: formattedRecommendations,
                    metadata: {
                        timestamp: new Date().toISOString(),
                        source: 'dataset',
                        confidenceThreshold: 0.2,
                        totalRecommendations: formattedRecommendations.length,
                        cropType: cropType
                    }
                };
                
                if (location) {
                    response.location = {
                        coordinates: location.coordinates,
                        soilDataAvailable: !!soilData,
                        weatherDataAvailable: !!weatherData
                    };
                }
                
                return res.status(200).json(response);
            } else {
                // Fallback if no recommendations found
                return res.status(200).json({
                    success: true,
                    data: [],
                    metadata: {
                        timestamp: new Date().toISOString(),
                        source: 'dataset',
                        note: 'No suitable fertilizers found in dataset for given parameters',
                        cropType: cropType
                    }
                });
            }
        } catch (datasetError) {
            console.error('Dataset processing error:', datasetError);
            // Fall back to original logic if dataset processing fails
        }

        // Use AI Insights Service for enhanced recommendations
        let soilData = null;
        let weatherData = null;
        
        // If location is provided, fetch the most recent soil and weather data
        if (location && location.coordinates) {
            soilData = await SoilData.findOne({
                location: {
                    $near: {
                        $geometry: {
                            type: 'Point',
                            coordinates: [location.coordinates[0], location.coordinates[1]]
                        },
                        $maxDistance: 5000 // 5km radius
                    }
                }
            }).sort({ createdAt: -1 });
            
            if (process.env.OWM_API_KEY) {
                try {
                    const weatherResponse = await axios.get(
                        `https://api.openweathermap.org/data/2.5/weather?lat=${location.coordinates[1]}&lon=${location.coordinates[0]}&appid=${process.env.OWM_API_KEY}&units=metric`
                    );
                    
                    const weatherApiResponse = weatherResponse.data;
                    weatherData = {
                        temperature: weatherApiResponse.main?.temp || 25,
                        humidity: weatherApiResponse.main?.humidity || 60,
                        rainfall: weatherApiResponse.rain?.['1h'] || 0,
                        windSpeed: weatherApiResponse.wind?.speed || 0,
                        description: weatherApiResponse.weather?.[0]?.description || 'Clear sky'
                    };
                } catch (weatherError) {
                    console.error('Error fetching weather data:', weatherError.message);
                    // Use default values
                    weatherData = {
                        temperature: 25,
                        humidity: 60,
                        rainfall: 0,
                        windSpeed: 0,
                        description: 'Clear sky'
                    };
                }
            }
        }
        
        // Prepare user preferences (these could come from user profile in the future)
        const userPreferences = {
            organicPreference: req.body.organicPreference || false,
            budgetConstraint: req.body.budget || null
        };
        
        // Get enhanced recommendations using AI Insights Service
        try {
            const enhancedRecommendations = await AIInsightsService.getEnhancedFertilizerRecommendations(
                cropType,
                soilData || {
                    soilType: soilType,
                    nitrogen: nitrogen,
                    phosphorus: phosphorus,
                    potassium: potassium
                },
                weatherData,
                userPreferences
            );
            
            // Add location-based information to the response
            const response = {
                success: true,
                data: enhancedRecommendations,
                metadata: {
                    timestamp: new Date().toISOString(),
                    confidenceThreshold: 0.2,
                    totalRecommendations: enhancedRecommendations.length,
                    cropType: cropType
                }
            };
            
            if (location) {
                response.location = {
                    coordinates: location.coordinates,
                    soilDataAvailable: !!soilData,
                    weatherDataAvailable: !!weatherData
                };
            }
            
            res.status(200).json(response);
        } catch (aiError) {
            console.error('AI Insights error:', aiError);
            
            // Fallback to a mock response if AI service fails
            try {
                // Create mock recommendations based on the input parameters
                const mockRecommendations = [
                    {
                        _id: 'mock1',
                        name: 'NPK Fertilizer',
                        type: 'Nitrogen-Phosphorus-Potassium',
                        npk: '10-10-10',
                        composition: {
                            nitrogen: 10,
                            phosphorus: 10,
                            potassium: 10
                        },
                        applicationRate: 100,
                        suitableCrops: [cropType],
                        description: 'Balanced nutrition for crops',
                        score: 0.85,
                        confidence: 85,
                        recommendedAmount: 100
                    },
                    {
                        _id: 'mock2',
                        name: 'Organic Compost',
                        type: 'Organic',
                        npk: '2-1-1',
                        composition: {
                            nitrogen: 2,
                            phosphorus: 1,
                            potassium: 1
                        },
                        applicationRate: 200,
                        suitableCrops: [cropType],
                        description: 'Organic matter for soil health',
                        score: 0.78,
                        confidence: 78,
                        recommendedAmount: 200
                    }
                ];
                
                const fallbackResponse = {
                    success: true,
                    data: mockRecommendations,
                    metadata: {
                        timestamp: new Date().toISOString(),
                        source: 'mock_data',
                        note: 'Using mock data due to service error',
                        cropType: cropType
                    }
                };
                
                if (location) {
                    fallbackResponse.location = {
                        coordinates: location.coordinates,
                        soilDataAvailable: !!soilData,
                        weatherDataAvailable: !!weatherData
                    };
                }
                
                res.status(200).json(fallbackResponse);
            } catch (fallbackError) {
                console.error('Fallback error:', fallbackError);
                res.status(500).json({
                    success: false,
                    message: 'Error processing fertilizer recommendation',
                    error: fallbackError.message
                });
            }
        }

    } catch (error) {
        console.error('Fertilizer recommendation error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during fertilizer recommendation',
            error: error.message
        });
    }
};

// @desc    Get all fertilizers
// @route   GET /api/fertilizer
// @access  Public
const getAllFertilizers = async (req, res) => {
    try {
        // In a real application, this would fetch from a database
        const fertilizers = [
            { id: 1, name: 'NPK Fertilizer', type: 'Nitrogen-Phosphorus-Potassium', composition: '10-10-10' },
            { id: 2, name: 'Urea', type: 'Nitrogen', composition: '46-0-0' },
            { id: 3, name: 'DAP', type: 'Phosphorus-Nitrogen', composition: '18-46-0' },
            { id: 4, name: 'MOP', type: 'Potassium', composition: '0-0-60' }
        ];

        res.status(200).json({
            success: true,
            count: fertilizers.length,
            data: fertilizers
        });
    } catch (error) {
        console.error('Get all fertilizers error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during fetching fertilizers',
            error: error.message
        });
    }
};

// @desc    Get fertilizer by ID
// @route   GET /api/fertilizer/:id
// @access  Public
const getFertilizerById = async (req, res) => {
    try {
        const { id } = req.params;
        
        // In a real application, this would fetch from a database
        const fertilizers = {
            1: { id: 1, name: 'NPK Fertilizer', type: 'Nitrogen-Phosphorus-Potassium', composition: '10-10-10', usage: 'Balanced nutrition for crops' },
            2: { id: 2, name: 'Urea', type: 'Nitrogen', composition: '46-0-0', usage: 'High nitrogen content for leafy growth' },
            3: { id: 3, name: 'DAP', type: 'Phosphorus-Nitrogen', composition: '18-46-0', usage: 'Promotes root development' },
            4: { id: 4, name: 'MOP', type: 'Potassium', composition: '0-0-60', usage: 'Improves fruit quality and disease resistance' }
        };

        const fertilizer = fertilizers[id];
        
        if (!fertilizer) {
            return res.status(404).json({
                success: false,
                message: 'Fertilizer not found'
            });
        }

        res.status(200).json({
            success: true,
            data: fertilizer
        });
    } catch (error) {
        console.error('Get fertilizer by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during fetching fertilizer',
            error: error.message
        });
    }
};

module.exports = {
    getFertilizerRecommendation,
    getAllFertilizers,
    getFertilizerById
};