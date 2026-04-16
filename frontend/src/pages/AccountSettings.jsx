import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../i18n/i18nContext';
import { updateUserProfile } from '../api/api';
import { translateApiMessage } from '../i18n/translateApiMessage';

const AccountSettings = () => {
  const { t } = useI18n();
  const { user, token, setUser } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNew, setConfirmNew] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const np = newPassword.trim();
    const cp = confirmNew.trim();
    const cur = currentPassword.trim();

    if (cur && !np && !cp) {
      setError(t('accountPasswordStrayCurrent'));
      return;
    }
    if (np || cp) {
      if (!cur) {
        setError(t('accountPasswordChangeRequiresCurrent'));
        return;
      }
      if (!np || np.length < 6) {
        setError(t('accountNewPasswordShort'));
        return;
      }
      if (np !== cp) {
        setError(t('authPasswordMismatch'));
        return;
      }
    }

    if (!name.trim() || name.trim().length < 2) {
      setError(t('authNameRequired'));
      return;
    }
    if (!email.trim()) {
      setError(t('authErrorGeneric'));
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        email: email.trim(),
        ...(np ? { currentPassword: cur, newPassword: np } : {})
      };
      const res = await updateUserProfile(token, payload);
      if (res.success && res.user) {
        setUser(res.user);
        setSuccess(t('accountSuccess'));
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNew('');
      } else {
        setError(translateApiMessage(res.message, t) || t('authErrorGeneric'));
      }
    } catch {
      setError(t('authErrorGeneric'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="account-form" noValidate>
      {error && (
        <div className="account-alert account-alert--error" role="alert">
          <span className="account-alert-icon" aria-hidden="true">
            !
          </span>
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="account-alert account-alert--success" role="status">
          <span className="account-alert-icon" aria-hidden="true">
            ✓
          </span>
          <span>{success}</span>
        </div>
      )}

      <section className="account-panel" aria-labelledby="account-profile-heading">
        <div className="account-panel__header">
          <div className="account-panel__icon" aria-hidden="true">
            👤
          </div>
          <div>
            <h2 id="account-profile-heading" className="account-panel__title">
              {t('accountProfileSection')}
            </h2>
            <p className="account-panel__desc">{t('accountProfileSectionDesc')}</p>
          </div>
        </div>
        <div className="account-fields">
          <div className="form-group">
            <label htmlFor="acct-name">{t('authName')}</label>
            <input
              id="acct-name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
            />
          </div>
          <div className="form-group">
            <label htmlFor="acct-email">{t('authEmail')}</label>
            <input
              id="acct-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>
      </section>

      <section className="account-panel" aria-labelledby="account-security-heading">
        <div className="account-panel__header">
          <div className="account-panel__icon" aria-hidden="true">
            🔒
          </div>
          <div>
            <h2 id="account-security-heading" className="account-panel__title">
              {t('accountSecuritySection')}
            </h2>
            <p className="account-panel__desc">{t('accountPasswordHint')}</p>
          </div>
        </div>
        <div className="account-fields">
          <div className="form-group">
            <label htmlFor="acct-cur-pw">{t('accountCurrentPassword')}</label>
            <div className="password-input">
              <input
                id="acct-cur-pw"
                type={showCurrent ? 'text' : 'password'}
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowCurrent(!showCurrent)}
                aria-label={t('authTogglePassword')}
                aria-pressed={showCurrent}
              >
                <span className={showCurrent ? 'eye-open' : 'eye-closed'} aria-hidden="true" />
              </button>
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="acct-new-pw">{t('accountNewPassword')}</label>
            <div className="password-input">
              <input
                id="acct-new-pw"
                type={showNew ? 'text' : 'password'}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
                placeholder="••••••••"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowNew(!showNew)}
                aria-label={t('authTogglePassword')}
                aria-pressed={showNew}
              >
                <span className={showNew ? 'eye-open' : 'eye-closed'} aria-hidden="true" />
              </button>
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="acct-confirm-pw">{t('accountConfirmNewPassword')}</label>
            <div className="password-input">
              <input
                id="acct-confirm-pw"
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmNew}
                onChange={(e) => setConfirmNew(e.target.value)}
                placeholder="••••••••"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirm(!showConfirm)}
                aria-label={t('authTogglePassword')}
                aria-pressed={showConfirm}
              >
                <span className={showConfirm ? 'eye-open' : 'eye-closed'} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="account-actions">
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? t('accountSaving') : t('accountSave')}
        </button>
      </div>
    </form>
  );
};

export default AccountSettings;
