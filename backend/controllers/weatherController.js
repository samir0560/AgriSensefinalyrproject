// Weather Controller
const axios = require('axios');

// @desc    Get current weather data
// @route   GET /api/weather/current
// @access  Public
const getWeatherData = async (req, res) => {
    try {
        const { lat, lon, city } = req.query;

        // Validate required parameters
        if (!lat && !lon && !city) {
            return res.status(400).json({
                success: false,
                message: 'Please provide either latitude and longitude or city name'
            });
        }

        let url;
        if (city) {
            url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.OWM_API_KEY}&units=metric`;
        } else if (lat && lon) {
            url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.OWM_API_KEY}&units=metric`;
        } else {
            return res.status(400).json({
                success: false,
                message: 'Invalid parameters provided'
            });
        }

        const response = await axios.get(url);
        
        // Check if the API returned valid data
        if (!response.data || response.data.cod !== 200) {
            return res.status(404).json({
                success: false,
                message: response.data?.message || 'City not found or weather data unavailable'
            });
        }
        
        res.status(200).json({
            success: true,
            data: response.data
        });
    } catch (error) {
        console.error('Weather data error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during fetching weather data',
            error: error.message
        });
    }
};

// @desc    Get weather forecast
// @route   GET /api/weather/forecast
// @access  Public
const getWeatherForecast = async (req, res) => {
    try {
        const { lat, lon, city, days } = req.query;

        // Validate required parameters
        if (!lat && !lon && !city) {
            return res.status(400).json({
                success: false,
                message: 'Please provide either latitude and longitude or city name'
            });
        }

        const forecastDays = days || 5; // Default to 5 days forecast

        let url;
        if (city) {
            url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${process.env.OWM_API_KEY}&units=metric&cnt=${forecastDays * 8}`;
        } else if (lat && lon) {
            url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${process.env.OWM_API_KEY}&units=metric&cnt=${forecastDays * 8}`;
        } else {
            return res.status(400).json({
                success: false,
                message: 'Invalid parameters provided'
            });
        }

        const response = await axios.get(url);
        
        // Check if the API returned valid data
        if (!response.data || response.data.cod !== '200') {
            return res.status(404).json({
                success: false,
                message: response.data?.message || 'City not found or weather forecast unavailable'
            });
        }
        
        res.status(200).json({
            success: true,
            data: response.data
        });
    } catch (error) {
        console.error('Weather forecast error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during fetching weather forecast',
            error: error.message
        });
    }
};

// @desc    Get historical weather data
// @route   GET /api/weather/historical
// @access  Public
const getHistoricalWeather = async (req, res) => {
    try {
        // In a real application, this would fetch from a database or historical weather API
        // For now, returning mock data
        const { lat, lon, city, start_date, end_date } = req.query;

        // Validate required parameters
        if (!lat && !lon && !city) {
            return res.status(400).json({
                success: false,
                message: 'Please provide either latitude and longitude or city name'
            });
        }

        // Mock historical weather data
        const mockHistoricalData = {
            location: city || `(${lat}, ${lon})`,
            startDate: start_date || '2023-01-01',
            endDate: end_date || '2023-01-07',
            data: [
                { date: '2023-01-01', temperature: 22, humidity: 65, rainfall: 5 },
                { date: '2023-01-02', temperature: 24, humidity: 60, rainfall: 2 },
                { date: '2023-01-03', temperature: 21, humidity: 70, rainfall: 8 },
                { date: '2023-01-04', temperature: 23, humidity: 68, rainfall: 3 },
                { date: '2023-01-05', temperature: 25, humidity: 55, rainfall: 0 },
                { date: '2023-01-06', temperature: 20, humidity: 75, rainfall: 12 },
                { date: '2023-01-07', temperature: 22, humidity: 62, rainfall: 4 }
            ]
        };

        res.status(200).json({
            success: true,
            data: mockHistoricalData
        });
    } catch (error) {
        console.error('Historical weather error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during fetching historical weather data',
            error: error.message
        });
    }
};

module.exports = {
    getWeatherData,
    getWeatherForecast,
    getHistoricalWeather
};