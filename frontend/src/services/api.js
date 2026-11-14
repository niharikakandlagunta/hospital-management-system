import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('medicare_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isAuthPath = window.location.pathname.includes('/login');
      if (!isAuthPath) {
        localStorage.removeItem('medicare_token');
        localStorage.removeItem('medicare_user');
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

export const getErrorMessage = (error) => {
  if (error.response && error.response.data) {
    const data = error.response.data;
    if (data.fieldErrors) {
      const fields = Object.entries(data.fieldErrors)
        .map(([field, msg]) => `${field}: ${msg}`)
        .join(', ');
      return fields;
    }
    if (data.message) {
      return data.message;
    }
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred. Please try again.';
};

export default api;
