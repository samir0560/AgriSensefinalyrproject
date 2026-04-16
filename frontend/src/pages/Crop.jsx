import React, { useState, useEffect } from 'react';
import { getCrops } from '../services/cropService';
import { getCropRecommendation } from '../api/api';
import { useI18n } from '../i18n/i18nContext';
import { useAuth } from '../contexts/AuthContext';

const Crop = () => {
  const { t } = useI18n();
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    nitrogen: '',
    phosphorus: '',
    potassium: '',
    temperature: '',
    humidity: '',
    ph: '',
    rainfall: '',
    latitude: '',
    longitude: '',
  });
  const [crops, setCrops] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load crops from service on component mount
  useEffect(() => {
    const loadedCrops = getCrops();
    setCrops(loadedCrops);
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Prepare data for API call
      const requestData = {
        nitrogen: parseFloat(formData.nitrogen),
        phosphorus: parseFloat(formData.phosphorus),
        potassium: parseFloat(formData.potassium),
        temperature: parseFloat(formData.temperature),
        humidity: parseFloat(formData.humidity),
        ph: parseFloat(formData.ph),
        rainfall: parseFloat(formData.rainfall),
      };
      
      // Add location if provided
      if (formData.latitude && formData.longitude) {
        requestData.location = {
          coordinates: [parseFloat(formData.longitude), parseFloat(formData.latitude)]
        };
      }
      
      const response = await getCropRecommendation(requestData, token);
      setResult(response.data);
    } catch (err) {
      console.error('Crop prediction error:', err);
      setError(t('failedToGetPrediction'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="crop-page">
      <div className="container">
        <h1>{t('cropPredictionTitle')}</h1>
        <p>{t('cropPredictionDesc')}</p>
        
        <form onSubmit={handleSubmit} className="input-form">
          <div className="form-group">
            <label htmlFor="nitrogen">{t('nitrogen')}</label>
            <input
              type="number"
              id="nitrogen"
              name="nitrogen"
              value={formData.nitrogen}
              onChange={handleChange}
              required
              min="0"
              max="100"
              step="0.01"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="phosphorus">{t('phosphorus')}</label>
            <input
              type="number"
              id="phosphorus"
              name="phosphorus"
              value={formData.phosphorus}
              onChange={handleChange}
              required
              min="0"
              max="1000"
              step="0.01"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="potassium">{t('potassium')}</label>
            <input
              type="number"
              id="potassium"
              name="potassium"
              value={formData.potassium}
              onChange={handleChange}
              required
              min="0"
              max="1000"
              step="0.01"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="temperature">{t('temperature')}</label>
            <input
              type="number"
              id="temperature"
              name="temperature"
              value={formData.temperature}
              onChange={handleChange}
              required
              min="-50"
              max="50"
              step="0.01"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="humidity">{t('humidity')}</label>
            <input
              type="number"
              id="humidity"
              name="humidity"
              value={formData.humidity}
              onChange={handleChange}
              required
              min="0"
              max="100"
              step="0.01"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="ph">{t('phLevel')}</label>
            <input
              type="number"
              id="ph"
              name="ph"
              value={formData.ph}
              onChange={handleChange}
              required
              min="0"
              max="14"
              step="0.01"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="rainfall">{t('rainfall')}</label>
            <input
              type="number"
              id="rainfall"
              name="rainfall"
              value={formData.rainfall}
              onChange={handleChange}
              required
              min="0"
              max="500"
              step="0.01"
            />
          </div>
          

          
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? t('predicting') : t('predictCrop')}
          </button>
        </form>
        
        {error && <div className="error">{error}</div>}
        
        {result && (
          <div className="result">
            <h2>{t('predictionResult')}</h2>
            {Array.isArray(result) && result.length > 0 ? (
              <div>
                <div className="card" style={{ marginBottom: '1rem', padding: '1.5rem' }}>
                  <h3 style={{ color: '#2e7d32', marginBottom: '0.5rem' }}>
                    {t('topRecommendedCrop')}: {result[0]?.name}
                  </h3>
                  <p><strong>{t('confidence')}:</strong> {result[0]?.confidence}%</p>
                  <p>{t('basedOnSoilAndClimate')}</p>
                </div>
                
                {result.length > 1 && (
                  <div className="card" style={{ padding: '1.5rem' }}>
                    <h3>{t('alternativeRecommendations')}</h3>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                      {result.slice(1).map((crop, index) => (
                        <li key={index + 1} style={{ marginBottom: '0.5rem', padding: '0.5rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                          <strong>{crop.name}</strong> - {crop.confidence}% confidence (Rank: {crop.rank})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : result?.recommended_crop ? (
              <div className="card" style={{ marginBottom: '1rem', padding: '1.5rem' }}>
                <h3 style={{ color: '#2e7d32', marginBottom: '0.5rem' }}>
                  {t('recommendedCrop')}: {result.recommended_crop}
                </h3>
                <p><strong>{t('confidence')}:</strong> {result.confidence || result.data?.confidence}%</p>
                <p>{result.message || result.data?.message}</p>
              </div>
            ) : result?.data ? (
              <div className="card" style={{ marginBottom: '1rem', padding: '1.5rem' }}>
                <h3 style={{ color: '#2e7d32', marginBottom: '0.5rem' }}>
                  {t('recommendedCrop')}: {result.data.recommended_crop || result.data.crop}
                </h3>
                <p><strong>{t('confidence')}:</strong> {result.data.confidence}%</p>
                <p>{result.data.message}</p>
              </div>
            ) : (
              <div className="card" style={{ marginBottom: '1rem', padding: '1.5rem' }}>
                <h3 style={{ color: '#2e7d32', marginBottom: '0.5rem' }}>
                  {t('recommendedCrop')}: {result.crop || result.data?.crop}
                </h3>
                <p><strong>{t('confidence')}:</strong> {result.confidence || result.data?.confidence}%</p>
                <p>{result.message || result.data?.message}</p>
              </div>
            )}
            
            {result.location && (
              <div className="card" style={{ padding: '1rem', backgroundColor: '#e8f5e9', marginBottom: '1rem' }}>
                <h3>{t('locationData')}</h3>
                <p><strong>{t('coordinates')}:</strong> [{result.location.coordinates[0]}, {result.location.coordinates[1]}]</p>
                <p>
                  <strong>{t('soilDataAvailable')}:</strong>{' '}
                  {result.location.soilDataAvailable ? t('yes') : t('no')}
                </p>
                <p>
                  <strong>{t('weatherDataAvailable')}:</strong>{' '}
                  {result.location.weatherDataAvailable ? t('yes') : t('no')}
                </p>
              </div>
            )}
            
            <div className="parameters">
              <h3>{t('inputParameters')}:</h3>
              <ul>
                <li><strong>{t('nitrogen')}:</strong> {result.details?.nitrogen || result.nitrogen || formData.nitrogen}%</li>
                <li><strong>{t('phosphorus')}:</strong> {result.details?.phosphorus || result.phosphorus || formData.phosphorus} ppm</li>
                <li><strong>{t('potassium')}:</strong> {result.details?.potassium || result.potassium || formData.potassium} ppm</li>
                <li><strong>{t('temperature')}:</strong> {result.details?.temperature || result.temperature || formData.temperature}°C</li>
                <li><strong>{t('humidity')}:</strong> {result.details?.humidity || result.humidity || formData.humidity}%</li>
                <li><strong>{t('phLevel')}:</strong> {result.details?.ph || result.ph || formData.ph} pH</li>
                <li><strong>{t('rainfall')}:</strong> {result.details?.rainfall || result.rainfall || formData.rainfall} mm</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Crop;