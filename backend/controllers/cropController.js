// Crop Controller
const spawn = require('child_process').spawn;
const path = require('path');
const Crop = require('../models/Crop');
const SoilData = require('../models/SoilData');
const WeatherData = require('../models/WeatherData');
const axios = require('axios');
const AIInsightsService = require('../services/aiInsightsService');
const { findBestCropRecommendations } = require('../utils/datasetProcessor');

// @desc    Get crop recommendation based on parameters
// @route   POST /api/crop/recommend
// @access  Public
const getCropRecommendation = async (req, res) => {
    try {
        let { nitrogen, phosphorus, potassium, temperature, humidity, ph, rainfall, location } = req.body;

        // If location is provided, automatically fetch soil and weather data
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
                nitrogen = nitrogen || soilData.nitrogen;
                phosphorus = phosphorus || soilData.phosphorus;
                potassium = potassium || soilData.potassium;
                ph = ph || soilData.pH;
                
                // Use soil temperature if available
                if (soilData.temperature !== undefined) {
                    temperature = temperature || soilData.temperature;
                }
                
                // Use soil moisture if available
                if (soilData.moisture !== undefined) {
                    humidity = humidity || soilData.moisture;
                }
            }

            // Fetch weather data for the location
            if (process.env.OWM_API_KEY) {
                try {
                    const weatherResponse = await axios.get(
                        `https://api.openweathermap.org/data/2.5/weather?lat=${location.coordinates[1]}&lon=${location.coordinates[0]}&appid=${process.env.OWM_API_KEY}&units=metric`
                    );
                    
                    const weatherData = weatherResponse.data;
                    
                    // Update temperature and humidity if not provided
                    temperature = temperature || weatherData.main?.temp;
                    humidity = humidity || weatherData.main?.humidity;
                    rainfall = rainfall || weatherData.rain?.['1h'] || 0; // Use last hour rainfall
                    
                } catch (weatherError) {
                    console.error('Error fetching weather data:', weatherError.message);
                    // Continue with provided values if weather API fails
                }
            }
        }

        // Validate required fields
        if (!nitrogen || !phosphorus || !potassium || !temperature || !humidity || !ph || !rainfall) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required parameters: nitrogen, phosphorus, potassium, temperature, humidity, ph, rainfall'
            });
        }

        // Use dataset processor to get recommendations from actual data
        try {
            const recommendations = findBestCropRecommendations(
                parseFloat(nitrogen),
                parseFloat(phosphorus),
                parseFloat(potassium),
                parseFloat(temperature),
                parseFloat(humidity),
                parseFloat(ph),
                parseFloat(rainfall)
            );

            if (recommendations.length > 0) {
                // Format recommendations to match expected response structure
                const formattedRecommendations = recommendations.map(rec => ({
                    _id: rec.name,
                    name: rec.name,
                    category: 'Crop',
                    season: 'General', // Could be determined from dataset if available
                    optimalPH: rec.ph,
                    pHTolerance: 1.0,
                    optimalNitrogen: rec.nitrogen,
                    optimalPhosphorus: rec.phosphorus,
                    optimalPotassium: rec.potassium,
                    minTemperature: rec.temperature - 5,
                    maxTemperature: rec.temperature + 5,
                    optimalHumidity: rec.humidity,
                    minRainfall: rec.rainfall - 20,
                    maxRainfall: rec.rainfall + 20,
                    growthPeriod: 120, // Default value
                    description: `Recommended crop based on your soil and climate conditions`,
                    score: rec.confidence / 100, // Convert percentage to decimal
                    confidence: rec.confidence,
                    rank: rec.rank
                }));

                const response = {
                    success: true,
                    data: formattedRecommendations,
                    metadata: {
                        timestamp: new Date().toISOString(),
                        source: 'dataset',
                        confidenceThreshold: 0.3,
                        totalRecommendations: formattedRecommendations.length
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
                        note: 'No suitable crops found in dataset for given parameters'
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
                        temperature: weatherApiResponse.main?.temp || temperature,
                        humidity: weatherApiResponse.main?.humidity || humidity,
                        rainfall: weatherApiResponse.rain?.['1h'] || rainfall,
                        windSpeed: weatherApiResponse.wind?.speed || 0,
                        description: weatherApiResponse.weather?.[0]?.description || 'Clear sky'
                    };
                } catch (weatherError) {
                    console.error('Error fetching weather data:', weatherError.message);
                    // Use the values passed in the request
                    weatherData = {
                        temperature: temperature,
                        humidity: humidity,
                        rainfall: rainfall,
                        windSpeed: 0,
                        description: 'Clear sky'
                    };
                }
            }
        }
        
        // Prepare user preferences (these could come from user profile in the future)
        const userPreferences = {
            season: req.body.season || 'Spring',
            previousCrops: req.body.previousCrops || [],
            organicPreference: req.body.organicPreference || false
        };
        
        // Get enhanced recommendations using AI Insights Service
        try {
            const enhancedRecommendations = await AIInsightsService.getEnhancedCropRecommendations(
                location,
                soilData || {
                    nitrogen: nitrogen,
                    phosphorus: phosphorus,
                    potassium: potassium,
                    pH: ph,
                    moisture: humidity
                },
                weatherData || {
                    temperature: temperature,
                    humidity: humidity,
                    rainfall: rainfall
                },
                userPreferences
            );
            
            // Add location-based information to the response
            const response = {
                success: true,
                data: enhancedRecommendations,
                metadata: {
                    timestamp: new Date().toISOString(),
                    confidenceThreshold: 0.3,
                    totalRecommendations: enhancedRecommendations.length
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
                        name: 'Rice',
                        category: 'Cereal',
                        season: 'Kharif',
                        optimalPH: 6.0,
                        pHTolerance: 1.0,
                        optimalNitrogen: 100,
                        optimalPhosphorus: 50,
                        optimalPotassium: 80,
                        minTemperature: 20,
                        maxTemperature: 35,
                        optimalHumidity: 70,
                        minRainfall: 100,
                        maxRainfall: 300,
                        growthPeriod: 120,
                        description: 'Staple food crop suitable for warm, humid conditions',
                        score: 0.85,
                        confidence: 85
                    },
                    {
                        _id: 'mock2',
                        name: 'Wheat',
                        category: 'Cereal',
                        season: 'Rabi',
                        optimalPH: 6.5,
                        pHTolerance: 1.0,
                        optimalNitrogen: 120,
                        optimalPhosphorus: 60,
                        optimalPotassium: 70,
                        minTemperature: 10,
                        maxTemperature: 25,
                        optimalHumidity: 50,
                        minRainfall: 75,
                        maxRainfall: 200,
                        growthPeriod: 150,
                        description: 'Major cereal crop suitable for cooler seasons',
                        score: 0.78,
                        confidence: 78
                    }
                ];
                
                const fallbackResponse = {
                    success: true,
                    data: mockRecommendations,
                    metadata: {
                        timestamp: new Date().toISOString(),
                        source: 'mock_data',
                        note: 'Using mock data due to service error'
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
                    message: 'Error processing crop recommendation',
                    error: fallbackError.message
                });
            }
        }

    } catch (error) {
        console.error('Crop recommendation error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during crop recommendation',
            error: error.message
        });
    }
};

