import React from 'react';
import { useNavigate } from 'react-router';

/**
 * Shortcuts widget displaying buttons for quick redirection to creation/management pages.
 */
const QuickActionsWidget = ({ config }) => {
  const { actions = [] } = config.settings;
  const navigate = useNavigate();

  return (
    <div className="quick-actions-widget">
      <header className="quick-actions-widget__header">
        <h3 className="quick-actions-widget__title">Quick Actions</h3>
      </header>
      <div className="quick-actions-widget__body">
        <div className="quick-actions-grid">
          {actions.map((act, idx) => (
            <button
              key={idx}
              onClick={() => navigate(act.path)}
              className="quick-action-btn"
              aria-label={act.label}
            >
              {act.icon && <i className={act.icon} aria-hidden="true" />}
              <span className="quick-action-btn__label">{act.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuickActionsWidget;
