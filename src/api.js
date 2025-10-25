// Central API configuration for both dev and prod
// Use Vite env when available; otherwise infer from window location.
export const API_BASE =
  import.meta?.env?.VITE_API_BASE ||
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:3000"
    : "https://savemyphonesite.onrender.com");

export const apiUrl = (path) => {
  if (!path.startsWith("/")) path = "/" + path;
  return `${API_BASE}${path}`;
};

export const apiFetch = (path, options) => fetch(apiUrl(path), options);
