// Irrigation Controller
const spawn = require('child_process').spawn;
const path = require('path');
const Irrigation = require('../models/Irrigation');
const SoilData = require('../models/SoilData');
const WeatherData = require('../models/WeatherData');
const axios = require('axios');
const AIInsightsService = require('../services/aiInsightsService');
const { generateIrrigationRecommendations } = require('../utils/datasetProcessor');

// @desc    Get irrigation recommendation based on parameters
// @route   POST /api/irrigation/recommend
// @access  Public
const getIrrigationRecommendation = async (req, res) => {
    try {
        let { cropType, soilType, temperature, humidity, rainfall, season, location } = req.body;

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
                soilType = soilType || soilData.soilType;
                
                // Use soil moisture if available
                if (soilData.moisture !== undefined) {
                    humidity = humidity || soilData.moisture;
                }
                
                // Use soil temperature if available
                if (soilData.temperature !== undefined) {
                    temperature = temperature || soilData.temperature;
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
        if (!cropType || !soilType || !temperature || !humidity || !rainfall || !season) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required parameters: cropType, soilType, temperature, humidity, rainfall, season'
            });
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
            growthStage: req.body.growthStage || 'vegetative',
            irrigationMethod: req.body.irrigationMethod || 'drip',
            waterSource: req.body.waterSource || 'well',
            waterAvailability: req.body.waterAvailability || 'unlimited'
        };
        
        // Use dataset processor for irrigation recommendation as the primary method
        try {
            const datasetRecommendations = generateIrrigationRecommendations(
                cropType,
                soilType,
                parseFloat(temperature),
                parseFloat(humidity),
                parseFloat(rainfall),
                season
            );
            
            // Add location-based information to the response
            const response = {
                success: true,
                data: datasetRecommendations,
                metadata: {
                    timestamp: new Date().toISOString(),
                    cropType: cropType,
                    season: season,
                    irrigationSchedule: datasetRecommendations.recommendedSchedule,
                    source: 'dataset_based'
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
        } catch (datasetError) {
            console.error('Dataset processor error:', datasetError);
            
            // Fallback to Python ML model
            const pythonScriptPath = path.join(__dirname, '../python/predict_irrigation.py');
            
            const args = [
                pythonScriptPath,
                cropType,
                soilType,
                temperature,
                humidity,
                rainfall,
                season
            ];

            const pythonProcess = spawn('python', args);

            let data = '';
            let errorData = '';

            pythonProcess.stdout.on('data', (chunk) => {
                data += chunk.toString();
            });

            pythonProcess.stderr.on('data', (chunk) => {
                errorData += chunk.toString();
            });

            pythonProcess.on('close', async (code) => {
                if (code !== 0) {
                    console.error('Python script error:', errorData);
                    // Fallback to AI Insights Service if Python fails
                    try {
                        const enhancedRecommendations = await AIInsightsService.getEnhancedIrrigationRecommendations(
                            cropType,
                            soilData || {
                                soilType: soilType,
                                moisture: humidity
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
                                cropType: cropType,
                                season: season,
                                irrigationSchedule: enhancedRecommendations.recommendedSchedule
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
                    } catch (aiError) {
                        console.error('AI Insights error:', aiError);
                        // Return mock data if all methods fail
                        const mockRecommendations = {
                            cropType: cropType,
                            recommendedSchedule: [
                                { date: new Date().toISOString().split('T')[0], amount: 20, time: 'morning', notes: ['Water early morning to reduce evaporation'] }
                            ],
                            waterAmount: 20,
                            timing: 'morning',
                            frequency: 'daily',
                            notes: ['Monitor soil moisture levels regularly']
                        };
                        return res.status(200).json({
                            success: true,
                            data: mockRecommendations,
                            metadata: { timestamp: new Date().toISOString(), source: 'mock_data', cropType: cropType, season: season }
                        });
                    }
                }

                try {
                    const pythonResult = JSON.parse(data);
                    
                    // If Python script returns an error, fallback to AI Insights Service
                    if (pythonResult.error) {
                        console.error('Python script error:', pythonResult.error);
                        try {
                            const enhancedRecommendations = await AIInsightsService.getEnhancedIrrigationRecommendations(
                                cropType,
                                soilData || {
                                    soilType: soilType,
                                    moisture: humidity
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
                                    cropType: cropType,
                                    season: season,
                                    irrigationSchedule: enhancedRecommendations.recommendedSchedule
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
                        } catch (aiError) {
                            console.error('AI Insights error:', aiError);
                            // Return mock data if all methods fail
                            const mockRecommendations = {
                                cropType: cropType,
                                recommendedSchedule: [
                                    { date: new Date().toISOString().split('T')[0], amount: 20, time: 'morning', notes: ['Water early morning to reduce evaporation'] }
                                ],
                                waterAmount: 20,
                                timing: 'morning',
                                frequency: 'daily',
                                notes: ['Monitor soil moisture levels regularly']
                            };
                            return res.status(200).json({
                                success: true,
                                data: mockRecommendations,
                                metadata: { timestamp: new Date().toISOString(), source: 'mock_data', cropType: cropType, season: season }
                            });
                        }
                    }
                    
                    // Format the Python result to match expected format
                    const formattedResult = {
                        cropType: pythonResult.crop_type,
                        recommendedMethod: pythonResult.recommended_irrigation,
                        waterAmount: 20,
                        timing: 'morning',
                        frequency: 'daily',
                        details: {
                            cropType: pythonResult.crop_type,
                            soilType: pythonResult.soil_type,
                            temperature: pythonResult.temperature,
                            humidity: pythonResult.humidity,
                            rainfall: pythonResult.rainfall,
                            season: pythonResult.season
                        },
                        notes: ['Follow recommended irrigation method based on crop and conditions']
                    };
                    
                    const response = {
                        success: true,
                        data: formattedResult,
                        metadata: {
                            timestamp: new Date().toISOString(),
                            source: 'ml_model',
                            cropType: cropType,
                            season: season
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
                } catch (parseError) {
                    console.error('Error parsing Python script output:', parseError);
                    res.status(500).json({
                        success: false,
                        message: 'Error processing irrigation prediction',
                        error: parseError.message
                    });
                }
            });
        }
    } catch (error) {
        console.error('Irrigation recommendation error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during irrigation recommendation',
            error: error.message
        });
    }
};

// @desc    Get all irrigation methods
// @route   GET /api/irrigation
// @access  Public
const getAllIrrigationMethods = async (req, res) => {
    try {
        // In a real application, this would fetch from a database
        const irrigationMethods = [
            { id: 1, name: 'Drip Irrigation', efficiency: 'High', waterUsage: 'Low', crops: ['Vegetables', 'Fruits'] },
            { id: 2, name: 'Sprinkler Irrigation', efficiency: 'Medium', waterUsage: 'Medium', crops: ['Wheat', 'Rice'] },
            { id: 3, name: 'Surface Irrigation', efficiency: 'Low', waterUsage: 'High', crops: ['Rice', 'Sugarcane'] },
            { id: 4, name: 'Micro Irrigation', efficiency: 'Very High', waterUsage: 'Very Low', crops: ['Flowers', 'Nursery'] }
        ];

        res.status(200).json({
            success: true,
            count: irrigationMethods.length,
            data: irrigationMethods
        });
    } catch (error) {
        console.error('Get all irrigation methods error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during fetching irrigation methods',
            error: error.message
        });
    }
};

// @desc    Get irrigation method by ID
// @route   GET /api/irrigation/:id
// @access  Public
const getIrrigationMethodById = async (req, res) => {
    try {
        const { id } = req.params;
        
        // In a real application, this would fetch from a database
        const irrigationMethods = {
            1: { 
                id: 1, 
                name: 'Drip Irrigation', 
                efficiency: 'High', 
                waterUsage: 'Low', 
                crops: ['Vegetables', 'Fruits'],
                description: 'Delivers water directly to the root zone, reducing water loss'
            },
            2: { 
                id: 2, 
                name: 'Sprinkler Irrigation', 
                efficiency: 'Medium', 
                waterUsage: 'Medium', 
                crops: ['Wheat', 'Rice'],
                description: 'Simulates natural rainfall by spraying water over crops'
            },
            3: { 
                id: 3, 
                name: 'Surface Irrigation', 
                efficiency: 'Low', 
                waterUsage: 'High', 
                crops: ['Rice', 'Sugarcane'],
                description: 'Water flows over the soil surface by gravity'
            },
            4: { 
                id: 4, 
                name: 'Micro Irrigation', 
                efficiency: 'Very High', 
                waterUsage: 'Very Low', 
                crops: ['Flowers', 'Nursery'],
                description: 'Precise water delivery using micro-sprinklers or micro-tubes'
            }
        };

        const irrigationMethod = irrigationMethods[id];
        
        if (!irrigationMethod) {
            return res.status(404).json({
                success: false,
                message: 'Irrigation method not found'
            });
        }

        res.status(200).json({
            success: true,
            data: irrigationMethod
        });
    } catch (error) {
        console.error('Get irrigation method by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during fetching irrigation method',
            error: error.message
        });
    }
};

module.exports = {
    getIrrigationRecommendation,
    getAllIrrigationMethods,
    getIrrigationMethodById
};