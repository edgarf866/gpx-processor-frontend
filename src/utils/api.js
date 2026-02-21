import axios from 'axios';

// ============================================================
// BASE URL - s'adapte automatiquement selon l'environnement
// ============================================================
// En LOCAL (dev) : le proxy Vite redirige /api → localhost:8000
// En PRODUCTION (Railway) : on pointe vers l'URL du backend Railway
//
// Pour configurer, crée un fichier .env dans /frontend :
//   VITE_API_URL=https://ton-backend.up.railway.app
//
// Si pas de .env, ça utilise /api (mode dev avec proxy Vite)
// ============================================================
const API_BASE = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 120000,
});

// Upload un seul fichier GPX
export const uploadGPX = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/gpx/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

// Upload multiple fichiers GPX (batch)
export const uploadBatchGPX = async (files, onProgress) => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });

  const response = await api.post('/gpx/upload-batch', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (progressEvent) => {
      if (onProgress) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percent);
      }
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

// URLs d'export - doivent aussi utiliser la bonne base
export const getExportUrl = (id, format) => `${API_BASE}/api/gpx/export/${id}/${format}`;
export const getReportUrl = (id) => `${API_BASE}/api/gpx/report/${id}`;

// Export batch
export const exportBatch = async (entryIds) => {
  const response = await api.post('/gpx/export-batch', entryIds, {
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'batch_export.zip');
  document.body.appendChild(link);
  link.click();
  link.remove();
};

export default api;
