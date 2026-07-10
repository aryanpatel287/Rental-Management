/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useEffect, useCallback } from 'react';
import * as authApi from './services/auth.api.js';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true); // blocking initial load verify
  const [actionLoading, setActionLoading] = useState(false); // non-blocking actions
  const [authError, setAuthError] = useState(null);
  const [toasts, setToasts] = useState([]);

  // Toast Helper
  const showToast = useCallback((message, type = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto dismiss after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  }, []);

  // Fetch current user details on app load
  const getMe = useCallback(async () => {
    try {
      setLoading(true);
      const res = await authApi.getMeApi();
      if (res.success && res.data?.user) {
        setUser(res.data.user);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch {
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Run on mount
  useEffect(() => {
    getMe();
  }, [getMe]);

  // Login Action
  const login = async (email, password) => {
    try {
      setActionLoading(true);
      setAuthError(null);
      const res = await authApi.loginApi(email, password);
      if (res.success && res.data?.user) {
        setUser(res.data.user);
        setIsAuthenticated(true);
        showToast(res.message || 'Logged in successfully', 'success');
        return { success: true };
      }
      return { success: false, message: res.message || 'Login failed' };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Invalid email or password';
      setAuthError(errMsg);
      return { 
        success: false, 
        message: errMsg, 
        errors: err.response?.data?.errors || [] 
      };
    } finally {
      setActionLoading(false);
    }
  };

  // Register Action
  const register = async (name, email, password) => {
    try {
      setActionLoading(true);
      setAuthError(null);
      const res = await authApi.registerApi(name, email, password);
      if (res.success && res.data?.user) {
        setUser(res.data.user);
        setIsAuthenticated(true);
        showToast(res.message || 'Account created successfully', 'success');
        return { success: true };
      }
      return { success: false, message: res.message || 'Registration failed' };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Registration failed';
      setAuthError(errMsg);
      return { 
        success: false, 
        message: errMsg, 
        errors: err.response?.data?.errors || [] 
      };
    } finally {
      setActionLoading(false);
    }
  };

  // Logout Action
  const logout = async () => {
    try {
      setActionLoading(true);
      await authApi.logoutApi();
      setUser(null);
      setIsAuthenticated(false);
      showToast('Logged out successfully', 'success');
    } catch {
      // Clear client state anyway
      setUser(null);
      setIsAuthenticated(false);
      showToast('Session cleared', 'success');
    } finally {
      setActionLoading(false);
    }
  };

  // Update Profile Action
  const updateProfile = async (name, email) => {
    try {
      setActionLoading(true);
      const res = await authApi.updateProfileApi(name, email);
      if (res.success && res.data?.user) {
        setUser(res.data.user);
        showToast(res.message || 'Profile updated successfully', 'success');
        return { success: true };
      }
      return { success: false, message: res.message || 'Update failed' };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Update failed';
      showToast(errMsg, 'error');
      return { 
        success: false, 
        message: errMsg, 
        errors: err.response?.data?.errors || [] 
      };
    } finally {
      setActionLoading(false);
    }
  };

  // Change Password Action
  const changePassword = async (currentPassword, newPassword) => {
    try {
      setActionLoading(true);
      const res = await authApi.changePasswordApi(currentPassword, newPassword);
      if (res.success) {
        showToast(res.message || 'Password changed successfully', 'success');
        return { success: true };
      }
      return { success: false, message: res.message || 'Password change failed' };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Password change failed';
      showToast(errMsg, 'error');
      return { 
        success: false, 
        message: errMsg, 
        errors: err.response?.data?.errors || [] 
      };
    } finally {
      setActionLoading(false);
    }
  };

  // Self Soft-Delete Account Action
  const deleteAccount = async () => {
    try {
      setActionLoading(true);
      const res = await authApi.deleteAccountApi();
      if (res.success) {
        setUser(null);
        setIsAuthenticated(false);
        showToast('Your account has been deactivated successfully', 'success');
        return { success: true };
      }
      return { success: false, message: res.message || 'Account deactivation failed' };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Account deactivation failed';
      showToast(errMsg, 'error');
      return { success: false, message: errMsg };
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        actionLoading,
        authError,
        toasts,
        showToast,
        register,
        login,
        logout,
        getMe,
        updateProfile,
        changePassword,
        deleteAccount,
      }}
    >
      {children}
      {/* Toast Notification Container with Accessibility live announcements */}
      <div className="toast-container" aria-live="polite" aria-relevant="all">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast--${toast.type}`}>
            <i 
              className={toast.type === 'success' ? 'ri-checkbox-circle-line' : 'ri-error-warning-line'} 
              aria-hidden="true"
            />
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </AuthContext.Provider>
  );
};
