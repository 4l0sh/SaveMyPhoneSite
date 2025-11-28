// Central API configuration for both dev and prod
// Prefer localhost when running on localhost, regardless of VITE_API_BASE, to simplify local testing
let RESOLVED_API_BASE = "";
if (typeof window !== "undefined") {
  const host = window.location.hostname;
  const isLocal =
    host === "localhost" || host === "127.0.0.1" || host === "::1";
  if (isLocal) {
    RESOLVED_API_BASE = "http://localhost:3000/api";
  } else {
    RESOLVED_API_BASE =
      (import.meta?.env && import.meta.env.VITE_API_BASE) ||
      `${window.location.origin}/api`;
  }
} else {
  RESOLVED_API_BASE = (import.meta?.env && import.meta.env.VITE_API_BASE) || "";
}

export const API_BASE = RESOLVED_API_BASE;

if (typeof window !== "undefined") {
  if (!window.__SMP_API_BASE_LOGGED) {
    console.log("[api] Using API_BASE:", API_BASE);
    window.__SMP_API_BASE_LOGGED = true;
  }
}

export const apiUrl = (path) => {
  if (!path.startsWith("/")) path = "/" + path;
  return `${API_BASE}${path}`;
};

export const apiFetch = (path, options) => fetch(apiUrl(path), options);

// Contact message helper
export async function postContactMessage(data) {
  const res = await apiFetch("/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.error || "Verzenden mislukt";
    throw new Error(msg);
  }
  return json;
}

// Small JSON helper with retries to handle cold starts (e.g., Render free tier)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function getJson(path, { retries = 3, retryDelay = 900 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await apiFetch(path, {
        headers: { Accept: "application/json" },
      });
      const ct = res.headers.get("content-type") || "";
      // If service is waking, some platforms return HTML interstitials; treat as retryable
      const isJson = ct.toLowerCase().includes("application/json");
      if (!res.ok || !isJson) {
        if (attempt < retries) {
          // Retry early if not last attempt
          await sleep(retryDelay);
          continue;
        }
        let errMsg = `HTTP ${res.status}`;
        // Provide better diagnostics when HTML is received (likely SPA index instead of API)
        const rawText = await res.text().catch(() => "");
        const looksHtml = /<!doctype html|<html/i.test(rawText);
        if (looksHtml && res.status === 200) {
          errMsg =
            "Ontvangen HTML in plaats van JSON (waarschijnlijk frontend index.html). Stel VITE_API_BASE goed in naar je backend API.";
        }
        // Attempt to parse JSON error if actually JSON but not ok
        if (isJson) {
          try {
            const body = JSON.parse(rawText);
            if (body?.error) errMsg = body.error;
          } catch {}
        }
        // Append small snippet for context (first 120 chars)
        const snippet = rawText.slice(0, 120).replace(/\s+/g, " ");
        throw new Error(`${errMsg}${snippet ? ` | Snippet: ${snippet}` : ""}`);
      }
      return await res.json();
    } catch (err) {
      lastErr = err;
      if (attempt < retries) {
        await sleep(retryDelay);
        continue;
      }
      throw err;
    }
  }
  throw lastErr || new Error("Request failed");
}

// Blog helpers
export const fetchBlogs = () => getJson("/blogs");
export const fetchBlog = (slug) => getJson(`/blogs/${slug}`);
export async function createBlog({ title, content, imageUrl }) {
  const token = localStorage.getItem("authToken");
  if (!token) throw new Error("Niet ingelogd");
  const res = await apiFetch("/admin/blogs", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    body: JSON.stringify({ title, content, imageUrl }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error || "Aanmaken mislukt");
  return json;
}

// Admin blog management helpers
export async function fetchAdminBlogs() {
  const token = localStorage.getItem("authToken");
  if (!token) throw new Error("Niet ingelogd");
  const res = await apiFetch("/admin/blogs", {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  const json = await res.json().catch(() => []);
  if (!res.ok) throw new Error(json?.error || "Laden mislukt");
  return json;
}

export async function updateBlog({ id, title, content, imageUrl }) {
  const token = localStorage.getItem("authToken");
  if (!token) throw new Error("Niet ingelogd");
  const res = await apiFetch(`/admin/blogs/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    body: JSON.stringify({ title, content, imageUrl }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error || "Updaten mislukt");
  return json.blog;
}

export async function deleteBlog(id) {
  const token = localStorage.getItem("authToken");
  if (!token) throw new Error("Niet ingelogd");
  const res = await apiFetch(`/admin/blogs/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error || "Verwijderen mislukt");
  return json;
}

// Phones for sale helpers
export const fetchPhones = () => getJson("/phones");
export async function addPhoneForSale(payload) {
  const token = localStorage.getItem("authToken");
  if (!token) throw new Error("Niet ingelogd");
  const res = await apiFetch("/admin/phones", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error || "Aanmaken mislukt");
  return json;
}
export const fetchAllPhonesAdmin = () => getJson("/phones?available=0");
export async function updatePhone(id, payload) {
  const token = localStorage.getItem("authToken");
  if (!token) throw new Error("Niet ingelogd");
  const res = await apiFetch(`/admin/phones/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error || "Updaten mislukt");
  return json;
}
export async function deletePhone(id) {
  const token = localStorage.getItem("authToken");
  if (!token) throw new Error("Niet ingelogd");
  const res = await apiFetch(`/admin/phones/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error || "Verwijderen mislukt");
  return json;
}
