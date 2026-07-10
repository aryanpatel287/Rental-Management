import { useState, useCallback } from 'react';
import { getDashboardConfigApi } from '../services/dashboard.api.js';

export function useDashboard() {
  const [layout, setLayout] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDashboardConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getDashboardConfigApi();
      if (res.success) {
        setLayout(res.data.layout || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard layout');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    layout,
    loading,
    error,
    fetchDashboardConfig,
  };
}
export default useDashboard;
