// ─────────────────────────────────────────────────
// api.js — Fetch wrapper for all backend API calls
// Automatically attaches JWT from localStorage
// ─────────────────────────────────────────────────

async function apiFetch(endpoint, options = {}) {
    const token = localStorage.getItem('sakyan_token');
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
    };

    try {
        const res = await fetch(`${CONFIG.API_BASE}${endpoint}`, {
            ...options,
            headers
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || data.error || 'Request failed');
        }

        return data;
    } catch (err) {
        console.error(`API Error [${endpoint}]:`, err.message);
        throw err;
    }
}

// Shorthand helpers
const api = {
    get:    (url)         => apiFetch(url),
    post:   (url, body)   => apiFetch(url, { method: 'POST', body: JSON.stringify(body) }),
    put:    (url, body)   => apiFetch(url, { method: 'PUT', body: JSON.stringify(body) }),
    patch:  (url, body)   => apiFetch(url, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (url)         => apiFetch(url, { method: 'DELETE' }),
};
