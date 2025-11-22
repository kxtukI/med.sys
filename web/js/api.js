const BASE_URL = 'https://med-sys-3z00.onrender.com';

async function apiFetch(endpoint, options = {}) {
    const token = localStorage.getItem('authToken');

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        ...options,
        headers,
    };

    if (options.body instanceof FormData) {
        delete headers['Content-Type'];
    }

    try {
        const response = await fetch(BASE_URL + endpoint, config);

        if (response.status === 401) {
            const isLoginPage = window.location.pathname.endsWith('index.html') ||
                                window.location.pathname.endsWith('/');
            if (!isLoginPage) {
                if (globalThis.auth) globalThis.auth.logout(false);
                else {
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('userRole');
                    window.location.href = 'index.html';
                }
            }
            throw new Error('Sessão expirada. Faça login novamente.');
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({
                error: `Erro ${response.status}: ${response.statusText}`
            }));

            const message = errorData.error || errorData.message || 'Erro ao processar requisição';
            const apiError = new Error(message);

            apiError.details = errorData.details;

            throw apiError;
        }

        if (response.status === 204) return null;

        return await response.json();

    } catch (error) {
        if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
            throw new Error('Erro de conexão com o servidor. Verifique sua internet.');
        }
        throw error;
    }
}

globalThis.api = {
    get: (endpoint) => apiFetch(endpoint, { method: 'GET' }),
    post: (endpoint, data) => apiFetch(endpoint, {
        method: 'POST',
        body: data instanceof FormData ? data : JSON.stringify(data),
    }),
    put: (endpoint, data) => apiFetch(endpoint, {
        method: 'PUT',
        body: data instanceof FormData ? data : JSON.stringify(data),
    }),
    delete: (endpoint) => apiFetch(endpoint, { method: 'DELETE' }),
};
