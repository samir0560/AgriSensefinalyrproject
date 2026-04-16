const { findBestCropRecommendations, findBestFertilizerRecommendations } = require('./backend/utils/datasetProcessor');

// Test crop recommendations
console.log('Testing Crop Recommendations...');
const cropRecommendations = findBestCropRecommendations(60, 50, 30, 25, 70, 6.5, 100);
console.log('Crop Recommendations:', cropRecommendations);

// Test fertilizer recommendations
console.log('\nTesting Fertilizer Recommendations...');
const fertilizerRecommendations = findBestFertilizerRecommendations('Rice', 'Sandy', 40, 30, 20);
console.log('Fertilizer Recommendations:', fertilizerRecommendations);

console.log('\nDataset integration test completed successfully!');