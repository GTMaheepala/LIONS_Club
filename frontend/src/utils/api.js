/**
 * CRA injects env at build time. No trailing slash.
 * In development, if unset, defaults to backend on localhost:5000 so `.env.local` is optional.
 */
export function getApiBase() {
  const raw = process.env.REACT_APP_API_URL;
  if (raw && String(raw).trim() !== "") {
    return String(raw).replace(/\/+$/, "");
  }
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:5000";
  }
  return "";
}

export function getStoredToken() {
  try {
    return localStorage.getItem("lcms_token") || "";
  } catch {
    return "";
  }
}

export function setStoredToken(token) {
  try {
    if (token) localStorage.setItem("lcms_token", token);
    else localStorage.removeItem("lcms_token");
  } catch {
    /* ignore */
  }
}

/**
 * @param {string} path - e.g. "/api/auth/login"
 * @param {{ method?: string, body?: object, token?: string }} opts
 */
export async function apiJson(path, opts = {}) {
  const base = getApiBase();
  if (!base) {
    throw new Error(
      "Set REACT_APP_API_URL before building or hosting (production). Example: https://your-api.onrender.com"
    );
  }
  const { method = "GET", body, token } = opts;
  /** @type {Record<string,string>} */
  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const auth = token ?? getStoredToken();
  if (auth) headers.Authorization = `Bearer ${auth}`;

  const res = await fetch(`${base}${path}`, {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {};
  }

  if (!res.ok) {
    const msg = data.message || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}
