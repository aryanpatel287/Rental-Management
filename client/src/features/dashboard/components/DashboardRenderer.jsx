import React from 'react';
import GridLayout from './GridLayout.jsx';
import { renderWidget } from './WidgetRegistry.jsx';

/**
 * Loops through layout definitions and mounts each widget in a responsive cell container.
 */
const DashboardRenderer = ({ layout = [] }) => {
  return (
    <GridLayout>
      {layout.map((widget) => (
        <div
          key={widget.id}
          className={`dashboard-grid-item span-w-${widget.w || 4} span-h-${widget.h || 1}`}
        >
          {renderWidget(widget)}
        </div>
      ))}
    </GridLayout>
  );
};

export default DashboardRenderer;
