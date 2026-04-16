import React from 'react';
import { useI18n } from '../i18n/i18nContext';

const About = () => {
  const { t } = useI18n();

  return (
    <div className="about-content">
      <div className="container">
        <div className="about-section">
          <h2>{t('aboutUs')}</h2>
          <p>{t('technologyDesc')}</p>
        </div>

        <div className="about-section">
          <h2>{t('ourTechnology')}</h2>
          <p>{t('technologyDesc')}</p>
          <div className="tech-features">
            <div className="tech-feature">
              <h3>{t('cropPredictionTech')}</h3>
              <p>{t('cropPredictionTechDesc')}</p>
            </div>
            <div className="tech-feature">
              <h3>{t('diseaseDetection')}</h3>
              <p>{t('diseaseDetectionFeature')}</p>
            </div>
            <div className="tech-feature">
              <h3>{t('fertilizerRecommendationTech')}</h3>
              <p>{t('fertilizerRecommendationTechDesc')}</p>
            </div>
            <div className="tech-feature">
              <h3>{t('irrigationAdviceTech')}</h3>
              <p>{t('irrigationAdviceTechDesc')}</p>
            </div>
          </div>
        </div>

        <div className="about-section">
          <h2>{t('ourBenefits')}</h2>
          <ul className="benefits-list">
            <li>{t('benefitIncreasedYield')}</li>
            <li>{t('benefitReducedCosts')}</li>
            <li>{t('benefitEarlyDetection')}</li>
            <li>{t('benefitDataDriven')}</li>
            <li>{t('benefitExpertKnowledge')}</li>
          </ul>
        </div>

        <div className="cta-section">
          <h2>{t('readyToTransformFarming')}</h2>
          <p>{t('joinFarmers')}</p>
          <a href="/crop" className="btn btn-outline">{t('getStartedToday')}</a>
        </div>
      </div>
    </div>
  );
};

export default About;