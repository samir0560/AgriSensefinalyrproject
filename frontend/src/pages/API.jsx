import React, { useState } from 'react';
import { useI18n } from '../i18n/i18nContext';

const API = () => {
  const { t } = useI18n();
  const [activeEndpoint, setActiveEndpoint] = useState('crop');

  const endpoints = [
    {
      id: 'crop',
      name: t('apiCropEndpoint'),
      method: 'POST',
      path: '/api/crop/recommend',
      description: t('apiCropEndpointDesc')
    },
    {
      id: 'fertilizer',
      name: t('apiFertilizerEndpoint'),
      method: 'POST',
      path: '/api/fertilizer/recommend',
      description: t('apiFertilizerEndpointDesc')
    },
    {
      id: 'disease',
      name: t('apiDiseaseEndpoint'),
      method: 'POST',
      path: '/api/disease/predict',
      description: t('apiDiseaseEndpointDesc')
    },
    {
      id: 'irrigation',
      name: t('apiIrrigationEndpoint'),
      method: 'POST',
      path: '/api/irrigation/recommend',
      description: t('apiIrrigationEndpointDesc')
    },
    {
      id: 'weather',
      name: t('apiWeatherEndpoint'),
      method: 'GET',
      path: '/api/weather/current',
      description: t('apiWeatherEndpointDesc')
    },
    {
      id: 'chatbot',
      name: t('apiChatbotEndpoint'),
      method: 'POST',
      path: '/api/chatbot/message',
      description: t('apiChatbotEndpointDesc')
    }
  ];

  const getEndpointDetails = (endpointId) => {
    const endpoint = endpoints.find(e => e.id === endpointId);
    if (!endpoint) return null;

    return (
      <div className="api-endpoint-details">
        <div className="api-method-badge">
          <span className={`method-${endpoint.method.toLowerCase()}`}>{endpoint.method}</span>
          <code>{endpoint.path}</code>
        </div>
        <p>{endpoint.description}</p>
        <h3>{t('apiRequestExample')}</h3>
        <pre className="code-block">
          <code>{getRequestExample(endpointId)}</code>
        </pre>
        <h3>{t('apiResponseExample')}</h3>
        <pre className="code-block">
          <code>{getResponseExample(endpointId)}</code>
        </pre>
      </div>
    );
  };

  const getRequestExample = (endpointId) => {
    switch (endpointId) {
      case 'crop':
        return `POST /api/crop/recommend
{
  "nitrogen": 25.5,
  "phosphorus": 45.2,
  "potassium": 120.5,
  "temperature": 28.5,
  "humidity": 65.0,
  "ph": 6.5,
  "rainfall": 150.0
}`;
      case 'fertilizer':
        return `POST /api/fertilizer/recommend
{
  "cropType": "rice",
  "soilType": "loamy",
  "nitrogen": 25.5,
  "phosphorus": 45.2,
  "potassium": 120.5
}`;
      case 'chatbot':
        return `POST /api/chatbot/message
{
  "message": "What crops grow best in sandy soil?",
  "locale": "en"
}`;
      default:
        return `POST ${endpoints.find(e => e.id === endpointId)?.path}
{
  // Request body parameters
}`;
    }
  };

  const getResponseExample = (endpointId) => {
    switch (endpointId) {
      case 'crop':
        return `{
  "success": true,
  "data": {
    "recommended_crop": "Rice",
    "confidence": 85.5
  }
}`;
      case 'chatbot':
        return `{
  "success": true,
  "data": {
    "response": "For sandy soil, crops like...",
    "timestamp": "2025-01-17T10:30:00Z"
  }
}`;
      default:
        return `{
  "success": true,
  "data": {
    // Response data
  }
}`;
    }
  };

  return (
    <div className="api-page">
      <div className="container">
        <div className="page-header">
          <h1>{t('api')}</h1>
          <p>{t('apiSubtitle')}</p>
        </div>

        <div className="api-content">
          <div className="api-sidebar">
            <nav className="api-nav">
              {endpoints.map((endpoint) => (
                <button
                  key={endpoint.id}
                  className={`api-nav-item ${activeEndpoint === endpoint.id ? 'active' : ''}`}
                  onClick={() => setActiveEndpoint(endpoint.id)}
                >
                  <span className="api-method">{endpoint.method}</span>
                  {endpoint.name}
                </button>
              ))}
            </nav>
          </div>

          <div className="api-main">
            {getEndpointDetails(activeEndpoint)}
          </div>
        </div>

        <div className="api-info-section">
          <h2>{t('apiBaseUrl')}</h2>
          <code className="base-url">https://agrisensefinalyrprojectt.onrender.com</code>
          
          <h2>{t('apiAuthentication')}</h2>
          <p>{t('apiAuthNote')}</p>
        </div>
      </div>
    </div>
  );
};

export default API;
