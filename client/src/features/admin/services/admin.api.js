import axios from 'axios';
import { API_BASE_URL } from '../../../app/runtime.config.js';

// Central Axios client configured with withCredentials to support HTTP-Only cookies
const adminClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Admin Operations
export const listUsersApi = async (includeDeleted) => {
  const response = await adminClient.get('/api/auth/users', {
    params: { includeDeleted: !!includeDeleted },
  });
  return response.data;
};

export const updateUserRoleApi = async (userId, role) => {
  const response = await adminClient.patch(`/api/auth/users/${userId}/role`, { role });
  return response.data;
};

export const deleteUserApi = async (userId) => {
  const response = await adminClient.delete(`/api/auth/users/${userId}`);
  return response.data;
};
