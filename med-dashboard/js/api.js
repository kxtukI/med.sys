/**
 * js/api.js
 * Responsável por todas as requisições HTTP para o backend.
 * Abstrai o 'fetch' e o tratamento de autenticação (JWT).
 */

// -----------------------------------------------------------------------------
// CONFIGURAÇÃO GLOBAL
// -----------------------------------------------------------------------------

const BASE_URL = 'https://med-sys-3z00.onrender.com';

/**
 * Função principal para requisições 'fetch'.
 * Lida com tokens, tipos de conteúdo e tratamento de erros.
 */
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

        if (!response.ok) {
            if (response.status === 401) {
                console.error('API Error: Não autorizado (401). Redirecionando para login.');
                if (globalThis.auth) {
                    globalThis.auth.logout(false);
                } else {
                    localStorage.removeItem('authToken');
                    globalThis.location.href = 'index.html';
                }
                throw new Error('Não autorizado');
            }
            
            const errorData = await response.json().catch(() => ({ 
                error: response.statusText, 
                details: [] 
            }));

            const apiError = new Error(errorData.error || 'Erro na requisição');
            
            apiError.details = errorData.details || [];
            apiError.status = response.status;
            
            throw apiError;
        }

        if (response.status === 204) {
            return null;
        }

        return response.json();

    } catch (error) {
        console.error('Fetch Error:', error);
        throw error; 
    }
}

// -----------------------------------------------------------------------------
// OBJETO API GLOBAL
// -----------------------------------------------------------------------------

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