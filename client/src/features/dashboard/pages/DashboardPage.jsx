import React, { useEffect } from 'react';
import { useDashboard } from '../hooks/useDashboard.js';
import DashboardRenderer from '../components/DashboardRenderer.jsx';
import { useAuth } from '../../auth/hooks/useAuth.js';

/**
 * Main dashboard routing page. Displays role-based metrics, feeds, charts, and actions.
 */
const DashboardPage = () => {
  const { user } = useAuth();
  const { layout, loading, error, fetchDashboardConfig } = useDashboard();

  useEffect(() => {
    fetchDashboardConfig();
  }, [fetchDashboardConfig]);

  if (loading) {
    return (
      <div className="dashboard-page-loading">
        <div className="spinner" />
        <p>Loading layout widgets...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-page-error">
        <i className="ri-error-warning-line error-icon" aria-hidden="true" />
        <h2>Dashboard Load Error</h2>
        <p>{error}</p>
        <button onClick={fetchDashboardConfig} className="button-primary">
          Retry
        </button>
      </div>
    );
  }

  return (
    <main className="dashboard-page" role="main">
      <header className="dashboard-page-header">
        <div className="dashboard-page-header__welcome">
          <h1 className="display-sm">Dashboard</h1>
          {user && (
            <p className="body-md dashboard-page-header__subtext">
              Welcome back, <strong>{user.name}</strong> ({user.role})
            </p>
          )}
        </div>
      </header>

      <section className="dashboard-page-content">
        <DashboardRenderer layout={layout} />
      </section>
    </main>
  );
};

export default DashboardPage;
