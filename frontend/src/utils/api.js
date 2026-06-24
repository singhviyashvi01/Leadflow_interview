import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // For HttpOnly cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

const clearSessionAndRedirect = () => {
  localStorage.removeItem('leadflow_user');
  localStorage.removeItem('leadflow_session');
  localStorage.removeItem('role');
  localStorage.removeItem('name');
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
};

// Interceptor to handle token refresh on 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only attempt refresh if the user is supposed to be logged in
    const userLoggedIn = localStorage.getItem('leadflow_user');

    if (error.response?.status === 401 && userLoggedIn && !originalRequest._retry) {
      // If we are already on the refresh endpoint, prevent loop
      if (originalRequest.url?.includes('/api/token/refresh/')) {
        clearSessionAndRedirect();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Send a request to refresh endpoint. Credentials true is needed to transmit HttpOnly cookie.
        await axios.post(
          `${API_BASE_URL}/api/token/refresh/`,
          {},
          { withCredentials: true }
        );

        processQueue(null);
        isRefreshing = false;

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        isRefreshing = false;
        clearSessionAndRedirect();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