// @desc    Get all crops
// @route   GET /api/crop
// @access  Public
const getAllCrops = async (req, res) => {
    try {
        // In a real application, this would fetch from a database
        const crops = [
            { id: 1, name: 'Rice', season: 'Kharif', region: 'Punjab' },
            { id: 2, name: 'Wheat', season: 'Rabi', region: 'Haryana' },
            { id: 3, name: 'Cotton', season: 'Kharif', region: 'Gujarat' },
            { id: 4, name: 'Sugarcane', season: 'Kharif', region: 'Uttar Pradesh' }
        ];

        res.status(200).json({
            success: true,
            count: crops.length,
            data: crops
        });
    } catch (error) {
        console.error('Get all crops error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during fetching crops',
            error: error.message
        });
    }
};

// @desc    Get crop by ID
// @route   GET /api/crop/:id
// @access  Public
const getCropById = async (req, res) => {
    try {
        const { id } = req.params;
        
        // In a real application, this would fetch from a database
        const crops = {
            1: { id: 1, name: 'Rice', season: 'Kharif', region: 'Punjab', details: 'Staple food crop' },
            2: { id: 2, name: 'Wheat', season: 'Rabi', region: 'Haryana', details: 'Major cereal crop' },
            3: { id: 3, name: 'Cotton', season: 'Kharif', region: 'Gujarat', details: 'Fiber crop' },
            4: { id: 4, name: 'Sugarcane', season: 'Kharif', region: 'Uttar Pradesh', details: 'Sugar producing crop' }
        };

        const crop = crops[id];
        
        if (!crop) {
            return res.status(404).json({
                success: false,
                message: 'Crop not found'
            });
        }

        res.status(200).json({
            success: true,
            data: crop
        });
    } catch (error) {
        console.error('Get crop by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during fetching crop',
            error: error.message
        });
    }
};

module.exports = {
    getCropRecommendation,
    getAllCrops,
    getCropById
};