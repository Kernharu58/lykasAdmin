import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://lykasserver.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Centralizes what used to be scattered `localStorage.setItem('adminToken', ...)`
// calls across AuthContext.tsx — the backend now issues a short-lived access
// token (~20 min) alongside a separate refresh token (§11.6.2), so every
// place that stores one now needs to store both.
export const storeAuthTokens = (token: string, refreshToken?: string) => {
  localStorage.setItem('adminToken', token);
  if (refreshToken) localStorage.setItem('adminRefreshToken', refreshToken);
};

export const clearAuthTokens = () => {
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminRefreshToken');
};

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// De-dupes concurrent refresh attempts the same way the mobile app's
// interceptor does — if several requests are in flight when the access
// token expires, they should all wait on one shared refresh call rather
// than each independently trying (and racing) to rotate the same refresh
// token.
let refreshPromise: Promise<string | null> | null = null;

const performRefresh = async (): Promise<string | null> => {
  const storedRefreshToken = localStorage.getItem('adminRefreshToken');
  if (!storedRefreshToken) return null;

  try {
    const res = await axios.post(`${API_URL}/auth/refresh`, { refreshToken: storedRefreshToken });
    storeAuthTokens(res.data.token, res.data.refreshToken);
    return res.data.token;
  } catch (err) {
    console.error('[API] Token refresh failed:', err);
    clearAuthTokens();
    return null;
  }
};

// Globally handle 401 Unauthorized responses
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const code = error.response?.data?.code;
    const originalRequest = error.config;

    // Routine case: access token expired mid-session. Refresh once and
    // silently retry — the calling page never sees a 401 for this.
    if (status === 401 && code === 'TOKEN_EXPIRED' && originalRequest && !originalRequest._retried) {
      originalRequest._retried = true;

      if (!refreshPromise) {
        refreshPromise = performRefresh().finally(() => { refreshPromise = null; });
      }
      const newAccessToken = await refreshPromise;

      if (newAccessToken) {
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      }
      // Refresh failed too — fall through to the same "log the user out"
      // path as any other unrecoverable 401.
    }

    if (status === 401) {
      window.dispatchEvent(new CustomEvent('admin:unauthorized'));
    }
    return Promise.reject(error);
  }
);

// Admin Password Reset - sends reset email to user
export const sendUserPasswordReset = async (userId: string) => {
  const response = await api.post(`/auth/admin/force-reset/${userId}`);
  return response.data;
};

export default api;
