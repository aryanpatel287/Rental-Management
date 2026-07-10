import React from 'react';

/**
 * Activity feed widget displaying a timeline of operations.
 */
const ActivityFeedWidget = () => {
  const activities = [
    { id: 1, action: 'Product created', detail: 'Added "MacBook Pro 16" in Electronics', time: '10 mins ago', icon: 'ri-add-circle-line', color: 'success' },
    { id: 2, action: 'Lead status changed', detail: 'Sarah Connor updated to "Contacted"', time: '1 hour ago', icon: 'ri-user-shared-line', color: 'warning' },
    { id: 3, action: 'Database backup', detail: 'Completed daily snapshot successfully', time: '4 hours ago', icon: 'ri-database-line', color: 'info' },
    { id: 4, action: 'New lead added', detail: 'Bruce Wayne registered via website form', time: 'Yesterday', icon: 'ri-user-add-line', color: 'success' }
  ];

  return (
    <div className="activity-feed-widget">
      <header className="activity-feed-widget__header">
        <h3 className="activity-feed-widget__title">Recent Activity</h3>
      </header>
      <div className="activity-feed-widget__body">
        <ul className="activity-timeline">
          {activities.map((act) => (
            <li key={act.id} className="activity-timeline__item">
              <div className={`activity-timeline__icon-wrapper activity-timeline__icon-wrapper--${act.color}`}>
                <i className={act.icon} aria-hidden="true" />
              </div>
              <div className="activity-timeline__content">
                <p className="activity-timeline__action">{act.action}</p>
                <p className="activity-timeline__detail">{act.detail}</p>
                <span className="caption activity-timeline__time">{act.time}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ActivityFeedWidget;
