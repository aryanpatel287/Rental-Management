import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../../../app/runtime.config.js';

/**
 * Metric card widget representing numerical totals or averages.
 */
const StatCardWidget = ({ config }) => {
  const { title, count: defaultCount, endpoint, icon, badgeText, badgeType } = config.settings;
  const [count, setCount] = useState(defaultCount ?? '—');
  const [loading, setLoading] = useState(!!endpoint);

  useEffect(() => {
    const fetchStat = async () => {
      if (!endpoint) return;
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}${endpoint}`, {
          withCredentials: true,
        });
        
        // Handle standard paginated CRUD response
        if (response.data?.success && response.data?.data?.pagination) {
          setCount(response.data.data.pagination.totalRecords);
        } else if (response.data?.success && response.data?.data?.count !== undefined) {
          setCount(response.data.data.count);
        }
      } catch (err) {
        console.error(`Error loading stats for ${title}:`, err);
        setCount('Error');
      } finally {
        setLoading(false);
      }
    };

    fetchStat();
  }, [endpoint, title]);

  const renderBadge = () => {
    if (!badgeText) return null;
    return (
      <span className={`badge-pill badge-pill--${badgeType || 'muted'} stat-card-widget__badge`}>
        {badgeText}
      </span>
    );
  };

  return (
    <article className="stat-card-widget">
      <div className="stat-card-widget__header">
        <span className="caption-uppercase stat-card-widget__title">{title}</span>
        {icon && <i className={`${icon} stat-card-widget__icon`} aria-hidden="true" />}
      </div>
      <div className="stat-card-widget__content">
        {loading ? (
          <div className="stat-card-widget__spinner" />
        ) : (
          <span className="display-sm stat-card-widget__count">{count}</span>
        )}
        {renderBadge()}
      </div>
    </article>
  );
};

export default StatCardWidget;
