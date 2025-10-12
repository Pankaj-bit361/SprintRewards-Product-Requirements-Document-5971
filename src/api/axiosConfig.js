import axios from 'axios';

const baseURL = import.meta.env.PROD
  ? 'https://sprint-rewards-product-requirements.vercel.app/api'
  : '/api';

const api = axios.create({
  baseURL: baseURL,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;