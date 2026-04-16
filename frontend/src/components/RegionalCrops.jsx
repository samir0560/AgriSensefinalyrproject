import React, { useState, useEffect } from 'react';
import { getCrops } from '../services/cropService';

const RegionalCrops = () => {
  const [regionalCrops, setRegionalCrops] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Simulate fetching regional crops data
  useEffect(() => {
    const fetchRegionalCrops = async () => {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock regional crops data
      const mockRegionalCrops = [
        {
          id: 1,
          name: 'Bajra (Pearl Millet)',
          region: 'Rajasthan',
          season: 'Kharif',
          waterRequirement: 'Low',
          soilType: 'Sandy',
          yieldPerHectare: '2.5-4 tons',
          description: 'Drought-resistant crop suitable for arid regions'
        },
        {
          id: 2,
          name: 'Jowar (Sorghum)',
          region: 'Maharashtra',
          season: 'Kharif',
          waterRequirement: 'Moderate',
          soilType: 'Red',
          yieldPerHectare: '3-5 tons',
          description: 'Important food crop in dryland agriculture'
        },
        {
          id: 3,
          name: 'Ragi (Finger Millet)',
          region: 'Karnataka',
          season: 'Kharif',
          waterRequirement: 'Low',
          soilType: 'Black',
          yieldPerHectare: '1.5-2.5 tons',
          description: 'Nutritious grain crop rich in calcium'
        },
        {
          id: 4,
          name: 'Amaranthus',
          region: 'Himachal Pradesh',
          season: 'Rabi',
          waterRequirement: 'Low',
          soilType: 'Loamy',
          yieldPerHectare: '2-3 tons',
          description: 'Traditional leafy vegetable with high nutritional value'
        },
        {
          id: 5,
          name: 'Buckwheat',
          region: 'Uttarakhand',
          season: 'Rabi',
          waterRequirement: 'Moderate',
          soilType: 'Loamy',
          yieldPerHectare: '1-2 tons',
          description: 'Pseudo-cereal crop for mountainous regions'
        },
        {
          id: 6,
          name: 'Kodo Millet',
          region: 'Tamil Nadu',
          season: 'Kharif',
          waterRequirement: 'Low',
          soilType: 'Red',
          yieldPerHectare: '1.5-2 tons',
          description: 'Traditional millet with high fiber content'
        },
        {
          id: 7,
          name: 'Little Millet',
          region: 'Andhra Pradesh',
          season: 'Kharif',
          waterRequirement: 'Low',
          soilType: 'Red',
          yieldPerHectare: '1-1.5 tons',
          description: 'Nutritious small grain crop'
        },
        {
          id: 8,
          name: 'Proso Millet',
          region: 'Uttar Pradesh',
          season: 'Kharif',
          waterRequirement: 'Low',
          soilType: 'Sandy',
          yieldPerHectare: '2-3 tons',
          description: 'Fast-growing millet crop'
        }
      ];
      
      setRegionalCrops(mockRegionalCrops);
      setLoading(false);
    };

    fetchRegionalCrops();
  }, []);

  const regions = [...new Set(regionalCrops.map(crop => crop.region))];
  
  const filteredCrops = regionalCrops.filter(crop => {
    const matchesRegion = selectedRegion === 'all' || crop.region === selectedRegion;
    const matchesSearch = crop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         crop.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRegion && matchesSearch;
  });

  return (
    <div className="regional-crops">
      <h3>Regional & Traditional Crops</h3>
      <div className="regional-crops-filters">
        <div className="filter-group">
          <label htmlFor="region-select">Region:</label>
          <select
            id="region-select"
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
          >
            <option value="all">All Regions</option>
            {regions.map(region => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label htmlFor="search-input">Search:</label>
          <input
            type="text"
            id="search-input"
            placeholder="Search crops..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {loading ? (
        <p>Loading regional crops...</p>
      ) : (
        <div className="regional-crops-grid">
          {filteredCrops.map(crop => (
            <div key={crop.id} className="regional-crop-card">
              <h4>{crop.name}</h4>
              <div className="crop-details">
                <p><strong>Region:</strong> {crop.region}</p>
                <p><strong>Season:</strong> {crop.season}</p>
                <p><strong>Water Requirement:</strong> {crop.waterRequirement}</p>
                <p><strong>Soil Type:</strong> {crop.soilType}</p>
                <p><strong>Yield:</strong> {crop.yieldPerHectare}</p>
              </div>
              <p className="crop-description">{crop.description}</p>
            </div>
          ))}
        </div>
      )}
      
      {filteredCrops.length === 0 && !loading && (
        <p className="no-results">No crops found for the selected filters.</p>
      )}
    </div>
  );
};

export default RegionalCrops;