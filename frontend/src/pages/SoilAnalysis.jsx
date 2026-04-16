import React, { useState } from 'react';
import { getSoilAnalysis } from '../api/api';
import { useI18n } from '../i18n/i18nContext';
import { useAuth } from '../contexts/AuthContext';

const SoilAnalysis = () => {
  const { t } = useI18n();
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    pH: '',
    nitrogen: '',
    phosphorus: '',
    potassium: '',
    soilType: '',
    temperature: '',
    moisture: ''
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
      const data = {
        pH: parseFloat(formData.pH),
        nitrogen: parseFloat(formData.nitrogen),
        phosphorus: parseFloat(formData.phosphorus),
        potassium: parseFloat(formData.potassium),
        soilType: formData.soilType,
        temperature: formData.temperature ? parseFloat(formData.temperature) : undefined,
        moisture: formData.moisture ? parseFloat(formData.moisture) : undefined
      };

      const response = await getSoilAnalysis(data, token);
      setResult(response.data);
    } catch (error) {
      console.error('Error getting soil analysis:', error);
      setError(t('failedToGetSoilAnalysis'));
    } finally {
      setLoading(false);
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      default: return 'priority-low';
    }
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case 'high': return t('highPriority');
      case 'medium': return t('mediumPriority');
      default: return t('lowPriority');
    }
  };

  return (
    <div className="soil-analysis-page">
      <div className="container">
        <h1>{t('soilAnalysisTitle')}</h1>
        <p>{t('soilAnalysisDesc')}</p>
        
        <form onSubmit={handleSubmit} className="input-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="pH">{t('phLevelDesc')}</label>
              <input
                type="number"
                id="pH"
                name="pH"
                value={formData.pH}
                onChange={handleChange}
                required
                min="0"
                max="14"
                step="0.1"
                placeholder="e.g., 6.5"
              />
              <small className="form-help">{t('phHelp')}</small>
            </div>
            
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
                placeholder="e.g., 25.5"
              />
              <small className="form-help">{t('nitrogenHelp')}</small>
            </div>
          </div>
          
          <div className="form-row">
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
                placeholder="e.g., 45.2"
              />
              <small className="form-help">{t('phosphorusHelp')}</small>
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
                placeholder="e.g., 120.5"
              />
              <small className="form-help">{t('potassiumHelp')}</small>
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="soilType">{t('soilType')}</label>
              <select
                id="soilType"
                name="soilType"
                value={formData.soilType}
                onChange={handleChange}
              >
                <option value="">{t('selectSoilType')}</option>
                <option value="sandy">{t('sandy')}</option>
                <option value="loamy">{t('loamy')}</option>
                <option value="clay">{t('clay')}</option>
                <option value="silty">{t('silty')}</option>
                <option value="peaty">{t('peaty')}</option>
                <option value="chalky">{t('chalky')}</option>
                <option value="alluvial">{t('alluvial')}</option>
                <option value="black">{t('black')}</option>
                <option value="red">{t('red')}</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="temperature">{t('soilTemperature')}</label>
              <input
                type="number"
                id="temperature"
                name="temperature"
                value={formData.temperature}
                onChange={handleChange}
                min="-50"
                max="100"
                step="0.1"
                placeholder="e.g., 22.5"
              />
              <small className="form-help">{t('soilTemperatureHelp')}</small>
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="moisture">{t('soilMoisture')}</label>
            <input
              type="number"
              id="moisture"
              name="moisture"
              value={formData.moisture}
              onChange={handleChange}
              min="0"
              max="100"
              step="0.1"
              placeholder="e.g., 35.0"
            />
            <small className="form-help">{t('soilMoistureHelp')}</small>
          </div>
          
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? t('analyzing') : t('getSoilAnalysis')}
          </button>
        </form>
        
        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}
        
        {result && (
          <div className="result-section">
            <h2>{t('soilAnalysisResults')}</h2>
            
            <div className="analysis-summary">
              <div className="summary-item">
                <h3>{t('phLevelDesc')}</h3>
                <p className="value">{result.pHLevel}</p>
              </div>
              
              <div className="summary-item">
                <h3>{t('nutrientLevels')}</h3>
                <div className="nutrient-levels">
                  <div className="nutrient-item">
                    <span className="nutrient-name">{t('nitrogen')}:</span>
                    <span className="nutrient-value">{result.nutrientLevels.nitrogen}</span>
                  </div>
                  <div className="nutrient-item">
                    <span className="nutrient-name">{t('phosphorus')}:</span>
                    <span className="nutrient-value">{result.nutrientLevels.phosphorus}</span>
                  </div>
                  <div className="nutrient-item">
                    <span className="nutrient-name">{t('potassium')}:</span>
                    <span className="nutrient-value">{result.nutrientLevels.potassium}</span>
                  </div>
                </div>
              </div>
              
              <div className="summary-item">
                <h3>{t('soilType')}</h3>
                <p className="value">{result.soilType}</p>
              </div>
            </div>
            
            {result.recommendations && result.recommendations.length > 0 && (
              <div className="recommendations-section">
                <h3>{t('recommendations')}</h3>
                <div className="recommendations-list">
                  {result.recommendations.map((rec, index) => (
                    <div key={index} className={`recommendation-item ${getPriorityClass(rec.priority)}`}>
                      <div className="recommendation-header">
                        <span className="recommendation-type">{rec.type}</span>
                        <span className={`priority-badge ${getPriorityClass(rec.priority)}`}>
                          {getPriorityText(rec.priority)}
                        </span>
                      </div>
                      <p className="recommendation-text">{rec.suggestion}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {result.cropSuitability && result.cropSuitability.length > 0 && (
              <div className="crop-suitability-section">
                <h3>{t('suitableCrops')}</h3>
                <div className="crop-suitability-list">
                  <p className="crop-list">{Array.isArray(result.cropSuitability) ? result.cropSuitability.join(', ') : result.cropSuitability}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SoilAnalysis;