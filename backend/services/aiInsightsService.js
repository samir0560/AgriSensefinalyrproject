const Crop = require('../models/Crop');
const Fertilizer = require('../models/Fertilizer');
const Irrigation = require('../models/Irrigation');
const SoilData = require('../models/SoilData');
const WeatherData = require('../models/WeatherData');
const { findBestCropRecommendations, findBestFertilizerRecommendations } = require('../utils/datasetProcessor');

/**
 * AI Insights Service
 * Provides enhanced, real-time, personalized agricultural recommendations
 */
class AIInsightsService {
  /**
   * Get enhanced crop recommendations based on multiple factors
   */
  static async getEnhancedCropRecommendations(location, soilData, weatherData, userPreferences = {}) {
    try {
      // Use dataset processor to get recommendations based on environmental parameters
      const recommendations = findBestCropRecommendations(
        soilData.nitrogen || 0,
        soilData.phosphorus || 0,
        soilData.potassium || 0,
        weatherData.temperature || 25,
        weatherData.humidity || 60,
        soilData.pH || 7,
        weatherData.rainfall || 100
      );

      // Process recommendations to add compatibility scores based on user preferences
      const processedRecommendations = recommendations.map(rec => {
        let score = rec.confidence / 100; // Convert percentage to decimal

        // Adjust score based on season compatibility
        if (userPreferences.season) {
          // This would be enhanced in a real implementation with seasonal data
          score *= 1.0; // Placeholder for season compatibility
        }

        // Adjust score based on previous crop history
        if (userPreferences.previousCrops && userPreferences.previousCrops.includes(rec.name)) {
          score += 0.1; // Small bonus for previously successful crops
        }

        // Cap the score at 1.0
        score = Math.min(score, 1.0);

        return {
          ...rec,
          score: score,
          confidence: Math.round(score * 100),
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
          description: `Recommended crop based on your soil and climate conditions`
        };
      });

      return processedRecommendations;
    } catch (error) {
      console.error('Error in getEnhancedCropRecommendations:', error);
      throw error;
    }
  }

  /**
   * Get enhanced fertilizer recommendations
   */
  static async getEnhancedFertilizerRecommendations(cropType, soilData, weatherData, userPreferences = {}) {
    try {
      // Use dataset processor to get recommendations based on crop type and soil data
      const recommendations = findBestFertilizerRecommendations(
        cropType,
        soilData.soilType || 'loamy',
        soilData.nitrogen || 0,
        soilData.phosphorus || 0,
        soilData.potassium || 0
      );

      // Process recommendations to format them properly
      const processedRecommendations = recommendations.map(rec => {
        let score = rec.similarity || (rec.confidence / 100); // Use similarity if available, otherwise convert confidence

        // Adjust score based on user preferences (organic vs synthetic)
        if (userPreferences.organicPreference) {
          if (rec.fertilizer.toLowerCase().includes('organic') || 
              rec.fertilizer.toLowerCase().includes('compost')) {
            score += 0.1; // Bonus for organic options
          }
        }

        // Cap the score at 1.0
        score = Math.min(score, 1.0);

        return {
          ...rec,
          score: score,
          confidence: Math.round(score * 100),
          _id: rec.fertilizer,
          name: rec.fertilizer,
          type: rec.fertilizer, // Type based on the fertilizer name
          npk: `${rec.nitrogen}-${rec.phosphorus}-${rec.potassium}`,
          composition: {
            nitrogen: rec.nitrogen,
            phosphorus: rec.phosphorus,
            potassium: rec.potassium
          },
          applicationRate: 100, // Default rate
          suitableCrops: [rec.crop],
          description: `Recommended fertilizer for ${rec.crop} in ${rec.soil} soil`,
          recommendedAmount: 100 // Default amount
        };
      });

      return processedRecommendations;
    } catch (error) {
      console.error('Error in getEnhancedFertilizerRecommendations:', error);
      throw error;
    }
  }

