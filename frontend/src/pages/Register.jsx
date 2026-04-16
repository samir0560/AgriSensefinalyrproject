import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../i18n/i18nContext';
import { translateApiMessage } from '../i18n/translateApiMessage';

const Register = () => {
  const { t } = useI18n();
  const { register, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError(t('authPasswordMismatch'));
      return;
    }
    if (!name.trim()) {
      setError(t('authNameRequired'));
      return;
    }
    setSubmitting(true);
    try {
      const result = await register(email.trim(), password, name.trim());
      if (result.success) navigate('/');
      else setError(translateApiMessage(result.message, t) || t('authErrorGeneric'));
    } catch {
      setError(t('authErrorGeneric'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-login-container">
      <div className="login-card">
        <h2>{t('authRegisterTitle')}</h2>
        <p className="login-hint" style={{ marginTop: '-1rem', marginBottom: '1.5rem' }}>
          {t('authRegisterSubtitle')}
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="reg-name">{t('authName')}</label>
            <input
              id="reg-name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
            />
          </div>
          <div className="form-group">
            <label htmlFor="reg-email">{t('authEmail')}</label>
            <input
              id="reg-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="reg-password">{t('authPassword')}</label>
            <div className="password-input">
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={t('authTogglePassword')}
                aria-pressed={showPassword}
              >
                <span className={showPassword ? 'eye-open' : 'eye-closed'} aria-hidden="true" />
              </button>
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="reg-confirm">{t('authConfirmPassword')}</label>
            <div className="password-input">
              <input
                id="reg-confirm"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={t('authTogglePassword')}
                aria-pressed={showConfirmPassword}
              >
                <span className={showConfirmPassword ? 'eye-open' : 'eye-closed'} aria-hidden="true" />
              </button>
            </div>
          </div>
          {error && (
            <p style={{ color: '#c62828', textAlign: 'left', marginTop: '0.75rem', fontSize: '0.9rem' }}>
              {error}
            </p>
          )}
          <button type="submit" className="btn btn-primary" disabled={submitting || authLoading}>
            {submitting ? t('authSubmitting') : t('authSubmitRegister')}
          </button>
        </form>
        <p className="back-link">
          {t('authHasAccount')} <Link to="/login">{t('login')}</Link>
        </p>
        <p className="back-link">
          <Link to="/">{t('home')}</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
