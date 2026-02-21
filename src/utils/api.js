import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 120000,
});

// Upload simple
export const uploadGPX = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/gpx/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

// Upload batch
export const uploadBatchGPX = async (files, onProgress) => {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  const response = await api.post('/gpx/upload-batch', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress) onProgress(Math.round((e.loaded * 100) / e.total));
    },
  });
  return response.data;
};

// Historique
export const getHistory = async (limit = 50) => {
  const response = await api.get(`/history/?limit=${limit}`);
  return response.data;
};

export const deleteEntry = async (id) => {
  const response = await api.delete(`/history/${id}`);
  return response.data;
};

// URLs exports individuels
export const getExportUrl = (id, format) => `${API_BASE}/api/gpx/export/${id}/${format}`;
export const getReportUrl = (id) => `${API_BASE}/api/gpx/report/${id}`;

// URLs exports fusionnés
export const getMergedExportUrl = (batchId, format) => `${API_BASE}/api/gpx/export-merged/${batchId}/${format}`;

// Export batch individuels (ZIP)
export const exportBatchIndividual = async (entryIds) => {
  const response = await api.post('/gpx/export-batch-individual', entryIds, { responseType: 'blob' });
  _downloadBlob(response.data, 'exports_individuels.zip');
};

// Rapport PDF batch
export const downloadBatchReport = async (entryIds) => {
  const response = await api.post('/gpx/report-batch', entryIds, { responseType: 'blob' });
  _downloadBlob(response.data, 'rapport_batch.pdf');
};

// Utilitaire téléchargement
function _downloadBlob(data, filename) {
  const url = window.URL.createObjectURL(new Blob([data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export default api;
