import axios from 'axios';
import { API_BASE_URL } from '../../../app/runtime.config.js';

// Central Axios client configured with withCredentials to support HTTP-Only cookies
const authClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const loginApi = async (email, password) => {
  const response = await authClient.post('/api/auth/login', { email, password });
  return response.data;
};

export const registerApi = async (name, email, password) => {
  const response = await authClient.post('/api/auth/register', { name, email, password });
  return response.data;
};

export const logoutApi = async () => {
  const response = await authClient.post('/api/auth/logout');
  return response.data;
};

export const getMeApi = async () => {
  const response = await authClient.get('/api/auth/me');
  return response.data;
};

export const updateProfileApi = async (name, email) => {
  const response = await authClient.patch('/api/auth/profile', { name, email });
  return response.data;
};

export const changePasswordApi = async (currentPassword, newPassword) => {
  const response = await authClient.patch('/api/auth/change-password', { currentPassword, newPassword });
  return response.data;
};

export const deleteAccountApi = async () => {
  const response = await authClient.delete('/api/auth/account');
  return response.data;
};


