const fs = require('fs');
const path = require('path');

/**
 * Load and process the crop recommendation dataset
 * @returns {Array} Array of crop recommendation data
 */
const loadCropDataset = () => {
    const datasetPath = path.join(__dirname, '../../crop_recomendation/Crop_recommendation.csv');
    
    if (!fs.existsSync(datasetPath)) {
        console.error('Crop recommendation dataset not found at:', datasetPath);
        return [];
    }
    
    const data = fs.readFileSync(datasetPath, 'utf8');
    const lines = data.split('\n');
    
    // Extract headers and clean them
    const headers = lines[0].split(',').map(header => header.trim());
    
    // Process each line into an object
    const dataset = [];
    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === '') continue; // Skip empty lines
        
        const values = lines[i].split(',');
        const row = {};
        
        for (let j = 0; j < headers.length; j++) {
            // Convert numeric values
            if (j < headers.length - 1) { // All except the last column (label)
                row[headers[j]] = parseFloat(values[j]);
            } else {
                row[headers[j]] = values[j].trim(); // Keep label as string and trim whitespace
            }
        }
        
        dataset.push(row);
    }
    
    console.log(`Loaded ${dataset.length} records from crop recommendation dataset`);
    return dataset;
};

/**
 * Load and process the fertilizer recommendation dataset
 * @returns {Array} Array of fertilizer recommendation data
 */
const loadFertilizerDataset = () => {
    const datasetPath = path.join(__dirname, '../../fertilizer_recommendation/fertilizer_recommendation_dataset.csv');
    
    if (!fs.existsSync(datasetPath)) {
        console.error('Fertilizer recommendation dataset not found at:', datasetPath);
        return [];
    }
    
    const data = fs.readFileSync(datasetPath, 'utf8');
    const lines = data.split('\n');
    
    // Extract headers and clean them
    const headers = lines[0].split(',').map(header => header.trim());
    
    // Process each line into an object
    const dataset = [];
    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === '') continue; // Skip empty lines
        
        const values = lines[i].split(',');
        const row = {};
        
        for (let j = 0; j < headers.length; j++) {
            // Convert numeric values (for the first 8 columns)
            if (j < 8) { // Temperature, Moisture, Rainfall, PH, Nitrogen, Phosphorous, Potassium, Carbon
                row[headers[j]] = parseFloat(values[j]);
            } else {
                row[headers[j]] = values[j].trim(); // Keep categorical values as strings and trim whitespace
            }
        }
        
        dataset.push(row);
    }
    
    console.log(`Loaded ${dataset.length} records from fertilizer recommendation dataset`);
    return dataset;
};

/**
 * Find the best crop recommendation based on input parameters
 * @param {number} nitrogen - Nitrogen content
 * @param {number} phosphorus - Phosphorus content
 * @param {number} potassium - Potassium content
 * @param {number} temperature - Temperature
 * @param {number} humidity - Humidity
 * @param {number} ph - pH level
 * @param {number} rainfall - Rainfall
 * @returns {Array} Array of recommended crops with confidence scores
 */
