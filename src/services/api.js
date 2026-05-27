import axios from "axios";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "";

const PUBLIC_ENDPOINTS = [
  "/api/landing/",
  "/api/products/",
  "/api/categories/",
  "/products/",
  "/banners/",
];

const clearStoredAuth = () => {
  [localStorage, sessionStorage].forEach((storage) => {
    storage.removeItem("token");
    storage.removeItem("refresh_token");
    storage.removeItem("userType");
    storage.removeItem("user");
    storage.removeItem("auth");
  });
};

const decodeJwtPayload = (token) => {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
    return JSON.parse(window.atob(padded));
  } catch {
    return null;
  }
};

const isValidAccessToken = (token) => {
  const payload = decodeJwtPayload(token || "");
  if (!payload || payload.token_type !== "access") return false;
  if (payload.exp && payload.exp * 1000 <= Date.now()) return false;
  return true;
};

const getRequestPath = (url = "") => {
  try {
    return new URL(url, API_BASE_URL || window.location.origin).pathname;
  } catch {
    return url;
  }
};

const isPublicEndpoint = (url = "") => {
  const path = getRequestPath(url);
  return PUBLIC_ENDPOINTS.some((endpoint) => path === endpoint || path.startsWith(endpoint));
};

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  if (isPublicEndpoint(config.url)) {
    delete config.headers.Authorization;
    return config;
  }

  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");

  if (isValidAccessToken(token)) {
    config.headers.Authorization = `Bearer ${token}`;
  } else if (token) {
    clearStoredAuth();
    delete config.headers.Authorization;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const detail = error?.response?.data?.detail || "";
    const code = error?.response?.data?.code || "";
    if (error?.response?.status === 401 && (code === "token_not_valid" || String(detail).includes("token not valid"))) {
      clearStoredAuth();
    }
    return Promise.reject(error);
  }
);

export default api;
