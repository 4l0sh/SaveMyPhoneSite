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
          await sleep(retryDelay);
          continue;
        }
        // Try to parse error JSON if any; else throw generic
        let errMsg = `HTTP ${res.status}`;
        try {
          const body = isJson ? await res.json() : null;
          if (body?.error) errMsg = body.error;
        } catch {}
        throw new Error(errMsg);
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
