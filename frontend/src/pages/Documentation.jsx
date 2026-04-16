import React, { useState } from 'react';
import { useI18n } from '../i18n/i18nContext';
import { Link } from 'react-router-dom';

const Documentation = () => {
  const { t } = useI18n();
  const [activeSection, setActiveSection] = useState('getting-started');

  const sections = [
    { id: 'getting-started', title: t('docGettingStarted'), icon: '🚀' },
    { id: 'crop-prediction', title: t('docCropPrediction'), icon: '🌾' },
    { id: 'fertilizer', title: t('docFertilizer'), icon: '🌿' },
    { id: 'disease-detection', title: t('docDiseaseDetection'), icon: '🪴' },
    { id: 'irrigation', title: t('docIrrigation'), icon: '💧' },
    { id: 'api-reference', title: t('docApiReference'), icon: '📚' }
  ];

  const getSectionContent = (sectionId) => {
    switch (sectionId) {
      case 'getting-started':
        return (
          <div>
            <h2>{t('docGettingStarted')}</h2>
            <p>{t('docGettingStartedDesc')}</p>
            <ol>
              <li>{t('docStep1')}</li>
              <li>{t('docStep2')}</li>
              <li>{t('docStep3')}</li>
              <li>{t('docStep4')}</li>
            </ol>
          </div>
        );
      case 'crop-prediction':
        return (
          <div>
            <h2>{t('docCropPrediction')}</h2>
            <p>{t('docCropPredictionDesc')}</p>
            <h3>{t('docHowToUse')}</h3>
            <ul>
              <li>{t('docCropStep1')}</li>
              <li>{t('docCropStep2')}</li>
              <li>{t('docCropStep3')}</li>
            </ul>
          </div>
        );
      case 'fertilizer':
        return (
          <div>
            <h2>{t('docFertilizer')}</h2>
            <p>{t('docFertilizerDesc')}</p>
            <h3>{t('docHowToUse')}</h3>
            <ul>
              <li>{t('docFertilizerStep1')}</li>
              <li>{t('docFertilizerStep2')}</li>
              <li>{t('docFertilizerStep3')}</li>
            </ul>
          </div>
        );
      case 'disease-detection':
        return (
          <div>
            <h2>{t('docDiseaseDetection')}</h2>
            <p>{t('docDiseaseDetectionDesc')}</p>
            <h3>{t('docHowToUse')}</h3>
            <ul>
              <li>{t('docDiseaseStep1')}</li>
              <li>{t('docDiseaseStep2')}</li>
              <li>{t('docDiseaseStep3')}</li>
            </ul>
          </div>
        );
      case 'irrigation':
        return (
          <div>
            <h2>{t('docIrrigation')}</h2>
            <p>{t('docIrrigationDesc')}</p>
            <h3>{t('docHowToUse')}</h3>
            <ul>
              <li>{t('docIrrigationStep1')}</li>
              <li>{t('docIrrigationStep2')}</li>
              <li>{t('docIrrigationStep3')}</li>
            </ul>
          </div>
        );
      case 'api-reference':
        return (
          <div>
            <h2>{t('docApiReference')}</h2>
            <p>{t('docApiReferenceDesc')}</p>
            <p>{t('docApiNote')}</p>
            <Link to="/api" className="btn btn-primary">{t('viewApiDocs')}</Link>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="documentation-page">
      <div className="container">
        <div className="page-header">
          <h1>{t('documentation')}</h1>
          <p>{t('docSubtitle')}</p>
        </div>

        <div className="doc-content">
          <div className="doc-sidebar">
            <nav className="doc-nav">
              {sections.map((section) => (
                <button
                  key={section.id}
                  className={`doc-nav-item ${activeSection === section.id ? 'active' : ''}`}
                  onClick={() => setActiveSection(section.id)}
                >
                  <span className="doc-nav-icon">{section.icon}</span>
                  {section.title}
                </button>
              ))}
            </nav>
          </div>

          <div className="doc-main">
            <div className="doc-section-content">
              {getSectionContent(activeSection)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Documentation;
