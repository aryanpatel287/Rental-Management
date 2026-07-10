import React from 'react';

/**
 * Grid system wrapping dashboard widget elements.
 * Features 12 responsive layout columns.
 */
const GridLayout = ({ children }) => {
  return (
    <div className="dashboard-grid">
      {children}
    </div>
  );
};

export default GridLayout;
