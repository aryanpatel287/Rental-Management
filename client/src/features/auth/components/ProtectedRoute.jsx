import React from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '../hooks/useAuth.js';

/**
 * Route protection wrapper component
 */
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, isAuthenticated, loading } = useAuth();

  // Show premium minimalist loading screen while restoring session
  if (loading) {
    return (
      <div 
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          width: '100vw',
          backgroundColor: '#ffffff',
          color: '#171717',
        }}
        aria-live="polite"
      >
        <div 
          style={{
            width: '40px',
            height: '40px',
            border: '2px solid #f0f0f3',
            borderTop: '2px solid #171717',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            marginBottom: '16px',
          }}
        />
        <p style={{ fontSize: '14px', fontWeight: 500, letterSpacing: '0.5px' }}>Loading session…</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user?.role !== 'ADMIN') {
    return <Navigate to="/forbidden" replace />;
  }

  return children;
};

export default ProtectedRoute;