  /**
   * Get enhanced irrigation recommendations
   */
  static async getEnhancedIrrigationRecommendations(cropType, soilData, weatherData, userPreferences = {}) {
    try {
      // Calculate irrigation schedule based on multiple factors
      const irrigationSchedule = {
        cropType,
        recommendedSchedule: [],
        waterAmount: 0,
        timing: 'morning',
        frequency: 'daily',
        notes: []
      };

      // Calculate water needs based on crop type
      const baseWaterNeed = this.getBaseWaterNeed(cropType);
      
      // Adjust for soil type
      const soilAdjustment = soilData ? this.getSoilWaterRetention(soilData.soilType) : 1.0;
      
      // Adjust for weather conditions
      const weatherAdjustment = weatherData ? this.getWeatherWaterAdjustment(weatherData) : 1.0;
      
      // Adjust for growth stage (if known)
      const growthAdjustment = userPreferences.growthStage ? 
        this.getGrowthStageWaterAdjustment(userPreferences.growthStage) : 1.0;

      // Calculate total water requirement
      const totalWaterNeed = baseWaterNeed * soilAdjustment * weatherAdjustment * growthAdjustment;
      
      // Calculate irrigation frequency and amount
      irrigationSchedule.waterAmount = Math.round(totalWaterNeed * 100) / 100;
      
      // Adjust frequency based on weather and soil
      if (weatherData && weatherData.temperature > 30) {
        irrigationSchedule.frequency = 'twice daily';
        irrigationSchedule.notes.push('High temperature detected - increase irrigation frequency');
      } else if (weatherData && weatherData.humidity > 70) {
        irrigationSchedule.frequency = 'every other day';
        irrigationSchedule.notes.push('High humidity detected - reduce irrigation frequency');
      }
      
      if (soilData && soilData.soilType && soilData.soilType.toLowerCase().includes('sandy')) {
        irrigationSchedule.notes.push('Sandy soil detected - water may drain quickly, monitor closely');
      } else if (soilData && soilData.soilType && soilData.soilType.toLowerCase().includes('clay')) {
        irrigationSchedule.notes.push('Clay soil detected - water slowly to avoid waterlogging');
      }

      // Generate daily schedule
      const now = new Date();
      for (let i = 0; i < 7; i++) {
        const date = new Date(now);
        date.setDate(now.getDate() + i);
        
        irrigationSchedule.recommendedSchedule.push({
          date: date.toISOString().split('T')[0],
          amount: irrigationSchedule.waterAmount,
          time: irrigationSchedule.timing,
          notes: irrigationSchedule.notes
        });
      }

      return irrigationSchedule;
    } catch (error) {
      console.error('Error in getEnhancedIrrigationRecommendations:', error);
      throw error;
    }
  }

  /**
   * Calculate pH compatibility score
   */
  static calculatePHCompatibility(crop, soilPH) {
    const optimalPH = crop.optimalPH || 6.5;
    const tolerance = crop.pHTolerance || 1.0;
    
    if (Math.abs(soilPH - optimalPH) <= tolerance) {
      return 1.0;
    } else if (Math.abs(soilPH - optimalPH) <= tolerance * 2) {
      return 0.7;
    } else {
      return 0.3;
    }
  }

  /**
   * Calculate nutrient compatibility score
   */
  static calculateNutrientCompatibility(crop, soilData) {
    let totalScore = 0;
    const nutrients = ['nitrogen', 'phosphorus', 'potassium'];
    
    nutrients.forEach(nutrient => {
      const cropNeed = crop[`optimal${nutrient.charAt(0).toUpperCase() + nutrient.slice(1)}`] || 0;
      const soilLevel = soilData[nutrient] || 0;
      
      if (soilLevel >= cropNeed * 0.8) {
        totalScore += 1.0; // Good match
      } else if (soilLevel >= cropNeed * 0.5) {
        totalScore += 0.7; // Decent match
      } else {
        totalScore += 0.3; // Poor match
      }
    });
    
    return totalScore / nutrients.length; // Average score
  }

