import React, { useState } from 'react';
import { getIrrigationRecommendation } from '../api/api';
import { useI18n } from '../i18n/i18nContext';
import { useAuth } from '../contexts/AuthContext';

const Irrigation = () => {
  const { t } = useI18n();
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    crop: '',
    soilType: '',
    temperature: '',
    humidity: '',
    rainfall: '',
    season: 'Spring', // Default season
    latitude: '',
    longitude: '',
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
        temperature: parseFloat(formData.temperature),
        humidity: parseFloat(formData.humidity),
        rainfall: parseFloat(formData.rainfall),
        season: formData.season,
      };
      
      // Add location if provided
      if (formData.latitude && formData.longitude) {
        requestData.location = {
          coordinates: [parseFloat(formData.longitude), parseFloat(formData.latitude)]
        };
      }
      
      const response = await getIrrigationRecommendation(requestData, token);
      setResult(response.data);
    } catch (err) {
      console.error('Irrigation recommendation error:', err);
      setError(t('failedToGetIrrigation'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="irrigation-page">
      <div className="container">
        <h1>{t('irrigationAdviceTitle')}</h1>
        <p>{t('irrigationAdviceDesc')}</p>
        
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
              <option value="rice">Rice</option>
              <option value="wheat">Wheat</option>
              <option value="maize">Maize</option>
              <option value="sugarcane">Sugarcane</option>
              <option value="cotton">Cotton</option>
              <option value="barley">Barley</option>
              <option value="soybean">Soybean</option>
              <option value="millet">Millet</option>
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
            <label htmlFor="season">{t('season')}</label>
            <select
              id="season"
              name="season"
              value={formData.season}
              onChange={handleChange}
              required
            >
              <option value="Spring">{t('spring')}</option>
              <option value="Summer">{t('summer')}</option>
              <option value="Autumn">{t('autumn')}</option>
              <option value="Winter">{t('winter')}</option>
            </select>
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
            {loading ? t('calculating') : t('getIrrigationAdvice')}
          </button>
        </form>
        
        {error && <div className="error">{error}</div>}
        
        {result && (
          <div className="result">
            <h2>{t('irrigationAdviceTitle')}</h2>
            
            {/* Display main irrigation recommendation */}
            <div className="card" style={{ marginBottom: '1rem', padding: '1.5rem' }}>
              <h3 style={{ color: '#2e7d32', marginBottom: '0.5rem' }}>
                {t('recommendedMethod')}: {result.data?.recommendedMethod || result.recommendedMethod}
              </h3>
              <p>
                <strong>{t('waterAmount')}:</strong> {result.data?.waterAmount || result.waterAmount} mm/day
              </p>
              <p><strong>{t('frequency')}:</strong> {result.data?.frequency || result.frequency}</p>
              <p><strong>{t('timing')}:</strong> {result.data?.timing || result.timing}</p>
            </div>
            
            {/* Display location data if available */}
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
            
            {/* Display irrigation schedule */}
            {(result.data?.recommendedSchedule || result.recommendedSchedule) && (
              <div className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
                <h3>{t('irrigationSchedule')}</h3>
                <table className="schedule-table" style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd', marginTop: '0.5rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                      <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: 'bold', borderRight: '1px solid #ddd' }}>
                        {t('date')}
                      </th>
                      <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: 'bold', borderRight: '1px solid #ddd' }}>
                        {t('amount')} (mm)
                      </th>
                      <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: 'bold', borderRight: '1px solid #ddd' }}>
                        {t('time')}
                      </th>
                      <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: 'bold' }}>{t('notes')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(result.data?.recommendedSchedule || result.recommendedSchedule).slice(0, 7).map((schedule, index) => (
                      <tr key={index} style={{ borderBottom: index !== (result.data?.recommendedSchedule || result.recommendedSchedule).slice(0, 7).length - 1 ? '1px solid #eee' : 'none' }}>
                        <td style={{ padding: '0.75rem', borderRight: '1px solid #ddd' }}>{schedule.date}</td>
                        <td style={{ padding: '0.75rem', borderRight: '1px solid #ddd' }}>{schedule.amount}</td>
                        <td style={{ padding: '0.75rem', borderRight: '1px solid #ddd' }}>{schedule.time}</td>
                        <td style={{ padding: '0.75rem' }}>
                          {schedule.notes && schedule.notes.length > 0
                            ? schedule.notes.join(', ')
                            : t('noSpecificNotes')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Display notes */}
            {(result.data?.notes || result.notes) && (
              <div className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
                <h3>{t('recommendationsAndNotes')}</h3>
                <ul>
                  {(result.data?.notes || result.notes).map((note, index) => (
                    <li key={index}>{note}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Display input parameters */}
            <div className="parameters">
              <h3>{t('inputParameters')}:</h3>
              <ul>
                <li><strong>{t('cropType')}:</strong> {(result.data?.cropType || result.cropType)}</li>
                <li><strong>{t('soilType')}:</strong> {(result.data?.soilType || result.soilType)}</li>
                <li><strong>{t('season')}:</strong> {(result.data?.season || result.season)}</li>
                <li>
                  <strong>{t('calculatedWaterNeed')}:</strong>{' '}
                  {(result.data?.totalWaterNeed || result.totalWaterNeed)} mm/day
                </li>
                <li>
                  <strong>{t('baseWaterNeed')}:</strong>{' '}
                  {(result.data?.baseWaterNeed || result.baseWaterNeed)} mm/day
                </li>
                <li><strong>{t('soilFactor')}:</strong> {(result.data?.soilFactor || result.soilFactor)}</li>
                <li><strong>{t('weatherFactor')}:</strong> {(result.data?.weatherFactor || result.weatherFactor)}</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Irrigation;