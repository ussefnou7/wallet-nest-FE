import axios from "axios";
import { mapApiError } from "@/lib/errors";

const BASE_URL = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:7000";

const backendOrigin = BASE_URL.replace(/\/$/, "");

// In dev/preview, same-origin requests go through Vite's proxy (see vite.config.ts) to avoid CORS.
const API_BASE_URL = import.meta.env.DEV
  ? "/api/v1"
  : `${backendOrigin}/api/v1`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

function redirectToLogin() {
  if (window.location.pathname === "/login") return;
  window.history.replaceState(null, "", "/login");
  window.dispatchEvent(new PopStateEvent("popstate"));
}

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
    const appError = mapApiError(error);
    const status = appError.status;
    const code = appError.code;
    const reqUrl = String(error.config?.url ?? "");
    const isAuthAttempt =
      reqUrl.includes("/auth/login") || reqUrl.includes("/auth/register");

    if (import.meta.env.DEV) {
      console.error("[api:error]", {
        code: appError.code,
        status: appError.status,
        message: appError.message,
        traceId: appError.traceId,
      });
    }

    if ((status === 401 || code === "UNAUTHORIZED") && !isAuthAttempt) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      redirectToLogin();
    }
    return Promise.reject(appError);
  }
);

export default api;
