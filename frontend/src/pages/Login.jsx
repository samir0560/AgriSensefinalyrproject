import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../i18n/i18nContext';
import { translateApiMessage } from '../i18n/translateApiMessage';

const Login = () => {
  const { t } = useI18n();
  const { login, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const result = await login(email.trim(), password);
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
        <h2>{t('authLoginTitle')}</h2>
        <p className="login-hint" style={{ marginTop: '-1rem', marginBottom: '1.5rem' }}>
          {t('authLoginSubtitle')}
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="user-email">{t('authEmail')}</label>
            <input
              id="user-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="user-password">{t('authPassword')}</label>
            <div className="password-input">
              <input
                id="user-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
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
          {error && (
            <p style={{ color: '#c62828', textAlign: 'left', marginTop: '0.75rem', fontSize: '0.9rem' }}>
              {error}
            </p>
          )}
          <button type="submit" className="btn btn-primary" disabled={submitting || authLoading}>
            {submitting ? t('authSubmitting') : t('authSubmitLogin')}
          </button>
        </form>
        <p className="back-link">
          {t('authNoAccount')} <Link to="/register">{t('register')}</Link>
        </p>
        <p className="back-link">
          <Link to="/">{t('home')}</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
