// Mock service for crop management
// In a real application, this would fetch from an API

// For now, we'll use localStorage to simulate a database
const CROPS_KEY = 'agrisenseCrops';

// Get crops from storage
export const getCrops = () => {
  const stored = localStorage.getItem(CROPS_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  
  // Default crops if none exist
  return [
    { id: 1, name: 'Rice', category: 'Cereal', season: 'Summer', waterRequirement: 'High', fertilizerType: 'NPK 16-16-16' },
    { id: 2, name: 'Wheat', category: 'Cereal', season: 'Winter', waterRequirement: 'Moderate', fertilizerType: 'NPK 20-20-20' },
    { id: 3, name: 'Maize', category: 'Cereal', season: 'Summer', waterRequirement: 'High', fertilizerType: 'Urea + DAP' },
    { id: 4, name: 'Sugarcane', category: 'Cash Crop', season: 'Spring', waterRequirement: 'Very High', fertilizerType: 'NPK 17-17-17' },
    { id: 5, name: 'Cotton', category: 'Cash Crop', season: 'Summer', waterRequirement: 'High', fertilizerType: 'NPK 19-19-19' },
    { id: 6, name: 'Barley', category: 'Cereal', season: 'Winter', waterRequirement: 'Low', fertilizerType: 'NPK 14-35-14' },
    { id: 7, name: 'Soybean', category: 'Pulse', season: 'Spring', waterRequirement: 'Moderate', fertilizerType: 'DAP + MOP' },
    { id: 8, name: 'Millet', category: 'Cereal', season: 'Summer', waterRequirement: 'Low', fertilizerType: 'NPK 16-16-16' }
  ];
};

// Save crops to storage
export const saveCrops = (crops) => {
  localStorage.setItem(CROPS_KEY, JSON.stringify(crops));
};

// Add a new crop
export const addCrop = (crop) => {
  const crops = getCrops();
  const newCrop = {
    ...crop,
    id: Math.max(...crops.map(c => c.id), 0) + 1
  };
  const updatedCrops = [...crops, newCrop];
  saveCrops(updatedCrops);
  return updatedCrops;
};

// Update an existing crop
export const updateCrop = (updatedCrop) => {
  const crops = getCrops();
  const updatedCrops = crops.map(crop => 
    crop.id === updatedCrop.id ? updatedCrop : crop
  );
  saveCrops(updatedCrops);
  return updatedCrops;
};

// Delete a crop
export const deleteCrop = (id) => {
  const crops = getCrops();
  const updatedCrops = crops.filter(crop => crop.id !== id);
  saveCrops(updatedCrops);
  return updatedCrops;
};

// Get crop by ID
export const getCropById = (id) => {
  const crops = getCrops();
  return crops.find(crop => crop.id === id);
};