const findBestCropRecommendations = (nitrogen, phosphorus, potassium, temperature, humidity, ph, rainfall) => {
    const dataset = loadCropDataset();
    
    if (dataset.length === 0) {
        return [];
    }
    
    // Calculate similarity scores for each record in the dataset
    const scoredRecords = dataset.map(record => {
        // Calculate Euclidean distance (lower distance means more similar)
        const distance = Math.sqrt(
            Math.pow(record.N - nitrogen, 2) +
            Math.pow(record.P - phosphorus, 2) +
            Math.pow(record.K - potassium, 2) +
            Math.pow(record.temperature - temperature, 2) +
            Math.pow(record.humidity - humidity, 2) +
            Math.pow(record.ph - ph, 2) +
            Math.pow(record.rainfall - rainfall, 2)
        );
        
        // Convert distance to similarity score (higher is better)
        // Using inverse function to convert distance to similarity
        const similarity = 1 / (1 + distance);
        
        return {
            ...record,
            similarity: similarity,
            distance: distance
        };
    });
    
    // Sort by similarity (descending)
    scoredRecords.sort((a, b) => b.similarity - a.similarity);
    
    // To get diverse crop recommendations, we'll select different crops based on similarity
    // rather than just taking the top N records which might all be the same crop
    const uniqueCropRecommendations = [];
    const seenCrops = new Set();
    
    for (const record of scoredRecords) {
        if (!seenCrops.has(record.label) && uniqueCropRecommendations.length < 5) {
            uniqueCropRecommendations.push(record);
            seenCrops.add(record.label);
        }
        // If we have 5 unique crops, break
        if (uniqueCropRecommendations.length >= 5) {
            break;
        }
    }
    
    // If we don't have enough unique crops, fill with the next best matches
    if (uniqueCropRecommendations.length < 5) {
        for (const record of scoredRecords) {
            if (!seenCrops.has(record.label)) {
                uniqueCropRecommendations.push(record);
                seenCrops.add(record.label);
                if (uniqueCropRecommendations.length >= 5) {
                    break;
                }
            }
        }
    }
    
    // If we still don't have 5 recommendations, add repeated crops with lower priority
    if (uniqueCropRecommendations.length < 5) {
        for (const record of scoredRecords) {
            if (uniqueCropRecommendations.length >= 5) {
                break;
            }
            uniqueCropRecommendations.push(record);
        }
    }
    
    // Calculate confidence scores based on similarity
    const topSimilarity = uniqueCropRecommendations.length > 0 ? uniqueCropRecommendations[0].similarity : 0;
    
    // Format the results
    return uniqueCropRecommendations.map((rec, index) => {
        // Calculate confidence as a percentage (top score gets 100%, others scaled accordingly)
        const confidence = topSimilarity > 0 ? Math.min(100, Math.round((rec.similarity / topSimilarity) * 100)) : 100;
        
        return {
            name: rec.label, // Fixed: use 'label' which is the actual crop name from the dataset
            nitrogen: rec.N,
            phosphorus: rec.P,
            potassium: rec.K,
            temperature: rec.temperature,
            humidity: rec.humidity,
            ph: rec.ph,
            rainfall: rec.rainfall,
            confidence: confidence,
            rank: index + 1
        };
    });
};

/**
 * Find the best fertilizer recommendation based on input parameters
 * @param {string} cropType - Type of crop
 * @param {string} soilType - Type of soil
 * @param {number} nitrogen - Current nitrogen level
 * @param {number} phosphorus - Current phosphorus level
 * @param {number} potassium - Current potassium level
 * @returns {Array} Array of recommended fertilizers with confidence scores
 */
