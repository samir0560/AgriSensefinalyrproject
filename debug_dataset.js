const { loadCropDataset } = require('./backend/utils/datasetProcessor');

// Debug: Load dataset and check structure
console.log('Loading crop dataset...');
const dataset = loadCropDataset();

console.log('Dataset length:', dataset.length);
console.log('First record:', dataset[0]);
console.log('Keys of first record:', Object.keys(dataset[0]));

// Check if 'label' exists
if (dataset[0]) {
    console.log("Value of dataset[0].label:", dataset[0].label);
    console.log("Type of dataset[0].label:", typeof dataset[0].label);
}

// Test crop recommendations
console.log('\nTesting crop recommendations...');
const { findBestCropRecommendations } = require('./backend/utils/datasetProcessor');
const recommendations = findBestCropRecommendations(60, 50, 30, 25, 70, 6.5, 100);
console.log('Recommendations:', recommendations);