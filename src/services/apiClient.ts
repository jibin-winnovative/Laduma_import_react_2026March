import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiError } from '../types/api';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://importmanagement20260130094631.azurewebsites.net';

console.log('🌐 API Client Configuration:');
console.log('   API Base URL:', BASE_URL);
console.log('   Current Origin:', window.location.origin);
console.log('   Current Hostname:', window.location.hostname);
console.log('   Full URL:', window.location.href);
console.log('📋 Add this origin to your .NET API CORS settings:', window.location.origin);

const TOKEN_STORAGE_KEY = 'app_access_token';
const REFRESH_TOKEN_STORAGE_KEY = 'app_refresh_token';

let accessToken: string | null = localStorage.getItem(TOKEN_STORAGE_KEY);
let refreshToken: string | null = localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
let tokenRefreshTimer: NodeJS.Timeout | null = null;

let onSessionExpiredCallback: (() => void) | null = null;

export const setSessionExpiredCallback = (callback: () => void) => {
  onSessionExpiredCallback = callback;
};

const decodeJWT = (token: string): { exp?: number } => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return {};
  }
};

const scheduleTokenRefresh = () => {
  if (tokenRefreshTimer) {
    clearTimeout(tokenRefreshTimer);
  }

  if (!accessToken) {
    return;
  }

  const decoded = decodeJWT(accessToken);
  if (!decoded.exp) {
    return;
  }

  const expiryTime = decoded.exp * 1000;
  const currentTime = Date.now();
  const timeUntilExpiry = expiryTime - currentTime;
  const refreshTime = timeUntilExpiry - 60000;

  if (refreshTime > 0) {
    console.log(`🔄 Token refresh scheduled in ${Math.round(refreshTime / 1000)}s`);
    tokenRefreshTimer = setTimeout(() => {
      refreshTokenProactively();
    }, refreshTime);
  } else {
    console.log('⚠️ Token expired or about to expire, refreshing now');
    refreshTokenProactively();
  }
};

const refreshTokenProactively = async () => {
  if (!refreshToken) {
    return;
  }

  try {
    console.log('🔄 Proactively refreshing token...');
    const response = await axios.post(`${BASE_URL}/api/Auth/refresh-token`, {
      refreshToken,
    });

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;
    setTokens(newAccessToken, newRefreshToken);
    console.log('✅ Token refreshed successfully');
  } catch (error) {
    console.error('❌ Failed to refresh token proactively:', error);
    handleSessionExpired();
  }
};

const handleSessionExpired = () => {
  clearTokens();
  if (onSessionExpiredCallback) {
    onSessionExpiredCallback();
  }
  const currentPath = window.location.pathname;
  if (currentPath !== '/login') {
    window.location.href = '/login?sessionExpired=true';
  }
};

if (accessToken) {
  scheduleTokenRefresh();
}

export const setTokens = (access: string, refresh: string) => {
  accessToken = access;
  refreshToken = refresh;
  localStorage.setItem(TOKEN_STORAGE_KEY, access);
  localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refresh);
  scheduleTokenRefresh();
};

export const getAccessToken = () => accessToken;
export const getRefreshToken = () => refreshToken;

export const clearTokens = () => {
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  if (tokenRefreshTimer) {
    clearTimeout(tokenRefreshTimer);
    tokenRefreshTimer = null;
  }
};

const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
  withCredentials: false,
  timeout: 30000,
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401) {
      console.log('⚠️ Received 401 Unauthorized response');

      // Check if this is a login request (no refresh token available yet)
      const isLoginRequest = originalRequest.url?.includes('/api/Auth/login');

      if (!refreshToken || isLoginRequest) {
        if (!isLoginRequest) {
          console.log('❌ No refresh token available, redirecting to login');
          handleSessionExpired();
        }

        // For login errors, return the proper error message from the API
        const apiError: ApiError = {
          message: error.response?.data?.message || error.message || 'An error occurred',
          statusCode: error.response?.status || 500,
          errors: error.response?.data?.errors,
        };

        return Promise.reject(apiError);
      }

      if (originalRequest._retry) {
        console.log('❌ Retry already attempted, redirecting to login');
        handleSessionExpired();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        console.log('⏳ Token refresh in progress, queuing request');
        return new Promise((resolve) => {
          subscribeTokenRefresh((token: string) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            resolve(apiClient(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        console.log('🔄 Attempting to refresh token...');
        const response = await axios.post(`${BASE_URL}/api/Auth/refresh-token`, {
          refreshToken,
        });

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;
        setTokens(newAccessToken, newRefreshToken);
        isRefreshing = false;
        onTokenRefreshed(newAccessToken);

        console.log('✅ Token refreshed, retrying original request');
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);
        isRefreshing = false;
        handleSessionExpired();
        return Promise.reject(refreshError);
      }
    }

    const apiError: ApiError = {
      message: error.response?.data?.message || error.message || 'An error occurred',
      statusCode: error.response?.status || 500,
      errors: error.response?.data?.errors,
    };

    return Promise.reject(apiError);
  }
);

export const api = {
  get: <T>(url: string, config = {}) =>
    apiClient.get<T>(url, config).then((res) => res.data),

  post: <T>(url: string, data?: unknown, config = {}) =>
    apiClient.post<T>(url, data, config).then((res) => res.data),

  put: <T>(url: string, data?: unknown, config = {}) =>
    apiClient.put<T>(url, data, config).then((res) => res.data),

  patch: <T>(url: string, data?: unknown, config = {}) =>
    apiClient.patch<T>(url, data, config).then((res) => res.data),

  delete: <T>(url: string, config = {}) =>
    apiClient.delete<T>(url, config).then((res) => res.data),
};

export default apiClient;
