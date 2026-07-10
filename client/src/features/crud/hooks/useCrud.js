import { useState, useCallback } from 'react';
import * as crudApi from '../services/crud.api.js';

export function useCrud() {
  const [records, setRecords] = useState([]);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalRecords: 0,
    totalPages: 0,
  });

  const fetchRecords = useCallback(async (slug, params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const res = await crudApi.getRecordsApi(slug, params);
      if (res.success) {
        setRecords(res.data.records || []);
        setPagination(res.data.pagination || {
          page: 1,
          limit: 10,
          totalRecords: 0,
          totalPages: 0,
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || `Failed to fetch records for ${slug}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRecord = useCallback(async (slug, id) => {
    try {
      setLoading(true);
      setError(null);
      const res = await crudApi.getRecordApi(slug, id);
      if (res.success) {
        setCurrentRecord(res.data.record);
        return res.data.record;
      }
      return null;
    } catch (err) {
      setError(err.response?.data?.message || `Failed to fetch record ${id}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createRecord = useCallback(async (slug, data) => {
    try {
      setActionLoading(true);
      setError(null);
      const res = await crudApi.createRecordApi(slug, data);
      if (res.success) {
        setRecords((prev) => [res.data.record, ...prev]);
        return { success: true, record: res.data.record };
      }
      return { success: false, message: res.message };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create record';
      const errors = err.response?.data?.errors || [];
      return { success: false, message: msg, errors };
    } finally {
      setActionLoading(false);
    }
  }, []);

  const updateRecord = useCallback(async (slug, id, data) => {
    try {
      setActionLoading(true);
      setError(null);
      const res = await crudApi.updateRecordApi(slug, id, data);
      if (res.success) {
        setRecords((prev) =>
          prev.map((r) => (r.id === id ? res.data.record : r))
        );
        if (currentRecord?.id === id) {
          setCurrentRecord(res.data.record);
        }
        return { success: true, record: res.data.record };
      }
      return { success: false, message: res.message };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update record';
      const errors = err.response?.data?.errors || [];
      return { success: false, message: msg, errors };
    } finally {
      setActionLoading(false);
    }
  }, [currentRecord]);

  const deleteRecord = useCallback(async (slug, id) => {
    try {
      setActionLoading(true);
      setError(null);
      const res = await crudApi.deleteRecordApi(slug, id);
      if (res.success) {
        setRecords((prev) => prev.filter((r) => r.id !== id));
        if (currentRecord?.id === id) {
          setCurrentRecord(null);
        }
        return { success: true };
      }
      return { success: false, message: res.message };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete record';
      return { success: false, message: msg };
    } finally {
      setActionLoading(false);
    }
  }, [currentRecord]);

  return {
    records,
    currentRecord,
    loading,
    actionLoading,
    error,
    pagination,
    fetchRecords,
    fetchRecord,
    createRecord,
    updateRecord,
    deleteRecord,
  };
}
