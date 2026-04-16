import React, { useState } from 'react';
import { useI18n } from '../i18n/i18nContext';

const Support = () => {
  const { t } = useI18n();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    category: 'general'
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real app, this would send to backend
    console.log('Support request:', formData);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: '', subject: '', message: '', category: 'general' });
    }, 3000);
  };

  const faqs = [
    {
      question: t('faq1Question'),
      answer: t('faq1Answer')
    },
    {
      question: t('faq2Question'),
      answer: t('faq2Answer')
    },
    {
      question: t('faq3Question'),
      answer: t('faq3Answer')
    },
    {
      question: t('faq4Question'),
      answer: t('faq4Answer')
    },
    {
      question: t('faq5Question'),
      answer: t('faq5Answer')
    }
  ];

  const [openFaq, setOpenFaq] = useState(null);

  const contactInfo = {
    email: localStorage.getItem('contactEmail') || 'info@agrisense.com',
    phone: localStorage.getItem('contactPhone') || '+91 00000000',
    address: localStorage.getItem('contactAddress') || 'Surampalem, Andhra Pradesh, India'
  };

  return (
    <div className="support-page">
      <div className="container">
        <div className="page-header">
          <h1>{t('support')}</h1>
          <p>{t('supportSubtitle')}</p>
        </div>

        <div className="support-content">
          <div className="support-section">
            <h2>{t('supportContactUs')}</h2>
            <div className="contact-methods">
              <div className="contact-method">
                <div className="contact-icon">📧</div>
                <h3>{t('email')}</h3>
                <p>{contactInfo.email}</p>
              </div>
              <div className="contact-method">
                <div className="contact-icon">📞</div>
                <h3>{t('phone')}</h3>
                <p>{contactInfo.phone}</p>
              </div>
              <div className="contact-method">
                <div className="contact-icon">📍</div>
                <h3>{t('address')}</h3>
                <p>{contactInfo.address}</p>
              </div>
            </div>
          </div>

          <div className="support-section">
            <h2>{t('supportSendMessage')}</h2>
            {submitted ? (
              <div className="success-message">
                <p>✅ {t('supportMessageSent')}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="support-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">{t('name')}</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">{t('email')}</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="category">{t('supportCategory')}</label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                  >
                    <option value="general">{t('supportCategoryGeneral')}</option>
                    <option value="technical">{t('supportCategoryTechnical')}</option>
                    <option value="billing">{t('supportCategoryBilling')}</option>
                    <option value="feature">{t('supportCategoryFeature')}</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="subject">{t('subject')}</label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="message">{t('message')}</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows="6"
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary">
                  {t('sendMessage')}
                </button>
              </form>
            )}
          </div>

          <div className="support-section">
            <h2>{t('supportFaq')}</h2>
            <div className="faq-list">
              {faqs.map((faq, index) => (
                <div key={index} className="faq-item">
                  <button
                    className={`faq-question ${openFaq === index ? 'open' : ''}`}
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  >
                    {faq.question}
                    <span className="faq-toggle">{openFaq === index ? '−' : '+'}</span>
                  </button>
                  {openFaq === index && (
                    <div className="faq-answer">
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Support;
