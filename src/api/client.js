/* ============================================
   API Client Configuration
   ============================================
   Toggle USE_MOCK to switch between mock data
   and real backend API calls.
   
   Backend developer: Set USE_MOCK = false and
   update BASE_URL to point to your API server.
   ============================================ */

import axios from 'axios';

/** Set to false when backend APIs are ready */
export const USE_MOCK = true;

/** Backend API base URL */
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach auth token when available
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle common error codes
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status } = error.response;
      if (status === 401) {
        // Handle unauthorized — redirect to login when auth is implemented
        console.warn('Unauthorized request — authentication required.');
      }
      if (status === 403) {
        console.warn('Forbidden — insufficient permissions.');
      }
    }
    return Promise.reject(error);
  }
);

export default client;