  /**
   * Calculate season compatibility
   */
  static calculateSeasonCompatibility(crop, season) {
    if (!crop.seasons || !Array.isArray(crop.seasons)) return 0.5;
    
    const seasonMap = {
      'Spring': ['spring', 'warm'],
      'Summer': ['summer', 'hot'],
      'Autumn': ['autumn', 'fall', 'cool'],
      'Winter': ['winter', 'cold']
    };
    
    const seasonKeywords = seasonMap[season] || [season.toLowerCase()];
    
    for (const keyword of seasonKeywords) {
      if (crop.seasons.some(s => s.toLowerCase().includes(keyword))) {
        return 1.0;
      }
    }
    
    return 0.2; // Low compatibility if not in season
  }

  /**
   * Calculate temperature compatibility
   */
  static calculateTemperatureCompatibility(crop, temperature) {
    const minTemp = crop.minTemperature || 15;
    const maxTemp = crop.maxTemperature || 35;
    
    if (temperature >= minTemp && temperature <= maxTemp) {
      return 1.0;
    } else if (Math.abs(temperature - (minTemp + maxTemp) / 2) <= 5) {
      return 0.7;
    } else {
      return 0.3;
    }
  }

  /**
   * Calculate humidity compatibility
   */
  static calculateHumidityCompatibility(crop, humidity) {
    const optimalHumidity = crop.optimalHumidity || 60;
    const tolerance = 20;
    
    if (Math.abs(humidity - optimalHumidity) <= tolerance) {
      return 1.0;
    } else if (Math.abs(humidity - optimalHumidity) <= tolerance * 2) {
      return 0.7;
    } else {
      return 0.3;
    }
  }

  /**
   * Calculate rainfall compatibility
   */
  static calculateRainfallCompatibility(crop, rainfall) {
    const minRainfall = crop.minRainfall || 50; // mm per month
    const maxRainfall = crop.maxRainfall || 400;
    
    if (rainfall >= minRainfall && rainfall <= maxRainfall) {
      return 1.0;
    } else if (Math.abs(rainfall - (minRainfall + maxRainfall) / 2) <= (maxRainfall - minRainfall) / 2) {
      return 0.7;
    } else {
      return 0.3;
    }
  }

  /**
   * Calculate soil deficiency match for fertilizer
   */
  static calculateSoilDeficiencyMatch(fertilizer, soilData) {
    let score = 0;
    let matchCount = 0;
    
    if (fertilizer.npk && soilData) {
      const [n, p, k] = fertilizer.npk.split('-').map(Number);
      
      if (soilData.nitrogen < 50 && n > 0) score += 1.0; // Nitrogen deficient
      else if (soilData.nitrogen < 100 && n > 0) score += 0.7;
      else if (n > 0) score += 0.3;
      
      if (soilData.phosphorus < 20 && p > 0) score += 1.0; // Phosphorus deficient
      else if (soilData.phosphorus < 40 && p > 0) score += 0.7;
      else if (p > 0) score += 0.3;
      
      if (soilData.potassium < 100 && k > 0) score += 1.0; // Potassium deficient
      else if (soilData.potassium < 200 && k > 0) score += 0.7;
      else if (k > 0) score += 0.3;
      
      matchCount = 3;
    }
    
    return matchCount > 0 ? score / matchCount : 0.5;
  }

  /**
   * Calculate crop compatibility with fertilizer
   */
  static calculateCropCompatibility(fertilizer, cropType) {
    if (!fertilizer.suitableCrops || !Array.isArray(fertilizer.suitableCrops)) return 0.5;
    
    if (fertilizer.suitableCrops.some(crop => 
      crop.toLowerCase().includes(cropType.toLowerCase()))) {
      return 1.0;
    }
    
    return 0.3;
  }

  /**
   * Calculate weather adjustment for fertilizer
   */
  static calculateWeatherAdjustment(fertilizer, weatherData) {
    let adjustment = 0.5;
    
    if (weatherData.temperature > 35) {
      // High temperature - reduce nitrogen application to prevent burning
      if (fertilizer.npk && fertilizer.npk.split('-')[0] > 10) {
        adjustment -= 0.2;
      }
    }
    
    if (weatherData.rainfall > 100) {
      // High rainfall - reduce application to prevent leaching
      adjustment -= 0.1;
    }
    
    return Math.max(adjustment, 0.1);
  }

