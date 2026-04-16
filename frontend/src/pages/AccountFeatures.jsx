import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../i18n/i18nContext';
import { getMyFeatureResponses } from '../api/api';
import { getRequestRows, getResultRows } from '../utils/accountFeatureFormat';

const AccountFeatures = () => {
  const { t, dateLocale } = useI18n();
  const { token } = useAuth();

  const [featureItems, setFeatureItems] = useState([]);
  const [featureTotal, setFeatureTotal] = useState(0);
  const [featureLoading, setFeatureLoading] = useState(true);
  const [featureError, setFeatureError] = useState('');

  const loadFeatureHistory = useCallback(async () => {
    if (!token) return;
    setFeatureLoading(true);
    setFeatureError('');
    try {
      const res = await getMyFeatureResponses(token, { limit: 50, skip: 0 });
      if (res.success && Array.isArray(res.data)) {
        setFeatureItems(res.data);
        setFeatureTotal(typeof res.total === 'number' ? res.total : res.data.length);
      } else {
        setFeatureItems([]);
        setFeatureTotal(0);
        setFeatureError('load');
      }
    } catch {
      setFeatureItems([]);
      setFeatureTotal(0);
      setFeatureError('load');
    } finally {
      setFeatureLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      setFeatureLoading(false);
      setFeatureItems([]);
      return;
    }
    loadFeatureHistory();
  }, [token, loadFeatureHistory]);

  const featureTypeLabel = (ft) => {
    const key = `accountFeatureType_${ft}`;
    const label = t(key);
    return label === key ? ft.replace(/_/g, ' ') : label;
  };

  return (
    <section className="account-panel account-feature-panel" aria-labelledby="account-feature-heading">
      <div className="account-panel__header">
        <div className="account-panel__icon" aria-hidden="true">
          📋
        </div>
        <div>
          <h2 id="account-feature-heading" className="account-panel__title">
            {t('accountFeatureHistory')}
          </h2>
          <p className="account-panel__desc">{t('accountFeatureHistoryDesc')}</p>
        </div>
      </div>

      {featureLoading && <p className="account-feature-status">{t('accountFeatureLoading')}</p>}

      {!featureLoading && featureError && (
        <div className="account-feature-error">
          <span>{t('accountFeatureLoadError')}</span>
          <button type="button" className="account-feature-retry" onClick={loadFeatureHistory}>
            {t('accountFeatureRetry')}
          </button>
        </div>
      )}

      {!featureLoading && !featureError && featureItems.length === 0 && (
        <p className="account-feature-empty">{t('accountFeatureEmpty')}</p>
      )}

      {!featureLoading && !featureError && featureItems.length > 0 && (
        <ul className="account-feature-list">
          {featureItems.map((item) => {
            const dateStr =
              item.createdAt != null
                ? new Date(item.createdAt).toLocaleString(dateLocale, {
                    dateStyle: 'medium',
                    timeStyle: 'short'
                  })
                : '';
            const requestRows = getRequestRows(item.featureType, item.request, t);
            const resultRows = getResultRows(item.featureType, item.response, t);

            return (
              <li key={item.id} className="account-feature-card">
                <div className="account-feature-card__head">
                  <div className="account-feature-card__type">{featureTypeLabel(item.featureType)}</div>
                  {dateStr ? <div className="account-feature-card__date">{dateStr}</div> : null}
                </div>

                {requestRows.length > 0 ? (
                  <div className="account-feature-block">
                    <h3 className="account-feature-block__title">{t('accountFeatureSectionRequest')}</h3>
                    <dl className="account-feature-kv">
                      {requestRows.map((row, idx) => (
                        <div key={`req-${item.id}-${idx}`} className="account-feature-kv__row">
                          <dt className="account-feature-kv__label">{row.label}</dt>
                          <dd className="account-feature-kv__value">{row.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ) : null}

                {resultRows.length > 0 ? (
                  <div className="account-feature-block">
                    <h3 className="account-feature-block__title">{t('accountFeatureSectionResults')}</h3>
                    <dl className="account-feature-kv">
                      {resultRows.map((row, idx) => (
                        <div key={`res-${item.id}-${idx}`} className="account-feature-kv__row">
                          <dt className="account-feature-kv__label">{row.label}</dt>
                          <dd className="account-feature-kv__value">{row.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ) : null}

                {requestRows.length === 0 && resultRows.length === 0 ? (
                  <p className="account-feature-empty account-feature-empty--inline">{t('accountFeatureNoDisplay')}</p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      {!featureLoading && !featureError && featureTotal > featureItems.length ? (
        <p className="account-feature-note">
          {t('accountFeatureShowingCount')
            .replace('{shown}', String(featureItems.length))
            .replace('{total}', String(featureTotal))}
        </p>
      ) : null}
    </section>
  );
};

export default AccountFeatures;
