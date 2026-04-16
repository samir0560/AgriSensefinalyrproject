import React, { useState, useEffect } from 'react';

const SoilDataIntegration = () => {
  const [soilData, setSoilData] = useState({
    nitrogen: '',
    phosphorus: '',
    potassium: '',
    ph: '',
    temperature: '',
    humidity: '',
    location: '',
    lastUpdated: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Simulate fetching soil data from sensors/api
  useEffect(() => {
    const fetchSoilData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Simulate API call to get real-time soil data
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Mock data - in a real app, this would come from actual sensors
        const mockData = {
          nitrogen: (Math.random() * 100).toFixed(2),
          phosphorus: (Math.random() * 1000).toFixed(2),
          potassium: (Math.random() * 1000).toFixed(2),
          ph: (Math.random() * 7 + 4).toFixed(2), // pH between 4 and 11
          temperature: (Math.random() * 20 + 15).toFixed(2), // Temperature between 15 and 35
          humidity: (Math.random() * 50 + 30).toFixed(2), // Humidity between 30 and 80
          location: 'Field A, Plot 1',
          lastUpdated: new Date().toLocaleString()
        };
        
        setSoilData(mockData);
      } catch (err) {
        setError('Failed to fetch soil data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchSoilData();
    
    // Set up interval to refresh data every 5 minutes
    const interval = setInterval(fetchSoilData, 300000);
    
    return () => clearInterval(interval);
  }, []);

  const refreshData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call to get real-time soil data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data - in a real app, this would come from actual sensors
      const mockData = {
        nitrogen: (Math.random() * 100).toFixed(2),
        phosphorus: (Math.random() * 1000).toFixed(2),
        potassium: (Math.random() * 1000).toFixed(2),
        ph: (Math.random() * 7 + 4).toFixed(2),
        temperature: (Math.random() * 20 + 15).toFixed(2),
        humidity: (Math.random() * 50 + 30).toFixed(2),
        location: 'Field A, Plot 1',
        lastUpdated: new Date().toLocaleString()
      };
      
      setSoilData(mockData);
    } catch (err) {
      setError('Failed to refresh soil data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="soil-data-integration">
      <h3>Real-Time Soil Data</h3>
      {loading && <p>Loading soil data...</p>}
      {error && <div className="error">{error}</div>}
      
      {!loading && !error && (
        <div className="soil-data-grid">
          <div className="soil-data-card">
            <h4>Nitrogen (N)</h4>
            <p className="value">{soilData.nitrogen}%</p>
            <p className="status">Optimal</p>
          </div>
          <div className="soil-data-card">
            <h4>Phosphorus (P)</h4>
            <p className="value">{soilData.phosphorus} ppm</p>
            <p className="status">Good</p>
          </div>
          <div className="soil-data-card">
            <h4>Potassium (K)</h4>
            <p className="value">{soilData.potassium} ppm</p>
            <p className="status">Sufficient</p>
          </div>
          <div className="soil-data-card">
            <h4>pH Level</h4>
            <p className="value">{soilData.ph}</p>
            <p className="status">Neutral</p>
          </div>
          <div className="soil-data-card">
            <h4>Temperature</h4>
            <p className="value">{soilData.temperature}°C</p>
            <p className="status">Warm</p>
          </div>
          <div className="soil-data-card">
            <h4>Humidity</h4>
            <p className="value">{soilData.humidity}%</p>
            <p className="status">Moist</p>
          </div>
        </div>
      )}
      
      <div className="soil-data-actions">
        <button className="btn btn-secondary" onClick={refreshData} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh Data'}
        </button>
        <p className="last-updated">Last updated: {soilData.lastUpdated}</p>
      </div>
    </div>
  );
};

export default SoilDataIntegration;