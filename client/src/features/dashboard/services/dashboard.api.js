import axios from 'axios';
import { API_BASE_URL } from '../../../app/runtime.config.js';

const dashboardClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getDashboardConfigApi = async () => {
  const response = await dashboardClient.get('/api/dashboard/config');
  return response.data;
};