const findBestFertilizerRecommendations = (cropType, soilType, nitrogen, phosphorus, potassium) => {
    const dataset = loadFertilizerDataset();
    
    if (dataset.length === 0) {
        return [];
    }
    
    // Filter dataset based on crop and soil type
    let filteredRecords = dataset.filter(record => 
        record.Crop.toLowerCase() === cropType.toLowerCase() && 
        record.Soil.toLowerCase() === soilType.toLowerCase()
    );
    
    // If no exact match, find records with similar crop type
    if (filteredRecords.length === 0) {
        filteredRecords = dataset.filter(record => 
            record.Crop.toLowerCase() === cropType.toLowerCase()
        );
    }
    
    // If still no match, find records with similar soil type
    if (filteredRecords.length === 0) {
        filteredRecords = dataset.filter(record => 
            record.Soil.toLowerCase() === soilType.toLowerCase()
        );
    }
    
    // If still no match, use all records
    if (filteredRecords.length === 0) {
        filteredRecords = dataset;
    }
    
    // Calculate similarity scores for each record in the filtered dataset
    const scoredRecords = filteredRecords.map(record => {
        // Calculate Euclidean distance based on nutrient values
        const distance = Math.sqrt(
            Math.pow(record.Nitrogen - nitrogen, 2) +
            Math.pow(record.Phosphorous - phosphorus, 2) +
            Math.pow(record.Potassium - potassium, 2)
        );
        
        // Convert distance to similarity score (higher is better)
        const similarity = 1 / (1 + distance);
        
        return {
            ...record,
            similarity: similarity,
            distance: distance
        };
    });
    
    // Sort by similarity (descending)
    scoredRecords.sort((a, b) => b.similarity - a.similarity);
    
    // To get diverse fertilizer recommendations, we'll select different fertilizers based on similarity
    // rather than just taking the top N records which might all be similar
    const uniqueFertilizerRecommendations = [];
    const seenFertilizers = new Set();
    
    for (const record of scoredRecords) {
        const fertilizerKey = record.Fertilizer.toLowerCase();
        if (!seenFertilizers.has(fertilizerKey) && uniqueFertilizerRecommendations.length < 5) {
            uniqueFertilizerRecommendations.push(record);
            seenFertilizers.add(fertilizerKey);
        }
        // If we have 5 unique fertilizers, break
        if (uniqueFertilizerRecommendations.length >= 5) {
            break;
        }
    }
    
    // If we don't have enough unique fertilizers, fill with the next best matches
    if (uniqueFertilizerRecommendations.length < 5) {
        for (const record of scoredRecords) {
            const fertilizerKey = record.Fertilizer.toLowerCase();
            if (!seenFertilizers.has(fertilizerKey)) {
                uniqueFertilizerRecommendations.push(record);
                seenFertilizers.add(fertilizerKey);
                if (uniqueFertilizerRecommendations.length >= 5) {
                    break;
                }
            }
        }
    }
    
    // If we still don't have 5 recommendations, add repeated fertilizers with lower priority
    if (uniqueFertilizerRecommendations.length < 5) {
        for (const record of scoredRecords) {
            if (uniqueFertilizerRecommendations.length >= 5) {
                break;
            }
            uniqueFertilizerRecommendations.push(record);
        }
    }
    
    // Calculate confidence scores based on similarity
    const topSimilarity = uniqueFertilizerRecommendations.length > 0 ? uniqueFertilizerRecommendations[0].similarity : 0;
    
    // Get top recommendations
    const topRecommendations = uniqueFertilizerRecommendations.slice(0, 5);
    
    // Format the results
    return topRecommendations.map((rec, index) => {
        // Calculate confidence as a percentage (top score gets 100%, others scaled accordingly)
        const confidence = topSimilarity > 0 ? Math.min(100, Math.round((rec.similarity / topSimilarity) * 100)) : 100;
        
        return {
            fertilizer: rec.Fertilizer,
            crop: rec.Crop,
            soil: rec.Soil,
            nitrogen: rec.Nitrogen,
            phosphorus: rec.Phosphorous,
            potassium: rec.Potassium,
            temperature: rec.Temperature,
            moisture: rec.Moisture,
            ph: rec.PH,
            carbon: rec.Carbon,
            rainfall: rec.Rainfall,
            remark: rec.Remark,
            confidence: confidence,
            rank: index + 1
        };
    });
};

/**
 * Generate irrigation recommendations based on crop, soil, and weather conditions
 * @param {string} cropType - Type of crop
 * @param {string} soilType - Type of soil
 * @param {number} temperature - Current temperature
 * @param {number} humidity - Current humidity
 * @param {number} rainfall - Current rainfall
 * @param {string} season - Current season
 * @returns {Object} Irrigation recommendation with schedule and advice
 */
