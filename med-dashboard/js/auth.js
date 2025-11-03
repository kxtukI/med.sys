/**
 * js/auth.js
 * Responsável pelo fluxo de autenticação:
 * 1. Lógica do formulário de login.
 * 2. Salvar e remover o token.
 * 3. Proteger páginas (redirecionar se não estiver logado).
 */

// -----------------------------------------------------------------------------
// OBJETO DE AUTENTICAÇÃO GLOBAL
// -----------------------------------------------------------------------------

globalThis.auth = {
    /**
     * Salva o token no localStorage e redireciona para o dashboard.
     */
    saveTokenAndRedirect: (token) => {
        localStorage.setItem('authToken', token);
        globalThis.location.href = 'dashboard.html';
    },

    /**
     * Desconecta o usuário, chamando a API de logout e limpando localmente.
     */
    logout: async (callApi = true) => {
        if (callApi) {
            try {
                await globalThis.api.post('/logout', {});
            } catch (error) {
                console.warn('Falha ao deslogar na API, limpando localmente.', error);
            }
        }
        localStorage.removeItem('authToken');
        globalThis.location.href = 'index.html';
    },

    /**
     * Verifica se o usuário está autenticado em CADA carregamento de página.
     * Redireciona para o login se não houver token (em páginas protegidas).
     * Redireciona para o dashboard se houver token (na página de login).
     */
    checkAuth: () => {
        const token = localStorage.getItem('authToken');
        const pathname = globalThis.location.pathname;
        const isLoginPage = pathname.endsWith('index.html') || 
                            pathname.endsWith('/') ||
                            pathname.endsWith('/med-dashboard/'); // Garante que a raiz do projeto funcione

        if (isLoginPage && token) {
            // Logado e na página de login? Vai para o dashboard.
            globalThis.location.href = 'dashboard.html';
        } else if (!isLoginPage && !token) {
            // Não logado e fora da página de login? Vai para o login.
            globalThis.location.href = 'index.html';
        }
    }
};

// -----------------------------------------------------------------------------
// INICIALIZAÇÃO (DOMContentLoaded)
// -----------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    
    // Executa a verificação de autenticação em todas as páginas
    globalThis.auth.checkAuth();

    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');

    // Adiciona o listener apenas se o formulário de login existir na página atual
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 

            const email = e.target.email.value;
            const password = e.target.password.value;
            const submitButton = loginForm.querySelector('button[type="submit"]');

            if (loginError) loginError.textContent = '';
            submitButton.disabled = true;
            submitButton.textContent = 'Entrando...';

            try {
                const data = await globalThis.api.post('/sessions', { email, password });

                if (data.token) {
                    globalThis.auth.saveTokenAndRedirect(data.token);
                } else {
                    throw new Error('Token não recebido da API.');
                }

            } catch (error) {
                if (loginError) loginError.textContent = 'Email ou senha inválidos.';
                console.error('Erro no login:', error);
                submitButton.disabled = false;
                submitButton.textContent = 'Entrar';
            }
        });
    }
});