import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true, // send refresh cookie
});

// Inject access token from the in-memory store
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401, try refreshing the access token once, then retry the request — but ONLY
// when there is already a session (an access token in memory) whose token may have
// expired, and never for the refresh call itself. This prevents two bugs:
//   1. A wrong-password 401 from /auth/login being hijacked into a refresh attempt,
//      which made the login screen show the refresh error instead of "Invalid email…".
//   2. The page-load /auth/refresh probe (401 when logged out) triggering a second
//      /auth/refresh and a needless logout().
let refreshing = null;
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config || {};
    const url = original.url || '';
    const hasSession = !!useAuthStore.getState().accessToken;
    const isRefreshCall = url.includes('/auth/refresh');

    if (error.response?.status === 401 && !original._retry && hasSession && !isRefreshCall) {
      original._retry = true;
      try {
        refreshing =
          refreshing ||
          axios.post(
            `${import.meta.env.VITE_API_URL || '/api'}/auth/refresh`,
            {},
            { withCredentials: true }
          );
        const { data } = await refreshing;
        refreshing = null;
        useAuthStore.getState().setAccessToken(data.accessToken);
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch (e) {
        refreshing = null;
        useAuthStore.getState().logout();
        return Promise.reject(e);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
