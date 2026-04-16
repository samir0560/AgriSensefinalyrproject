// Mock service for carousel images
// In a real application, this would fetch from an API

// For now, we'll use localStorage to simulate a database
const CAROUSEL_IMAGES_KEY = 'carouselImages';

// Get carousel images from storage
export const getCarouselImages = () => {
  const stored = localStorage.getItem(CAROUSEL_IMAGES_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  
  // Default images if none exist
  return [
    {
      id: 1,
      title: "Maximize Your Crop Yield",
      description: "Use our AI-powered recommendations to choose the best crops for your soil and weather conditions.",
      image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='400' viewBox='0 0 800 400'%3E%3Crect width='800' height='400' fill='%23e8f5e9'/%3E%3Ccircle cx='200' cy='150' r='80' fill='%234caf50'/%3E%3Ccircle cx='400' cy='200' r='60' fill='%2366bb6a'/%3E%3Ccircle cx='600' cy='180' r='70' fill='%238bc34a'/%3E%3Crect x='100' y='300' width='600' height='80' fill='%23795548'/%3E%3C/svg%3E",
      alt: "Crop Yield"
    },
    {
      id: 2,
      title: "Detect Diseases Early",
      description: "Upload images of your crops to detect diseases and get treatment advice instantly.",
      image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='400' viewBox='0 0 800 400'%3E%3Crect width='800' height='400' fill='%23e8f5e9'/%3E%3Ccircle cx='200' cy='150' r='60' fill='%23f44336'/%3E%3Ccircle cx='400' cy='200' r='50' fill='%23ff9800'/%3E%3Ccircle cx='600' cy='180' r='55' fill='%23ff5722'/%3E%3Crect x='100' y='300' width='600' height='80' fill='%23795548'/%3E%3C/svg%3E",
      alt: "Disease Detection"
    },
    {
      id: 3,
      title: "Optimize Irrigation",
      description: "Get intelligent irrigation recommendations based on crop type, soil, and weather conditions.",
      image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='400' viewBox='0 0 800 400'%3E%3Crect width='800' height='400' fill='%23e8f5e9'/%3E%3Ccircle cx='200' cy='150' r='70' fill='%232196f3'/%3E%3Ccircle cx='400' cy='200' r='65' fill='%2303a9f4'/%3E%3Ccircle cx='600' cy='180' r='60' fill='%2300bcd4'/%3E%3Crect x='100' y='300' width='600' height='80' fill='%23795548'/%3E%3C/svg%3E",
      alt: "Irrigation"
    }
  ];
};

// Save carousel images to storage
export const saveCarouselImages = (images) => {
  localStorage.setItem(CAROUSEL_IMAGES_KEY, JSON.stringify(images));
};

// Add a new image
export const addCarouselImage = (image) => {
  const images = getCarouselImages();
  const newImage = {
    ...image,
    id: Math.max(...images.map(img => img.id), 0) + 1
  };
  const updatedImages = [...images, newImage];
  saveCarouselImages(updatedImages);
  return updatedImages;
};

// Update an existing image
export const updateCarouselImage = (updatedImage) => {
  const images = getCarouselImages();
  const updatedImages = images.map(img => 
    img.id === updatedImage.id ? updatedImage : img
  );
  saveCarouselImages(updatedImages);
  return updatedImages;
};

// Delete an image
export const deleteCarouselImage = (id) => {
  const images = getCarouselImages();
  const updatedImages = images.filter(img => img.id !== id);
  saveCarouselImages(updatedImages);
  return updatedImages;
};