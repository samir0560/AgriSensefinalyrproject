import React, { useEffect, useMemo } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../i18n/i18nContext';

const AccountLayout = () => {
  const { t, dateLocale } = useI18n();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login', { replace: true });
    }
  }, [loading, user, navigate]);

  const initial = useMemo(() => {
    if (!user) return '';
    const n = (user.name || '').trim();
    if (n.length) return n.charAt(0).toUpperCase();
    const e = (user.email || '').trim();
    if (e.length) return e.charAt(0).toUpperCase();
    return '?';
  }, [user]);

  const email = user?.email || '';
  const memberSince = useMemo(() => {
    if (!user?.createdAt) return null;
    try {
      return new Date(user.createdAt).toLocaleDateString(dateLocale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return null;
    }
  }, [user, dateLocale]);

  if (loading || !user) {
    return (
      <div className="account-page account-page--pro">
        <div className="account-shell account-shell--with-sidebar">
          <div className="account-loading-card">
            <div className="account-loading-shimmer" aria-hidden="true" />
            <p className="account-loading-text">{loading ? t('accountLoading') : t('accountLoginRequired')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="account-page account-page--pro account-page--split">
      <div className="account-shell account-shell--with-sidebar">
        <aside className="account-sidebar" aria-label={t('accountTitle')}>
          <div className="account-sidebar__sections">
            <p className="account-sidebar__section-label">{t('accountSidebarSections')}</p>
            <nav className="account-sidebar__nav">
              <NavLink
                to="/account/settings"
                className={({ isActive }) =>
                  `account-sidebar__link${isActive ? ' account-sidebar__link--active' : ''}`
                }
                end
              >
                <span className="account-sidebar__link-icon" aria-hidden="true">
                  ⚙️
                </span>
                <span>{t('accountNavSettings')}</span>
              </NavLink>
              <NavLink
                to="/account/features"
                className={({ isActive }) =>
                  `account-sidebar__link${isActive ? ' account-sidebar__link--active' : ''}`
                }
              >
                <span className="account-sidebar__link-icon" aria-hidden="true">
                  📋
                </span>
                <span>{t('accountNavFeatures')}</span>
              </NavLink>
            </nav>
          </div>
        </aside>

        <div className="account-layout-main">
          <Link to="/" className="account-back">
            ← {t('home')}
          </Link>

          <header className="account-header">
            <div className="account-avatar-lg" aria-hidden="true">
              {initial}
            </div>
            <div className="account-header-text">
              <h1>{t('accountHeaderTitle')}</h1>
              <p className="account-header-email">{email}</p>
              {memberSince && (
                <p className="account-header-meta">
                  {t('accountMemberSince')} {memberSince}
                </p>
              )}
            </div>
          </header>

          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AccountLayout;
