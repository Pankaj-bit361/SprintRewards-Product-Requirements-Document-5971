import axios from 'axios';

const baseURL = import.meta.env.PROD
  ? 'https://sprint-rewards-product-requirements.vercel.app/api'
  : 'http://localhost:8080/api';

const api = axios.create({
  baseURL: baseURL,
});

api.interceptors.request.use(
  (config) => {
    // Add authorization token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Endpoints that don't need communityId
    const excludedEndpoints = [
      '/auth/login',
      '/auth/register',
      '/auth/request-otp',
      '/auth/verify-otp',
      '/auth/me',
      '/communities'
    ];

    // Check if current endpoint should be excluded
    const shouldExclude = excludedEndpoints.some(endpoint =>
      config.url.includes(endpoint)
    );

    // Add communityId to requests that need it
    if (!shouldExclude) {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          const communityId = user.currentCommunityId;

          if (communityId) {
            // Add communityId to query params for GET requests
            if (config.method === 'get') {
              config.params = {
                ...config.params,
                communityId
              };
            }
            // Add communityId to request body for POST/PUT requests
            else if (config.method === 'post' || config.method === 'put') {
              // Only add if there's a body and it's not FormData
              if (config.data && !(config.data instanceof FormData)) {
                config.data = {
                  ...config.data,
                  communityId
                };
              }
            }
          }
        } catch (error) {
          console.error('Error parsing user data:', error);
        }
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;