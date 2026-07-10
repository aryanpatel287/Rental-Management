import React from 'react';
import StatCardWidget from './widgets/StatCardWidget.jsx';
import ChartWidget from './widgets/ChartWidget.jsx';
import TableWidget from './widgets/TableWidget.jsx';
import ActivityFeedWidget from './widgets/ActivityFeedWidget.jsx';
import TaskListWidget from './widgets/TaskListWidget.jsx';
import ApprovalQueueWidget from './widgets/ApprovalQueueWidget.jsx';
import QuickActionsWidget from './widgets/QuickActionsWidget.jsx';
import AIPromptWidget from './widgets/AIPromptWidget.jsx';

const registry = {
  'stats-card': StatCardWidget,
  'chart': ChartWidget,
  'recent-table': TableWidget,
  'activity-feed': ActivityFeedWidget,
  'task-list': TaskListWidget,
  'approval-queue': ApprovalQueueWidget,
  'quick-actions': QuickActionsWidget,
  'ai-prompt': AIPromptWidget,
};

/**
 * Renders a specific widget based on layout configuration.
 */
export const renderWidget = (config) => {
  const WidgetComponent = registry[config.widgetType];
  
  if (!WidgetComponent) {
    return (
      <div className="unknown-widget-fallback">
        <p className="caption">Unknown widget type: {config.widgetType}</p>
      </div>
    );
  }

  return <WidgetComponent config={config} />;
};

export default renderWidget;
