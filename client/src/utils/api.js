import authService from '../services/auth.service';

const fetchWithAuth = async (url, options = {}) => {
    const user = authService.getCurrentUser();
    const token = user?.token;

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, { ...options, headers });

    // Read the response body ONCE. Handle cases where the body might not be JSON.
    const data = await response.json().catch(() => {
        // If the server sends a non-JSON error (e.g., 500 HTML page),
        // we create a fallback error object.
        return { message: response.statusText };
    });

    // Check the 'ok' status AFTER reading the body.
    if (!response.ok) {
        throw new Error(data.message || 'An API error occurred.');
    }

    return data;
};

const api = {
    get: (url, options) => fetchWithAuth(url, { ...options, method: 'GET' }),
    post: (url, body, options) => fetchWithAuth(url, { ...options, method: 'POST', body: JSON.stringify(body) }),
    put: (url, body, options) => fetchWithAuth(url, { ...options, method: 'PUT', body: JSON.stringify(body) }),
    delete: (url, options) => fetchWithAuth(url, { ...options, method: 'DELETE' }),
};

export default api;