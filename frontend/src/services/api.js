/**
 * WeatherSense — Axios API client for FastAPI backend.
 */
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Auth token injection ────────────────────────
export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
}

// ── Response interceptor ────────────────────────
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.detail ||
      error.message ||
      'Request failed';
    return Promise.reject(new Error(message));
  }
);

// ── Weather endpoints ───────────────────────────
export const weatherApi = {
  getCurrent: (lat, lon, city = '', state = '') =>
    api.get('/weather/current', { params: { lat, lon, city, state } }),

  getForecast: (lat, lon, city = '', days = 7) =>
    api.get('/weather/forecast', { params: { lat, lon, city, days } }),

  getHistorical: (lat, lon, city = '', startDate = '', endDate = '') =>
    api.get('/weather/historical', { params: { lat, lon, city, start_date: startDate, end_date: endDate } }),

  getCities: () =>
    api.get('/weather/cities'),

  getImdStatus: () =>
    api.get('/weather/imd/status'),

  getImdObservations: (state = null) =>
    api.get('/weather/imd/observations', { params: state ? { state } : {} }),

  getStates: () =>
    api.get('/weather/states'),
};

// ── Report endpoints (public) ───────────────────
export const reportsApi = {
  submit: (reportData) =>
    api.post('/reports/submit', reportData),

  uploadMedia: (reportId, file, onUploadProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/reports/${reportId}/media-upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onUploadProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onUploadProgress(percent);
        }
      },
    });
  },

  getUploadUrl: (reportId, filename, contentType) =>
    api.post('/reports/upload-url', { report_id: reportId, filename, content_type: contentType }),

  updateMedia: (reportId, mediaUrl, mediaType) =>
    api.patch(`/reports/${reportId}/media`, { media_url: mediaUrl, media_type: mediaType }),

  getPublic: (params = {}) =>
    api.get('/reports/public', { params }),

  getPublicStats: () =>
    api.get('/reports/stats').catch(() => null),
};



// ── Admin endpoints ─────────────────────────────
export const adminApi = {
  getReports: (params = {}) =>
    api.get('/admin/reports', { params }),

  getReport: (id) =>
    api.get(`/admin/reports/${id}`),

  updateReport: (id, updates) =>
    api.patch(`/admin/reports/${id}`, updates),

  verifyReport: (id) =>
    api.post(`/admin/reports/${id}/verify`),

  markSpam: (id) =>
    api.post(`/admin/reports/${id}/spam`),

  flagReport: (id) =>
    api.post(`/admin/reports/${id}/flag`),

  deleteReport: (id) =>
    api.delete(`/admin/reports/${id}`),

  getDashboardSummary: () =>
    api.get('/admin/dashboard/summary'),
};

// ── Analytics endpoints ─────────────────────────
export const analyticsApi = {
  getSummary: () =>
    api.get('/analytics/summary'),

  getReportsOverTime: (days = 7) =>
    api.get('/analytics/reports-over-time', { params: { days } }),

  getCityWeather: () =>
    api.get('/analytics/city-weather'),

  getTopLocations: (limit = 10) =>
    api.get('/analytics/top-locations', { params: { limit } }),

  getConfidenceDistribution: () =>
    api.get('/analytics/confidence-scores'),
};

// ── Social endpoints ────────────────────────────
export const socialApi = {
  getStatus: () =>
    api.get('/social/status'),

  ingest: () =>
    api.post('/social/ingest'),
};

// ── Health check ────────────────────────────────
export const getHealth = () =>
  axios.get(`${BASE_URL.replace('/api/v1', '')}/health`).then(r => r.data);

export default api;
