import { useState, useCallback } from 'react';
import * as crudApi from '../services/crud.api.js';

export function useEntityDefinition() {
  const [definitions, setDefinitions] = useState([]);
  const [currentDefinition, setCurrentDefinition] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDefinitions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await crudApi.getDefinitionsApi();
      if (res.success) {
        setDefinitions(res.data.entities || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch entity definitions');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDefinition = useCallback(async (slug) => {
    try {
      setLoading(true);
      setError(null);
      const res = await crudApi.getDefinitionApi(slug);
      if (res.success) {
        setCurrentDefinition(res.data.entity);
        return res.data.entity;
      }
      return null;
    } catch (err) {
      setError(err.response?.data?.message || `Failed to fetch definition for ${slug}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createDefinition = useCallback(async (data) => {
    try {
      setLoading(true);
      setError(null);
      const res = await crudApi.createDefinitionApi(data);
      if (res.success) {
        setDefinitions((prev) => [...prev, res.data.entity]);
        return { success: true, entity: res.data.entity };
      }
      return { success: false, message: res.message };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create entity definition';
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateDefinition = useCallback(async (slug, data) => {
    try {
      setLoading(true);
      setError(null);
      const res = await crudApi.updateDefinitionApi(slug, data);
      if (res.success) {
        setDefinitions((prev) =>
          prev.map((d) => (d.slug === slug ? res.data.entity : d))
        );
        if (currentDefinition?.slug === slug) {
          setCurrentDefinition(res.data.entity);
        }
        return { success: true, entity: res.data.entity };
      }
      return { success: false, message: res.message };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update entity definition';
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, [currentDefinition, setDefinitions]);

  const deleteDefinition = useCallback(async (slug) => {
    try {
      setLoading(true);
      setError(null);
      const res = await crudApi.deleteDefinitionApi(slug);
      if (res.success) {
        setDefinitions((prev) => prev.filter((d) => d.slug !== slug));
        if (currentDefinition?.slug === slug) {
          setCurrentDefinition(null);
        }
        return { success: true };
      }
      return { success: false, message: res.message };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete entity definition';
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, [currentDefinition, setDefinitions]);

  return {
    definitions,
    currentDefinition,
    loading,
    error,
    fetchDefinitions,
    fetchDefinition,
    createDefinition,
    updateDefinition,
    deleteDefinition,
  };
}
