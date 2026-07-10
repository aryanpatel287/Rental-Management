import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import LoginPage from '../features/auth/pages/LoginPage.jsx';
import RegisterPage from '../features/auth/pages/RegisterPage.jsx';
import ProfilePage from '../features/auth/pages/ProfilePage.jsx';
import AdminDashboardPage from '../features/admin/pages/AdminDashboardPage.jsx';
import { AdminProvider } from '../features/admin/AdminContext.jsx';
import ForbiddenPage from '../features/auth/pages/ForbiddenPage.jsx';
import ProtectedRoute from '../features/auth/components/ProtectedRoute.jsx';
import DashboardLayout from '../features/shared/components/DashboardLayout.jsx';
import CrudListPage from '../features/crud/pages/CrudListPage.jsx';
import CrudFormPage from '../features/crud/pages/CrudFormPage.jsx';
import DashboardPage from '../features/dashboard/pages/DashboardPage.jsx';

export const router = createBrowserRouter([
  // Standalone Auth Screens (No main Navbar)
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },

  // Authenticated App Screens (Includes main Navbar)
  {
    path: '/',
    element: <DashboardLayout />,
    children: [
      {
        path: '',
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'profile',
        element: (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/users',
        element: (
          <ProtectedRoute requireAdmin={true}>
            <AdminProvider>
              <AdminDashboardPage />
            </AdminProvider>
          </ProtectedRoute>
        ),
      },
      {
        path: 'crud/:entity',
        element: (
          <ProtectedRoute>
            <CrudListPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'crud/:entity/new',
        element: (
          <ProtectedRoute>
            <CrudFormPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'crud/:entity/:id/edit',
        element: (
          <ProtectedRoute>
            <CrudFormPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'forbidden',
        element: <ForbiddenPage />,
      },
    ],
  },

  // Fallback Catch-All
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);
