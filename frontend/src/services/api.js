import axios from 'axios';

// Resolve Production or Development API Base URL
// Priority: 1. VITE_API_URL env var, 2. Current browser hostname:8000/api, 3. localhost:8000/api
const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/+$/, '');
  }
  const host = typeof window !== 'undefined' && window.location.hostname ? window.location.hostname : '127.0.0.1';
  return `http://${host}:8000/api`;
};

export const API_BASE_URL = getApiBaseUrl();

// Resolve Production or Development WebSocket URL (auto-handles wss:// for https deployments)
export const getWebSocketUrl = (path = '/ws/telemetry') => {
  if (import.meta.env.VITE_WS_URL) {
    return `${import.meta.env.VITE_WS_URL.replace(/\/+$/, '')}${path}`;
  }

  // If VITE_API_URL is configured (e.g. https://api.render.com/api), derive WSS from that host
  if (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.startsWith('http')) {
    try {
      const parsed = new URL(import.meta.env.VITE_API_URL);
      const wsProtocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${wsProtocol}//${parsed.host}${path}`;
    } catch (e) {
      // Fallback
    }
  }

  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const protocol = isHttps ? 'wss:' : 'ws:';
  const host = typeof window !== 'undefined' && window.location.hostname ? window.location.hostname : '127.0.0.1';
  return `${protocol}//${host}:8000${path}`;
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});


// Interceptor to attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('manufacturing_token') || sessionStorage.getItem('manufacturing_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor to handle HTTP 401 Unauthorized / Token Expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('manufacturing_token');
      localStorage.removeItem('manufacturing_user');
      sessionStorage.removeItem('manufacturing_token');
      sessionStorage.removeItem('manufacturing_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
