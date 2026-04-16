import React from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/i18nContext';
import Carousel from '../components/Carousel';

const Dashboard = () => {
  const { t } = useI18n();
  
  return (
    <div className="landing-page">
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-content">
            <span className="hero-badge">
              <span className="hero-badge-dot" />
              {t('aiPoweredSolutions')}
            </span>
            <h1>{t('welcome')}</h1>
            <p>{t('aiPoweredSolutions')}</p>
            <div className="hero-buttons">
              <Link to="/crop" className="btn btn-primary">{t('cropPrediction')}</Link>
              <Link to="/fertilizer" className="btn btn-outline">{t('fertilizerRecommendation')}</Link>
              <Link to="/disease" className="btn btn-outline">{t('diseaseDetection')}</Link>
              <Link to="/irrigation" className="btn btn-outline">{t('irrigationAdvice')}</Link>
            </div>

            <div className="hero-metrics">
              <div className="hero-metric">
                <span className="hero-metric-value">24/7</span>
                <span className="hero-metric-label">{t('irrigationAdvice')}</span>
              </div>
              <div className="hero-metric">
                <span className="hero-metric-value">95%</span>
                <span className="hero-metric-label">{t('cropPrediction')}</span>
              </div>
              <div className="hero-metric">
                <span className="hero-metric-value">AI</span>
                <span className="hero-metric-label">{t('diseaseDetection')}</span>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-visual-card">
              <div className="hero-visual-pill" />
              <div className="hero-visual-row">
                <span className="hero-visual-label">{t('soilAnalysis')}</span>
                <span className="hero-visual-value">Optimal</span>
              </div>
              <div className="hero-visual-row">
                <span className="hero-visual-label">{t('weather')}</span>
                <span className="hero-visual-value">Smart alerts</span>
              </div>
              <div className="hero-visual-chart">
                <span />
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        </div>
      </section>

      <Carousel />

      <section className="features">
        <div className="container">
          <h2>{t('ourFeatures')}</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🌾</div>
              <h3>{t('cropPrediction')}</h3>
              <p>{t('cropPredictionFeature')}</p>
              <Link to="/crop" className="btn btn-outline">{t('learnMore')}</Link>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🌿</div>
              <h3>{t('fertilizerRecommendation')}</h3>
              <p>{t('fertilizerRecommendationFeature')}</p>
              <Link to="/fertilizer" className="btn btn-outline">{t('learnMore')}</Link>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🪴</div>
              <h3>{t('diseaseDetection')}</h3>
              <p>{t('diseaseDetectionFeature')}</p>
              <Link to="/disease" className="btn btn-outline">{t('learnMore')}</Link>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💧</div>
              <h3>{t('irrigationAdvice')}</h3>
              <p>{t('irrigationAdviceFeature')}</p>
              <Link to="/irrigation" className="btn btn-outline">{t('learnMore')}</Link>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🌱</div>
              <h3>{t('soilAnalysis')}</h3>
              <p>{t('soilAnalysisFeature')}</p>
              <Link to="/soil-analysis" className="btn btn-outline">{t('learnMore')}</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="how-it-works">
        <div className="container">
          <h2>{t('howItWorks')}</h2>
          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <h3>{t('inputData')}</h3>
              <p>{t('inputDataDesc')}</p>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <h3>{t('aiAnalysis')}</h3>
              <p>{t('aiAnalysisDesc')}</p>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <h3>{t('getResult')}</h3>
              <p>{t('getResultDesc')}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="cta">
        <div className="container">
          <h2>{t('readyToOptimize')}</h2>
          <p>{t('joinFarmers')}</p>
          <Link to="/crop" className="btn btn-outline">{t('getStartedToday')}</Link>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;