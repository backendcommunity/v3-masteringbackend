import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api/v3",
  withCredentials: true,
});

let isRefreshing = false;
let isHandlingAuthFailure = false;
let failedQueue: Array<{
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(undefined);
  });
  failedQueue = [];
};

export const handleAuthFailure = async () => {
  // Guard: only one redirect allowed — prevent race from multiple concurrent failures
  if (isHandlingAuthFailure) return;
  if (typeof window === "undefined") return;
  if (window.location.pathname.includes("/auth/")) return;

  isHandlingAuthFailure = true;

  try {
    await api.post("/auth/logout");
  } catch {
    // ignore — clearing cookies server-side is best-effort
  }

  // Only remove MB-owned keys — localStorage.clear() would nuke third-party SDK data too
  const keysToRemove = Object.keys(localStorage).filter(
    (k) => k.startsWith("mb_") || k === "user"
  );
  keysToRemove.forEach((k) => localStorage.removeItem(k));

  // Reset flag after delay — guards against rare case where redirect is blocked
  // (page reload resets the module anyway, but this prevents silent failure in edge cases)
  setTimeout(() => { isHandlingAuthFailure = false; }, 5000);

  const { pathname, search } = window.location;
  const here = pathname + search;
  const redirect =
    here && here !== "/" ? `?redirect=${encodeURIComponent(here)}` : "";
  window.location.href = `/auth/login${redirect}`;
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const is401 = error?.response?.status === 401;
    const isRefreshEndpoint = originalRequest?.url?.includes("/auth/refresh");
    const isLoginEndpoint = originalRequest?.url?.includes("/auth/login");
    const isRegisterEndpoint = originalRequest?.url?.includes("/auth/register");
    const alreadyRetried = originalRequest?._retry;

    if (
      is401 &&
      !alreadyRetried &&
      !isRefreshEndpoint &&
      !isLoginEndpoint &&
      !isRegisterEndpoint
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { refreshSession } = await import("@/lib/auth-refresh");
        await refreshSession();
        processQueue(null);
        isRefreshing = false;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        isRefreshing = false;
        // Both access token and refresh token are expired — force relogin
        await handleAuthFailure();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export const socketAPI = axios.create({
  baseURL: process.env.NEXT_PUBLIC_WEBHOOK_URL || "http://localhost:8080",
});
