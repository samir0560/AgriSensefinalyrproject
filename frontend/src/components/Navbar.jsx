import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import LanguageSelector from './LanguageSelector';
import { useI18n } from '../i18n/i18nContext';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { t, dateLocale } = useI18n();
  const { user, logout, loading: authLoading } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navMenuRef = useRef(null);
  const navToggleBtnRef = useRef(null);

  const [time, setTime] = useState(new Date());

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isMenuOpen &&
        navMenuRef.current &&
        !navMenuRef.current.contains(event.target) &&
        navToggleBtnRef.current &&
        !navToggleBtnRef.current.contains(event.target)
      ) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const closeMenu = () => setIsMenuOpen(false);

  const userDisplayLabel = user
    ? (user.name || '').trim() || user.email || ''
    : '';
  const userInitial = user
    ? (() => {
        const n = (user.name || '').trim();
        if (n.length) return n.charAt(0).toUpperCase();
        const e = (user.email || '').trim();
        if (e.length) return e.charAt(0).toUpperCase();
        return '?';
      })()
    : '';

  const guestAuthBox = (forMenu) => (
    <div
      className={`nav-auth-box${forMenu ? ' nav-auth-box--in-menu' : ''}`}
      aria-label={t('navAccountAria')}
    >
      <Link
        to="/login"
        onClick={forMenu ? closeMenu : undefined}
        className={`nav-auth-link${location.pathname === '/login' ? ' nav-auth-link--active' : ''}`}
      >
        {t('login')}
      </Link>
      <span className="nav-auth-sep" aria-hidden="true">
        /
      </span>
      <Link
        to="/register"
        onClick={forMenu ? closeMenu : undefined}
        className={`nav-auth-link${location.pathname === '/register' ? ' nav-auth-link--active' : ''}`}
      >
        {t('signup')}
      </Link>
    </div>
  );

  const userAuthBox = (forMenu) => (
    <div
      className={`nav-auth-box${forMenu ? ' nav-auth-box--in-menu' : ''}`}
      aria-label={t('navAccountAria')}
    >
      <Link
        to="/account/settings"
        className="nav-user-initial nav-user-initial--link"
        title={userDisplayLabel}
        aria-label={`${t('accountManage')}: ${userDisplayLabel || user.email || ''}`}
        onClick={forMenu ? closeMenu : undefined}
      >
        {userInitial}
      </Link>
      <span className="nav-auth-sep" aria-hidden="true">
        /
      </span>
      <button
        type="button"
        className="nav-auth-link nav-auth-link--button"
        onClick={() => {
          logout();
          if (forMenu) closeMenu();
        }}
      >
        {t('logout')}
      </button>
    </div>
  );

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-logo-container">
          <Link to="/" className="nav-logo">
            🌱 {t('agrisense')}
          </Link>
        </div>

        <div
          className={`nav-menu ${isMenuOpen ? 'nav-menu-open' : ''}`}
          ref={navMenuRef}
        >
          <ul className="nav-menu-list">
            <li className="nav-item">
              <Link to="/" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                {t('home')}
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/crop" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                {t('cropPrediction')}
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/fertilizer" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                {t('fertilizerRecommendation')}
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/disease" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                {t('diseaseDetection')}
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/irrigation" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                {t('irrigationAdvice')}
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/weather" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                {t('weather')}
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/soil-analysis" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                {t('soilAnalysis')}
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/admin" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                {t('admin')}
              </Link>
            </li>
            {!authLoading && (
              <li className="nav-item nav-auth-menu-mobile">
                {user ? userAuthBox(true) : guestAuthBox(true)}
              </li>
            )}
          </ul>
        </div>

        <div className="nav-controls">
          <div className="nav-clock" aria-label={t('navClockAria')}>
            <span className="clock-icon">🕒</span>
            <span className="clock-time">
              {time.toLocaleTimeString(dateLocale, {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })}
            </span>
          </div>
          <LanguageSelector />
          {!authLoading && (
            <div className="nav-auth-desktop">{user ? userAuthBox(false) : guestAuthBox(false)}</div>
          )}
          <button
            className="nav-toggle-btn"
            onClick={toggleMenu}
            ref={navToggleBtnRef}
            aria-label={t('navMenuToggle')}
          >
            {isMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;