/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useCallback } from 'react';
import * as adminApi from './services/admin.api.js';
import { useAuth } from '../auth/hooks/useAuth.js';

export const AdminContext = createContext(null);

export const AdminProvider = ({ children }) => {
  const { showToast } = useAuth();
  const [usersList, setUsersList] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);

  // Admin: List all users
  const listUsers = useCallback(async (includeDeleted) => {
    try {
      setActionLoading(true);
      const res = await adminApi.listUsersApi(includeDeleted);
      if (res.success && res.data?.users) {
        setUsersList(res.data.users);
        return { success: true };
      }
      return { success: false, message: res.message || 'Failed to list users' };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to retrieve user list';
      showToast(errMsg, 'error');
      return { success: false, message: errMsg };
    } finally {
      setActionLoading(false);
    }
  }, [showToast]);

  // Admin: Promote/Demote user role
  const updateUserRole = useCallback(async (userId, role) => {
    try {
      setActionLoading(true);
      const res = await adminApi.updateUserRoleApi(userId, role);
      if (res.success) {
        showToast(res.message || 'User role updated successfully', 'success');
        // Refresh local list state
        setUsersList((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role } : u))
        );
        return { success: true };
      }
      return { success: false, message: res.message || 'Failed to update user role' };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to update user role';
      showToast(errMsg, 'error');
      return { success: false, message: errMsg };
    } finally {
      setActionLoading(false);
    }
  }, [showToast]);

  // Admin: Soft delete user
  const deleteUser = useCallback(async (userId) => {
    try {
      setActionLoading(true);
      const res = await adminApi.deleteUserApi(userId);
      if (res.success) {
        showToast(res.message || 'User deactivated successfully', 'success');
        // Update user state locally: mark as deleted/inactive
        setUsersList((prev) =>
          prev.map((u) =>
            u.id === userId
              ? { ...u, isDeleted: true, isActive: false, deletedAt: new Date().toISOString() }
              : u
          )
        );
        return { success: true };
      }
      return { success: false, message: res.message || 'Failed to deactivate user' };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to deactivate user';
      showToast(errMsg, 'error');
      return { success: false, message: errMsg };
    } finally {
      setActionLoading(false);
    }
  }, [showToast]);

  return (
    <AdminContext.Provider
      value={{
        usersList,
        actionLoading,
        listUsers,
        updateUserRole,
        deleteUser,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};
