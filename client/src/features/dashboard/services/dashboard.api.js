import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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
