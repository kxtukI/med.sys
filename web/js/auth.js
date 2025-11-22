const ALLOWED_ROLES = ['admin', 'doctor', 'medico', 'professional', 'super_admin'];

function parseJwtPayload(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c =>
            '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        ).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error("Erro no token:", e);
        return null;
    }
}

globalThis.auth = {
    logout: async (callApi = true) => {
        if (callApi) {
            try { await globalThis.api.post('/logout', {}); }
            catch (e) { console.warn('Erro logout API', e); }
        }
        localStorage.removeItem('authToken');
        localStorage.removeItem('userRole');
        globalThis.location.href = 'index.html';
    },

    checkAuth: () => {
        const token = localStorage.getItem('authToken');
        const role = localStorage.getItem('userRole');
        const pathname = globalThis.location.pathname;
        const isLoginPage = pathname.endsWith('index.html') || pathname.endsWith('/');

        if (!isLoginPage && (!token || !role)) {
            globalThis.location.href = 'index.html';
            return;
        }

        if (token && role) {
            const isAllowed = ALLOWED_ROLES.includes(role);

            if (isLoginPage) {
                if (isAllowed) globalThis.location.href = 'dashboard.html';
                else globalThis.auth.logout(false);
            } else {
                if (!isAllowed) {
                    alert('Acesso negado: Apenas Admins e Médicos.');
                    globalThis.auth.logout(false);
                }
            }
        }
    }
};

globalThis.auth.checkAuth();

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = loginForm.querySelector('button');

            if (loginError) loginError.textContent = '';
            btn.disabled = true;
            btn.textContent = 'Entrando...';

            try {
                const email = e.target.email.value;
                const password = e.target.password.value;

                const response = await globalThis.api.post('/sessions', { email, password });

                const token = response.token;

                let role = response.user?.user_type;

                if (!role && token) {
                    const payload = parseJwtPayload(token);
                    role = payload?.role || payload?.user_type;
                }

                console.log("Login Sucesso. Role detectada:", role);

                if (!token || !role) {
                    throw new Error('Dados de login incompletos.');
                }

                if (ALLOWED_ROLES.includes(role)) {
                    localStorage.setItem('authToken', token);
                    localStorage.setItem('userRole', role);
                    localStorage.setItem('userId', response.user?.id);
                    globalThis.location.href = 'dashboard.html';
                } else {
                    throw new Error(`Acesso restrito. Perfil '${role}' deve usar o App.`);
                }

            } catch (error) {
                console.error(error);
                localStorage.removeItem('authToken');
                if (loginError) loginError.textContent = error.message || 'Erro ao entrar';
                btn.disabled = false;
                btn.textContent = 'Entrar';
            }
        });
    }
});
