import React from 'react';
import { Link } from 'react-router';

/**
 * Forbidden (403) access screen
 */
const ForbiddenPage = () => {
  return (
    <main className="auth-canvas auth-canvas--centered" style={{ minHeight: '80vh' }}>
      <div className="auth-card auth-card--compact text-center" style={{ textAlign: 'center' }}>
        <div className="auth-error-icon" aria-hidden="true" style={{ marginBottom: '16px' }}>
          <i className="ri-shield-keyhole-line" style={{ fontSize: '48px', color: '#eb8e90' }} />
        </div>
        <h1 className="display-sm" style={{ marginBottom: '12px' }}>
          Access Denied
        </h1>
        <p className="body-md" style={{ marginBottom: '24px', maxWidth: '320px', marginLeft: 'auto', marginRight: 'auto' }}>
          You do not have permission to access the administrative portal.
        </p>
        <Link to="/profile" className="button-primary" style={{ display: 'inline-flex', width: 'auto' }}>
          Back to Dashboard
        </Link>
      </div>
    </main>
  );
};

export default ForbiddenPage;