const generateIrrigationRecommendations = (cropType, soilType, temperature, humidity, rainfall, season) => {
    // Base water needs for different crops (mm/day)
    const cropWaterNeeds = {
        'rice': 5.0,
        'wheat': 4.0,
        'maize': 4.5,
        'sugarcane': 6.0,
        'cotton': 5.5,
        'soybean': 3.5,
        'barley': 3.5,
        'oats': 3.0,
        'vegetables': 3.0,
        'fruits': 4.0
    };
    
    // Soil water retention factors
    const soilRetentionFactors = {
        'sandy': 0.7,    // Sandy soil drains quickly
        'loamy': 1.0,    // Loamy soil is ideal
        'clay': 1.2,     // Clay soil retains water well
        'silty': 0.9
    };
    
    // Get base water need for the crop
    const lowerCropType = cropType.toLowerCase();
    let baseWaterNeed = 4.0; // Default
    for (const [crop, need] of Object.entries(cropWaterNeeds)) {
        if (lowerCropType.includes(crop)) {
            baseWaterNeed = need;
            break;
        }
    }
    
    // Apply soil adjustment
    const lowerSoilType = soilType.toLowerCase();
    let soilFactor = 1.0; // Default
    for (const [soil, factor] of Object.entries(soilRetentionFactors)) {
        if (lowerSoilType.includes(soil)) {
            soilFactor = factor;
            break;
        }
    }
    
    // Apply weather adjustments
    let weatherFactor = 1.0;
    
    // Temperature adjustment: higher temp = more water needed
    if (temperature > 35) weatherFactor += 0.5;
    else if (temperature > 30) weatherFactor += 0.3;
    else if (temperature < 10) weatherFactor -= 0.2;
    
    // Humidity adjustment: lower humidity = more water needed
    if (humidity < 30) weatherFactor += 0.3;
    else if (humidity < 50) weatherFactor += 0.1;
    else if (humidity > 80) weatherFactor -= 0.1;
    
    // Rainfall adjustment: more rainfall = less irrigation needed
    if (rainfall > 50) weatherFactor -= 0.5;  // Heavy rainfall
    else if (rainfall > 20) weatherFactor -= 0.2;  // Some rainfall
    else if (rainfall < 5) weatherFactor += 0.2;  // Very dry
    
    // Calculate total water requirement
    const totalWaterNeed = baseWaterNeed * soilFactor * weatherFactor;
    
    // Determine irrigation frequency based on conditions
    let frequency = 'daily';
    let timing = 'morning';
    const notes = [];
    
    // Adjust frequency based on conditions
    if (temperature > 35 || humidity < 30) {
        frequency = 'twice daily';
        notes.push('High temperature and low humidity detected - increase irrigation frequency');
    } else if (rainfall > 20) {
        frequency = 'every other day';
        notes.push('Recent rainfall detected - reduce irrigation frequency');
    } else if (soilFactor < 0.8) {
        frequency = 'daily';
        notes.push('Sandy soil detected - monitor water closely as it drains quickly');
    } else if (soilFactor > 1.1) {
        frequency = 'every other day';
        notes.push('Clay soil detected - water slowly to avoid waterlogging');
    }
    
    // Generate a weekly schedule
    const schedule = [];
    const now = new Date();
    for (let i = 0; i < 7; i++) {
        const date = new Date(now);
        date.setDate(now.getDate() + i);
        
        schedule.push({
            date: date.toISOString().split('T')[0],
            amount: Math.round(totalWaterNeed * 10) / 10, // Round to 1 decimal place
            time: timing,
            notes: [...notes]
        });
    }
    
    // Determine recommended irrigation method
    let recommendedMethod = 'Drip Irrigation';
    if (lowerCropType.includes('rice') || lowerCropType.includes('sugarcane')) {
        recommendedMethod = 'Flood Irrigation'; // For water-intensive crops
    } else if (soilFactor < 0.8) {
        recommendedMethod = 'Drip Irrigation'; // For sandy soils to conserve water
    } else if (lowerCropType.includes('vegetables') || lowerCropType.includes('fruits')) {
        recommendedMethod = 'Drip Irrigation'; // For precision watering
    } else {
        recommendedMethod = 'Sprinkler Irrigation'; // General purpose
    }
    
    // Add specific notes based on conditions
    if (temperature > 35) {
        notes.push('Avoid watering during peak sun hours to reduce evaporation');
    }
    if (humidity > 80) {
        notes.push('Reduce watering to prevent fungal diseases in high humidity');
    }
    
    return {
        cropType,
        soilType,
        season,
        recommendedMethod,
        waterAmount: Math.round(totalWaterNeed * 10) / 10, // Round to 1 decimal place
        timing,
        frequency,
        notes,
        recommendedSchedule: schedule,
        baseWaterNeed,
        soilFactor,
        weatherFactor,
        totalWaterNeed: Math.round(totalWaterNeed * 10) / 10
    };
};

module.exports = {
    loadCropDataset,
    loadFertilizerDataset,
    findBestCropRecommendations,
    findBestFertilizerRecommendations,
    generateIrrigationRecommendations
};