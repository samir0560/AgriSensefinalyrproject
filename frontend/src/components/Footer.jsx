import React from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/i18nContext';

const Footer = () => {
  const { t } = useI18n();

  const [contactInfo, setContactInfo] = React.useState({
    email: localStorage.getItem('contactEmail') || 'info@agrisense.com',
    phone: localStorage.getItem('contactPhone') || '+91 00000000',
    address: localStorage.getItem('contactAddress') || 'Surampalem, Andhra Pradesh, India'
  });

  React.useEffect(() => {
    const handleStorageChange = () => {
      setContactInfo({
        email: localStorage.getItem('contactEmail') || 'info@agrisense.com',
        phone: localStorage.getItem('contactPhone') || '+91 00000000',
        address: localStorage.getItem('contactAddress') || 'Surampalem, Andhra Pradesh, India'
      });
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>{t('agrisense')}</h3>
            <p>{t('agriculturalSolutions')}</p>
            {/* <div className="social-links">
              <a href="#" aria-label="Facebook">📘</a>
              <a href="#" aria-label="Twitter">🐦</a>
              <a href="#" aria-label="Instagram">📸</a>
              <a href="#" aria-label="LinkedIn">👔</a>
            </div> */}
          </div>

          <div className="footer-section">
            <h3>{t('quickLinks')}</h3>
            <ul>
              <li><a href="/">{t('home')}</a></li>
              <li><a href="/crop">{t('cropPrediction')}</a></li>
              <li><a href="/fertilizer">{t('fertilizerRecommendation')}</a></li>
              <li><a href="/disease">{t('diseaseDetection')}</a></li>
              <li><a href="/irrigation">{t('irrigationAdvice')}</a></li>
              <li><a href="/about">{t('about')}</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h3>{t('resources')}</h3>
            <ul>
              <li><Link to="/blog">{t('blog')}</Link></li>
              <li><Link to="/documentation">{t('documentation')}</Link></li>
              <li><Link to="/api">{t('api')}</Link></li>
              <li><Link to="/tutorials">{t('tutorials')}</Link></li>
              <li><Link to="/support">{t('support')}</Link></li>
            </ul>
          </div>

          <div className="footer-section contact-info">
            <h3>{t('contact')}</h3>
            <p>📧 {contactInfo.email}</p>
            <p>📞 {contactInfo.phone}</p>
            <p>📍 {contactInfo.address}</p>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2025 {t('agrisense')}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;