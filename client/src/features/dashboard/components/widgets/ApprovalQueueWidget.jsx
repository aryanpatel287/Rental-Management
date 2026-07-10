import React, { useState } from 'react';
import { useAuth } from '../../../auth/hooks/useAuth.js';

/**
 * Actionable approval queue widget with approve/reject callback buttons.
 */
const ApprovalQueueWidget = () => {
  const { showToast } = useAuth();
  const [approvals, setApprovals] = useState([
    { id: 1, type: 'Discount Override', requester: 'John Doe', details: '15% off MacBook fleet contract', status: 'pending' },
    { id: 2, type: 'Leave Request', requester: 'Sarah Connor', details: 'Annual Leave: 5 days', status: 'pending' }
  ]);

  const handleAction = (id, type, requester, approved) => {
    setApprovals(prev => prev.filter(item => item.id !== id));
    showToast(
      approved
        ? `Approved "${type}" by ${requester}`
        : `Rejected "${type}" by ${requester}`,
      approved ? 'success' : 'warning'
    );
  };

  return (
    <div className="approval-queue-widget">
      <header className="approval-queue-widget__header">
        <h3 className="approval-queue-widget__title">Approvals Queue</h3>
      </header>
      <div className="approval-queue-widget__body">
        {approvals.length === 0 ? (
          <div className="approval-queue-widget__empty">
            <i className="ri-checkbox-circle-line" />
            <p className="caption">All caught up!</p>
          </div>
        ) : (
          <ul className="approval-queue-widget__items">
            {approvals.map((app) => (
              <li key={app.id} className="approval-queue-widget__item">
                <div className="approval-queue-widget__details">
                  <span className="approval-queue-widget__type">{app.type}</span>
                  <span className="caption approval-queue-widget__requester">Requested by: {app.requester}</span>
                  <p className="caption approval-queue-widget__summary">{app.details}</p>
                </div>
                <div className="approval-queue-widget__actions">
                  <button
                    onClick={() => handleAction(app.id, app.type, app.requester, false)}
                    className="button-secondary approval-btn approval-btn--reject"
                    title="Reject"
                    aria-label="Reject approval"
                  >
                    <i className="ri-close-line" />
                  </button>
                  <button
                    onClick={() => handleAction(app.id, app.type, app.requester, true)}
                    className="button-primary approval-btn approval-btn--approve"
                    title="Approve"
                    aria-label="Approve request"
                  >
                    <i className="ri-check-line" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ApprovalQueueWidget;
