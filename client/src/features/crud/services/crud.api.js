import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const crudClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Entity Definitions (Metadata)
export const getDefinitionsApi = async () => {
  const response = await crudClient.get('/api/crud/definitions');
  return response.data;
};

export const getDefinitionApi = async (slug) => {
  const response = await crudClient.get(`/api/crud/definitions/${slug}`);
  return response.data;
};

export const createDefinitionApi = async (data) => {
  const response = await crudClient.post('/api/crud/definitions', data);
  return response.data;
};

export const updateDefinitionApi = async (slug, data) => {
  const response = await crudClient.put(`/api/crud/definitions/${slug}`, data);
  return response.data;
};

export const deleteDefinitionApi = async (slug) => {
  const response = await crudClient.delete(`/api/crud/definitions/${slug}`);
  return response.data;
};

// Dynamic Table CRUD (Records)
export const getRecordsApi = async (slug, params = {}) => {
  const response = await crudClient.get(`/api/crud/${slug}`, { params });
  return response.data;
};

export const getRecordApi = async (slug, id) => {
  const response = await crudClient.get(`/api/crud/${slug}/${id}`);
  return response.data;
};

export const createRecordApi = async (slug, data) => {
  const response = await crudClient.post(`/api/crud/${slug}`, data);
  return response.data;
};

export const updateRecordApi = async (slug, id, data) => {
  const response = await crudClient.put(`/api/crud/${slug}/${id}`, data);
  return response.data;
};

export const deleteRecordApi = async (slug, id) => {
  const response = await crudClient.delete(`/api/crud/${slug}/${id}`);
  return response.data;
};
