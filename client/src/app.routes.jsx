import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import Login from './features/auth/pages/Login';
import Register from './features/auth/pages/Register';
import VerifyEmail from './features/auth/pages/VerifyEmail';
import ForgotPassword from './features/auth/pages/ForgotPassword';
import HomePage from './features/shared/pages/HomePage';
import ProtectedRoute from './features/auth/components/ProtectedRoute';

import DashboardPage from './features/dashboard/pages/DashboardPage';
import { AdminProvider } from './features/admin/AdminContext';
import AdminDashboardPage from './features/admin/pages/AdminDashboardPage';
import DashboardLayout from './features/shared/components/DashboardLayout';

export const router = createBrowserRouter([
    {
        path: '/',
        element: (
            <ProtectedRoute>
                <DashboardLayout />
            </ProtectedRoute>
        ),
        children: [
            {
                index: true,
                element: <HomePage />,
            },
            {
                path: 'dashboard',
                element: <DashboardPage />,
            },
            {
                path: 'admin/users',
                element: (
                    <AdminProvider>
                        <AdminDashboardPage />
                    </AdminProvider>
                ),
            },
            {
                path: 'admin',
                element: <Navigate to="users" replace />,
            }
        ],
    },
    {
        path: '/login',
        element: <Login />,
    },
    {
        path: '/register',
        element: <Register />,
    },
    {
        path: '/verify-email',
        element: <VerifyEmail />,
    },
    {
        path: '/forgot-password',
        element: <ForgotPassword />,
    }
]);
