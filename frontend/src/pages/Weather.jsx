import React, { useState } from 'react';
import { getWeatherData, getWeatherForecast } from '../api/api';
import { useI18n } from '../i18n/i18nContext';
import { useAuth } from '../contexts/AuthContext';

const Weather = () => {
  const { t } = useI18n();
  const { token } = useAuth();
  const [location, setLocation] = useState('');
  const [weatherData, setWeatherData] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('current');

  const fetchWeatherData = async () => {
    if (!location) {
      setError(t('pleaseEnterCity'));
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      let params = {};
      params.city = location;
      
      const response = await getWeatherData(params, token);
      setWeatherData(response);
    } catch (err) {
      console.error('Weather API error:', err); // For debugging
      const fallback = t('failedToGetWeather');
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        fallback;
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getForecastData = async () => {
    if (!location) {
      setError(t('pleaseEnterCity'));
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      let params = {};
      params.city = location;
      
      const response = await getWeatherForecast(params, token);
      setForecastData(response);
    } catch (err) {
      console.error('Forecast API error:', err); // For debugging
      const fallback = t('failedToGetWeather');
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        fallback;
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (activeTab === 'current') {
      fetchWeatherData();
    } else {
      getForecastData();
    }
  };

  return (
    <div className="weather-page">
      <div className="container">
        <h1>{t('weatherInfoTitle')}</h1>
        <p>{t('weatherInfoDesc')}</p>
        
        <form onSubmit={handleSearch} className="input-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="location">{t('cityName')}</label>
              <input
                type="text"
                id="location"
                name="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={t('enterCityName')}
              />
              <small className="form-help">{t('enterCityName')}</small>
            </div>
            

          </div>
          
          <div className="tabs">
            <button 
              type="button" 
              className={`tab-btn ${activeTab === 'current' ? 'active' : ''}`}
              onClick={() => setActiveTab('current')}
            >
              {t('currentWeather')}
            </button>
            <button 
              type="button" 
              className={`tab-btn ${activeTab === 'forecast' ? 'active' : ''}`}
              onClick={() => setActiveTab('forecast')}
            >
              {t('forecast')}
            </button>
          </div>
          
          <button type="submit" className="btn" disabled={loading}>
            {loading
              ? t('loading')
              : activeTab === 'current'
              ? t('getWeather')
              : t('getForecast')}
          </button>
        </form>
        
        {error && <div className="error">{error}</div>}
        
        {weatherData && activeTab === 'current' && weatherData.success && (
          <div className="result">
            <h2>{t('weatherIn')} {location}</h2>
            <div className="weather-info">
              <div className="weather-main">
                <p>{t('temperature')}: {weatherData.data?.main?.temp}°C</p>
                <p>{t('description')}: {weatherData.data?.weather?.[0]?.description}</p>
                <p>{t('humidity')}: {weatherData.data?.main?.humidity}%</p>
                <p>{t('windSpeed')}: {weatherData.data?.wind?.speed} m/s</p>
              </div>
            </div>
          </div>
        )}
        
        {forecastData && activeTab === 'forecast' && forecastData.success && (
          <div className="result">
            <h2>{t('weatherForecastFor')} {location}</h2>
            <div className="forecast-list">
              {forecastData.data?.list?.slice(0, 5).map((item, index) => (
                <div key={index} className="forecast-item">
                  <p>{t('date')}: {new Date(item?.dt * 1000).toLocaleDateString()}</p>
                  <p>{t('temperature')}: {item?.main?.temp}°C</p>
                  <p>{t('description')}: {item?.weather?.[0]?.description}</p>
                  <p>{t('humidity')}: {item?.main?.humidity}%</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Weather;