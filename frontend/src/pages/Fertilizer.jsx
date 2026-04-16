import React, { useState, useEffect } from 'react';
import { getCrops } from '../services/cropService';
import { getFertilizerRecommendation } from '../api/api';
import { useI18n } from '../i18n/i18nContext';
import { useAuth } from '../contexts/AuthContext';

const Fertilizer = () => {
  const { t } = useI18n();
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    crop: '',
    soilType: '',
    nitrogen: '',
    phosphorus: '',
    potassium: '',
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
        cropType: formData.crop,
        soilType: formData.soilType,
        nitrogen: parseFloat(formData.nitrogen),
        phosphorus: parseFloat(formData.phosphorus),
        potassium: parseFloat(formData.potassium),
      };
      
      // Add location if provided
      if (formData.latitude && formData.longitude) {
        requestData.location = {
          coordinates: [parseFloat(formData.longitude), parseFloat(formData.latitude)]
        };
      }
      
      const response = await getFertilizerRecommendation(requestData, token);
      setResult(response.data);
    } catch (err) {
      console.error('Fertilizer recommendation error:', err);
      setError(t('failedToGetFertilizer'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fertilizer-page">
      <div className="container">
        <h1>{t('fertilizerRecommendationTitle')}</h1>
        <p>{t('fertilizerRecommendationDesc')}</p>
        
        <form onSubmit={handleSubmit} className="input-form">
          <div className="form-group">
            <label htmlFor="crop">{t('cropType')}</label>
            <select
              id="crop"
              name="crop"
              value={formData.crop}
              onChange={handleChange}
              required
            >
              <option value="">{t('selectCrop')}</option>
              {crops.map(crop => (
                <option key={crop.id} value={crop.name.toLowerCase()}>
                  {crop.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="soilType">{t('soilType')}</label>
            <select
              id="soilType"
              name="soilType"
              value={formData.soilType}
              onChange={handleChange}
              required
            >
              <option value="">{t('selectSoilType')}</option>
              <option value="sandy">{t('sandy')}</option>
              <option value="loamy">{t('loamy')}</option>
              <option value="clay">{t('clay')}</option>
              <option value="silty">{t('silty')}</option>
              <option value="peaty">{t('peaty')}</option>
              <option value="chalky">{t('chalky')}</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="nitrogen">{t('currentNitrogenLevel')}</label>
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
            <label htmlFor="phosphorus">{t('currentPhosphorusLevel')}</label>
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
            <label htmlFor="potassium">{t('currentPotassiumLevel')}</label>
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
          

          
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? t('recommending') : t('recommendFertilizer')}
          </button>
        </form>
        
        {error && <div className="error">{error}</div>}
        
        {result && (
          <div className="result">
            <h2>{t('recommendationResult')}</h2>
            {Array.isArray(result) && result.length > 0 ? (
              <div>
                <div className="card" style={{ marginBottom: '1rem', padding: '1.5rem' }}>
                  <h3 style={{ color: '#2e7d32', marginBottom: '0.5rem' }}>
                    {t('topRecommendedFertilizer')}: {result[0]?.name || result[0]?.fertilizer}
                  </h3>
                  <p><strong>{t('confidence')}:</strong> {result[0]?.confidence}%</p>
                  <p>
                    <strong>{t('npkRatio')}:</strong>{' '}
                    {result[0]?.npk || `${result[0]?.nitrogen}-${result[0]?.phosphorus}-${result[0]?.potassium}`}
                  </p>
                  <p>{t('basedOnCropAndSoil')}</p>
                </div>
                
                {result.length > 1 && (
                  <div className="card" style={{ padding: '1.5rem' }}>
                    <h3>{t('alternativeRecommendations')}</h3>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                      {result.slice(1).map((fert, index) => (
                        <li key={index + 1} style={{ marginBottom: '0.5rem', padding: '0.5rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                          <strong>{fert.name || fert.fertilizer}</strong> - {fert.confidence}% {t('confidence')} (Rank: {fert.rank})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : result?.recommended_fertilizer ? (
              <div className="card" style={{ marginBottom: '1rem', padding: '1.5rem' }}>
                <h3 style={{ color: '#2e7d32', marginBottom: '0.5rem' }}>
                  {t('recommendedFertilizer')}: {result.recommended_fertilizer}
                </h3>
                <p><strong>{t('applicationRate')}:</strong> {result.applicationRate || result.data?.applicationRate}</p>
                <p>{result.message || result.data?.message}</p>
              </div>
            ) : result?.data ? (
              <div className="card" style={{ marginBottom: '1rem', padding: '1.5rem' }}>
                <h3 style={{ color: '#2e7d32', marginBottom: '0.5rem' }}>
                  {t('recommendedFertilizer')}: {result.data.recommended_fertilizer || result.data.fertilizer}
                </h3>
                <p><strong>{t('applicationRate')}:</strong> {result.data.applicationRate}</p>
                <p>{result.data.message}</p>
              </div>
            ) : (
              <div className="card" style={{ marginBottom: '1rem', padding: '1.5rem' }}>
                <h3 style={{ color: '#2e7d32', marginBottom: '0.5rem' }}>
                  {t('recommendedFertilizer')}: {result.fertilizer || result.data?.fertilizer}
                </h3>
                <p><strong>{t('applicationRate')}:</strong> {result.applicationRate || result.data?.applicationRate}</p>
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
              </div>
            )}
            
            <div className="parameters">
              <h3>{t('inputParameters')}:</h3>
              <ul>
                <li><strong>{t('cropType')}:</strong> {result.details?.crop || result.cropType || formData.crop}</li>
                <li><strong>{t('soilType')}:</strong> {result.details?.soilType || result.soilType || formData.soilType}</li>
                <li><strong>{t('currentNitrogenLevel')}:</strong> {result.details?.nitrogen || result.nitrogen || formData.nitrogen}%</li>
                <li><strong>{t('currentPhosphorusLevel')}:</strong> {result.details?.phosphorus || result.phosphorus || formData.phosphorus} ppm</li>
                <li><strong>{t('currentPotassiumLevel')}:</strong> {result.details?.potassium || result.potassium || formData.potassium} ppm</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Fertilizer;