// ==========================================
//           API FETCH WRAPPER
// ==========================================
// Unified fetch helper with JSON parsing, ok-check, and
// standardized error objects. Use across all frontends.

import "./toast.js";

function toError(message, status, data) {
  const err = new Error(message || "Request failed");
  err.status = status;
  err.data = data;
  return err;
}

export async function apiFetch(url, options = {}) {
  const defaultHeaders = { "Content-Type": "application/json" };
  const merged = {
    credentials: "same-origin",
    ...options,
    headers: { ...defaultHeaders, ...(options.headers || {}) }
  };

  let res;
  try {
    res = await fetch(url, merged);
  } catch (networkErr) {
    throw toError("Network error", 0, { cause: networkErr?.message });
  }

  let data = null;
  const text = await res.text();
  if (text) {
    try { data = JSON.parse(text); } catch (e) { data = text; }
  }

  if (!res.ok) {
    const message = data?.message || `Request failed (${res.status})`;
    throw toError(message, res.status, data);
  }

  return data;
}

export function withToast(promise, { successMessage, errorMessage } = {}) {
  return promise
    .then((data) => {
      if (successMessage) showToast(successMessage, "success");
      return data;
    })
    .catch((err) => {
      const msg = err?.message || errorMessage || "Something went wrong";
      showToast(msg, "error");
      throw err;
    });
}

export function renderEmptyState(container, message) {
  if (!container) return;
  container.innerHTML = `<tr><td colspan="12" class="py-8 text-center text-text-muted-light dark:text-text-muted-dark">${message}</td></tr>`;
}
