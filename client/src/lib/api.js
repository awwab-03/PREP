import axios from "axios";

/**
 * Central axios instance. Base URL comes from VITE_API_URL in production
 * (the Render backend); in dev it's empty so Vite's proxy forwards /api.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "",
});

// Attach the JWT from localStorage to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("prepai_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401, clear the token so the app falls back to the login screen.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("prepai_token");
    }
    return Promise.reject(err);
  }
);

/** Pull a human-readable message out of an axios error. */
export function apiError(err) {
  return (
    err?.response?.data?.message ||
    err?.message ||
    "Something went wrong. Please try again."
  );
}

export default api;
