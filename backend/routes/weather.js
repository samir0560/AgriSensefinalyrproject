// Weather Routes
const express = require('express');
const router = express.Router();
const {
    getWeatherData,
    getWeatherForecast,
    getHistoricalWeather
} = require('../controllers/weatherController');
const { optionalUser } = require('../middleware/authUser');
const { recordFeatureResponse } = require('../middleware/recordFeatureResponse');

// @route   GET /api/weather/current
// @desc    Get current weather data
// @access  Public (optional Bearer: saves result for logged-in users)
router.get('/current', optionalUser, recordFeatureResponse('weather_current'), getWeatherData);

// @route   GET /api/weather/forecast
// @desc    Get weather forecast
// @access  Public (optional Bearer: saves result for logged-in users)
router.get('/forecast', optionalUser, recordFeatureResponse('weather_forecast'), getWeatherForecast);

// @route   GET /api/weather/historical
// @desc    Get historical weather data
// @access  Public (optional Bearer: saves result for logged-in users)
router.get('/historical', optionalUser, recordFeatureResponse('weather_historical'), getHistoricalWeather);

module.exports = router;