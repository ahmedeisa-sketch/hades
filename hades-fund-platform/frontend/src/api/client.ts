import axios, { AxiosError } from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000',
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('hades_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function clearSession() {
  localStorage.removeItem('hades_access_token');
  localStorage.removeItem('hades_refresh_token');
  localStorage.removeItem('hades_user');
}

// Queues requests that arrive while a token refresh is already in flight so
// we don't fire multiple parallel /auth/refresh calls for one expired token.
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const userId = JSON.parse(localStorage.getItem('hades_user') ?? 'null')?.id;
  const refreshToken = localStorage.getItem('hades_refresh_token');
  if (!userId || !refreshToken) {
    throw new Error('No refresh token available');
  }

  // Bare axios call (not apiClient) — avoids recursing back through this
  // same response interceptor if the refresh call itself gets a 401.
  const { data } = await axios.post(
    `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'}/auth/refresh`,
    { userId, refreshToken },
  );
  localStorage.setItem('hades_access_token', data.accessToken);
  return data.accessToken;
}

/**
 * Previously ANY 401 (including a failed login attempt) wiped the session
 * and force-navigated to /login, which meant:
 *   1. A user typing the wrong password got yanked into a page reload
 *      instead of seeing "Incorrect email or password."
 *   2. A normal 15-minute access-token expiry logged the user out
 *      immediately instead of using the refresh token that already exists
 *      for exactly this purpose.
 * Now: on 401 from an authenticated request, try one silent refresh and
 * replay the original request. Only clear the session and redirect if the
 * refresh itself fails (or there's nothing to refresh) — and never for the
 * /auth/login or /auth/refresh calls themselves.
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (typeof error.config & { _retried?: boolean }) | undefined;
    const url = originalRequest?.url ?? '';
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/refresh');

    if (error.response?.status !== 401 || isAuthEndpoint || !originalRequest || originalRequest._retried) {
      return Promise.reject(error);
    }

    originalRequest._retried = true;

    try {
      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
      const newAccessToken = await refreshPromise;

      originalRequest.headers = originalRequest.headers ?? {};
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return apiClient.request(originalRequest);
    } catch {
      clearSession();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  },
);