  /**
   * Calculate recommended amount of fertilizer
   */
  static calculateRecommendedAmount(fertilizer, soilData, cropType) {
    // Base amount calculation
    let baseAmount = 100; // kg/hectare as base
    
    // Adjust based on soil deficiency
    if (soilData) {
      const deficiencyFactor = this.estimateDeficiencyFactor(soilData);
      baseAmount *= deficiencyFactor;
    }
    
    // Adjust based on crop type
    if (cropType.toLowerCase().includes('vegetable')) {
      baseAmount *= 0.8; // Vegetables typically need less
    } else if (cropType.toLowerCase().includes('grain')) {
      baseAmount *= 1.2; // Grains may need more
    }
    
    // Adjust based on fertilizer type
    if (fertilizer.type && fertilizer.type.toLowerCase().includes('organic')) {
      baseAmount *= 1.5; // Organic typically applied in larger quantities
    }
    
    return Math.round(baseAmount * 100) / 100;
  }

  /**
   * Estimate soil deficiency factor
   */
  static estimateDeficiencyFactor(soilData) {
    const nutrients = ['nitrogen', 'phosphorus', 'potassium'];
    let totalDeficiency = 0;
    
    nutrients.forEach(nutrient => {
      const level = soilData[nutrient] || 0;
      if (level < 50) totalDeficiency += 0.5; // Severe deficiency
      else if (level < 100) totalDeficiency += 0.3; // Moderate deficiency
      else if (level < 150) totalDeficiency += 0.1; // Minor deficiency
    });
    
    return 1 + (totalDeficiency / nutrients.length);
  }

  /**
   * Get base water need for crop type
   */
  static getBaseWaterNeed(cropType) {
    const cropWaterNeeds = {
      'rice': 5.0,
      'wheat': 4.0,
      'corn': 4.5,
      'soybean': 3.5,
      'cotton': 5.5,
      'sugarcane': 6.0,
      'barley': 3.5,
      'oats': 3.0,
      'vegetables': 3.0,
      'fruits': 4.0
    };
    
    const lowerCropType = cropType.toLowerCase();
    for (const [crop, need] of Object.entries(cropWaterNeeds)) {
      if (lowerCropType.includes(crop)) {
        return need;
      }
    }
    
    return 4.0; // Default for unknown crops
  }

  /**
   * Get soil water retention factor
   */
  static getSoilWaterRetention(soilType) {
    const retentionFactors = {
      'sandy': 0.7,
      'loamy': 1.0,
      'clay': 1.2,
      'silty': 0.9
    };
    
    if (!soilType) return 1.0;
    
    const lowerSoilType = soilType.toLowerCase();
    for (const [type, factor] of Object.entries(retentionFactors)) {
      if (lowerSoilType.includes(type)) {
        return factor;
      }
    }
    
    return 1.0; // Default
  }

  /**
   * Get weather-based water adjustment
   */
  static getWeatherWaterAdjustment(weatherData) {
    let adjustment = 1.0;
    
    if (weatherData.temperature > 35) adjustment += 0.3; // Hot weather needs more water
    else if (weatherData.temperature < 10) adjustment -= 0.2; // Cold weather needs less
    
    if (weatherData.humidity > 70) adjustment -= 0.2; // High humidity needs less water
    else if (weatherData.humidity < 30) adjustment += 0.2; // Low humidity needs more
    
    if (weatherData.rainfall > 50) adjustment -= 0.3; // Recent rain means less irrigation needed
    
    if (weatherData.windSpeed > 10) adjustment += 0.1; // Windy conditions need more water
    
    return Math.max(adjustment, 0.3); // Don't go below 0.3
  }

  /**
   * Get growth stage water adjustment
   */
  static getGrowthStageWaterAdjustment(growthStage) {
    const stageFactors = {
      'germination': 0.6,
      'vegetative': 0.8,
      'flowering': 1.0,
      'fruiting': 1.2,
      'maturity': 0.7
    };
    
    return stageFactors[growthStage.toLowerCase()] || 1.0;
  }
}

module.exports = AIInsightsService;