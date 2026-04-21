import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api/v3",
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (value: any) => void; reject: (reason?: any) => void }> = [];

const processQueue = (error: any) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(undefined);
  });
  failedQueue = [];
};

const handleAuthFailure = () => {
  if (typeof window !== "undefined" && !window.location.pathname.includes("/auth/")) {
    window.location.href = "/auth/login";
  }
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const is401 = error?.response?.status === 401;
    const isRefreshEndpoint = originalRequest?.url?.includes("/auth/refresh");
    const isLoginEndpoint = originalRequest?.url?.includes("/auth/login");
    const alreadyRetried = originalRequest?._retry;

    if (is401 && !alreadyRetried && !isRefreshEndpoint && !isLoginEndpoint) {
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
        await api.post("/auth/refresh");
        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        handleAuthFailure();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;

      }
    }

    return Promise.reject(error);
  }
);

export const socketAPI = axios.create({
  baseURL: process.env.NEXT_PUBLIC_WEBHOOK_URL || "http://localhost:8080",
});
