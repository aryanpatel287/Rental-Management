import React from 'react';
import { Outlet } from 'react-router';
import Sidebar from './Sidebar.jsx';

/**
 * Dashboard Layout layout component
 */
const DashboardLayout = () => {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-content">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
