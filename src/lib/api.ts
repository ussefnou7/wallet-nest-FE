import axios from "axios";

const backendOrigin = (
  import.meta.env.VITE_BACKEND_URL ?? "http://localhost:7000"
).replace(/\/$/, "");

// In dev/preview, same-origin requests go through Vite's proxy (see vite.config.ts) to avoid CORS.
const API_BASE_URL = import.meta.env.DEV
  ? "/api/v1"
  : `${backendOrigin}/api/v1`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status;
    const reqUrl = String(error.config?.url ?? "");
    const isAuthAttempt =
      reqUrl.includes("/auth/login") || reqUrl.includes("/auth/register");
    if (status === 401 && !isAuthAttempt) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
