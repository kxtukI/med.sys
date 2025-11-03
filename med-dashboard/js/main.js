/**
 * js/main.js
 * * Lógica principal das páginas do dashboard:
 * 1. Controle do menu (Sidebar)
 * 2. Controle de Modais (genérico)
 * 3. Botão de Logout
 * 4. Carregamento de dados (roteador por página)
 * 5. Paginação
 */

// -----------------------------------------------------------------------------
// ESTADO GLOBAL
// -----------------------------------------------------------------------------

const paginationState = {
    users: { currentPage: 1, totalPages: 1 },
    patients: { currentPage: 1, totalPages: 1 },
    medications: { currentPage: 1, totalPages: 1 },
    inventory: { currentPage: 1, totalPages: 1 },
    reservations: { currentPage: 1, totalPages: 1 },
    appointments: { currentPage: 1, totalPages: 1 },
};

const modalConfig = new Map([
    ['add-professional-btn', { id: 'professional-modal', title: 'Novo Profissional' }],
    ['add-patient-btn', { id: 'patient-modal', title: 'Novo Paciente' }],
    ['add-medication-btn', { id: 'medication-modal', title: 'Novo Medicamento' }],
    ['add-appointment-btn', { id: 'appointment-modal', title: 'Novo Agendamento' }],
]);

// -----------------------------------------------------------------------------
// INICIALIZAÇÃO (DOMContentLoaded)
// -----------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. Correção do Loop Infinito ---
    const pathname = globalThis.location.pathname;
    const isLoginPage = pathname.endsWith('index.html') || 
                        pathname.endsWith('/') ||
                        pathname.endsWith('/med-dashboard/');
    
    if (isLoginPage) {
        return; // Para a execução do script
    }

    // --- 2. Lógica do Botão de Logout ---
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            globalThis.auth.logout();
        });
    }

    // --- 3. Lógica da Sidebar Responsiva ---
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');

    if (menuToggle && sidebar && sidebarOverlay) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            sidebarOverlay.classList.toggle('open');
        });

        sidebarOverlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            sidebarOverlay.classList.remove('open');
        });
    }

    // --- 4. Lógica Genérica de Modais ---
    const openModalButtons = document.querySelectorAll(
        '#add-professional-btn, #add-patient-btn, #add-medication-btn, #add-appointment-btn'
    );
    const closeModalButtons = document.querySelectorAll(
        '#close-modal-btn, #cancel-modal-btn, #modal-overlay, #prof-close-modal-btn, #prof-cancel-modal-btn'
    );
    const modalOverlay = document.getElementById('modal-overlay');

    for (const button of openModalButtons) {
        button.addEventListener('click', () => {
            const config = modalConfig.get(button.id);
            if (!config) return;

            const modal = document.getElementById(config.id);
            if (modal && modalOverlay) {
                modal.classList.add('open', 'creating');
                modal.classList.remove('editing');
                modalOverlay.classList.add('open');
                
                modal.querySelector('.modal-header h3').textContent = config.title;
                
                const form = modal.querySelector('form');
                if (form) {
                    form.reset();
                    const hiddenId = form.querySelector('input[type="hidden"]');
                    if (hiddenId) hiddenId.value = ''; 
                    const errorMsg = form.querySelector('.error-message');
                    if (errorMsg) displayFormError(errorMsg, null);
                }

                if (config.id === 'appointment-modal') {
                    loadAppointmentModalSelects();
                }
            }
        });
    }

    for (const button of closeModalButtons) {
        button.addEventListener('click', () => {
            const modal = button.closest('.modal') || document.querySelector('.modal.open');
            if (modal && modalOverlay) {
                modal.classList.remove('open', 'editing', 'creating');
                modalOverlay.classList.remove('open');
            }
        });
    }


    // --- 5. Roteador de Página ---
    const pageTitle = document.title;
    const pageActions = {
        'Dashboard': [loadDashboardData],
        'Usuários': [loadUsersData, setupUserModalForm, setupProfessionalModalForm, () => setupPaginationListeners('users', loadUsersData)],
        'Pacientes': [loadPatientsData, setupPatientFilters, setupPatientModalForm, () => setupPaginationListeners('patients', loadPatientsData)],
        'Medicamentos': [loadMedicationsData, setupMedicationFilters, setupMedicationModalForm, () => setupPaginationListeners('medications', loadMedicationsData)],
        'Inventário': [loadInventoryData, setupInventoryFilters, () => setupPaginationListeners('inventory', loadInventoryData)],
        'Reservas': [loadReservationsData, setupReservationFilters, () => setupPaginationListeners('reservations', loadReservationsData)],
        'Agendamentos': [loadAppointmentsData, setupAppointmentFilters, setupAppointmentModalForm, () => setupPaginationListeners('appointments', loadAppointmentsData), initAppointmentModalListeners],
    };

    for (const key in pageActions) {
        // CORREÇÃO: [Bug do Roteador]
        // Mudado de .includes(key) para .startsWith(key)
        if (pageTitle.startsWith(key)) { 
            for (const action of pageActions[key]) {
                action();
            }
            break;
        }
    }
});


// -----------------------------------------------------------------------------
// FUNÇÕES DE PAGINAÇÃO
// -----------------------------------------------------------------------------

/**
 * Atualiza a UI dos controles de paginação (botões e texto)
 */
function renderPaginationControls(stateKey) {
    const state = paginationState[stateKey];
    if (!state) return;

    const pageInfo = document.getElementById('page-info');
    const prevButton = document.getElementById('prev-page');
    const nextButton = document.getElementById('next-page');

    if (!pageInfo || !prevButton || !nextButton) return;

    pageInfo.textContent = `Página ${state.currentPage} de ${state.totalPages}`;
    prevButton.disabled = state.currentPage <= 1;
    nextButton.disabled = state.currentPage >= state.totalPages;
}

/**
 * Adiciona os 'listeners' de clique para os botões de paginação
 */
function setupPaginationListeners(stateKey, loadFunction) {
    const prevButton = document.getElementById('prev-page');
    const nextButton = document.getElementById('next-page');
    if (!prevButton || !nextButton) return;

    prevButton.replaceWith(prevButton.cloneNode(true));
    nextButton.replaceWith(nextButton.cloneNode(true));

    document.getElementById('prev-page').addEventListener('click', () => {
        if (paginationState[stateKey].currentPage > 1) {
            paginationState[stateKey].currentPage--;
            loadFunction();
        }
    });

    document.getElementById('next-page').addEventListener('click', () => {
        if (paginationState[stateKey].currentPage < paginationState[stateKey].totalPages) {
            paginationState[stateKey].currentPage++;
            loadFunction();
        }
    });
}


// -----------------------------------------------------------------------------
// FUNÇÕES UTILITÁRIAS (Helpers)
// -----------------------------------------------------------------------------

/**
 * Exibe erros de formulário detalhados no elemento de erro
 */
function displayFormError(errorElement, error) {
    if (!errorElement) return;

    if (!error) {
        // Limpa o erro
        errorElement.innerHTML = '';
        errorElement.style.textAlign = 'center';
        return;
    }
    
    console.error('Erro ao salvar:', error);
    
    // Começa com a mensagem principal (ex: "Dados inválidos")
    let errorMessage = `Erro: ${error.message}`;
    
    // Se a API enviou um array de 'details'
    if (error.details && Array.isArray(error.details) && error.details.length > 0) {
        const detailsList = error.details.map(detail => `<li>${detail}</li>`).join('');
        errorMessage += `<ul style="margin-top: 10px;">${detailsList}</ul>`;
        
        errorElement.innerHTML = errorMessage;
        errorElement.style.textAlign = 'left'; 
    } else {
        errorElement.textContent = errorMessage;
        errorElement.style.textAlign = 'center';
    }
}

/**
 * Formata datas da API (ISO) para o formato pt-BR (ex: 30/10/2025 - 14:00)
 */
function formatApiDateTime(isoString) {
    if (!isoString) return 'N/A';
    try {
        const d = new Date(isoString);
        d.setMinutes(d.getMinutes() + d.getTimezoneOffset()); 
        const date = d.toLocaleDateString('pt-BR');
        const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        return `${date} - ${time}`;
    } catch (e) {
        console.error("Erro ao formatar data:", e);
        return 'Data inválida';
    }
}

/**
 * Converte uma string ISO (UTC) para o formato 'YYYY-MM-DDTHH:mm'
 */
function formatISOToDatetimeLocal(isoString) {
    if (!isoString) return '';
    try {
        const date = new Date(isoString);
        const timezoneOffset = date.getTimezoneOffset() * 60000;
        const localDate = new Date(date.getTime() - timezoneOffset);
        return localDate.toISOString().slice(0, 16);
    } catch (e) {
        console.error("Erro ao formatar data local:", e);
        return '';
    }
}

/**
 * Preenche um <select> com dados de um endpoint da API
 */
async function populateSelect(selectId, endpoint, valueField, textFieldParts) {
    const select = document.getElementById(selectId);
    if (!select) return;
    select.innerHTML = `<option value="">Carregando...</option>`;
    try {
        const data = await globalThis.api.get(endpoint);
        if (data?.data) {
            select.innerHTML = `<option value="">Selecione uma opção</option>`;
            for (const item of data.data) {
                let text = item;
                for (const part of textFieldParts) {
                    text = text?.[part];
                }
                
                const option = document.createElement('option');
                option.value = item[valueField];
                option.textContent = text || 'Nome Indisponível';
                select.appendChild(option);
            }
        }
    } catch (error) {
        console.error(`Erro ao carregar ${selectId}:`, error);
        select.innerHTML = `<option value="">Erro ao carregar</option>`;
    }
}

// -----------------------------------------------------------------------------
// MÓDULO: DASHBOARD (dashboard.html)
// -----------------------------------------------------------------------------

async function loadDashboardData() {
    console.log("Carregando dados do Dashboard...");
    const patientStat = document.getElementById('stat-total-pacientes');
    const appointmentStat = document.getElementById('stat-agendamentos-hoje');
    const reservationStat = document.getElementById('stat-reservas-pendentes');
    const medicationStat = document.getElementById('stat-medicamentos-baixos');

    try {
        const patientsData = await globalThis.api.get('/patients?limit=1');
        if (patientStat) patientStat.textContent = patientsData.total || '0';
    } catch (e) {
        console.error("Erro ao carregar stats (pacientes):", e);
        if (patientStat) patientStat.textContent = 'N/A';
    }
    
    if (appointmentStat) appointmentStat.textContent = '...';
    if (reservationStat) reservationStat.textContent = '...';
    if (medicationStat) medicationStat.textContent = '...';
}

// -----------------------------------------------------------------------------
// MÓDULO: USUÁRIOS (users.html)
// -----------------------------------------------------------------------------

async function loadUsersData() {
    const tableBody = document.getElementById('users-table-body');
    if (!tableBody) return;
    tableBody.innerHTML = '<tr><td colspan="4">Carregando...</td></tr>';

    try {
        const page = paginationState.users.currentPage;
        const data = await globalThis.api.get(`/users?page=${page}&limit=10`);
        const users = data.data; 

        paginationState.users.currentPage = data.page;
        paginationState.users.totalPages = data.pages;
        renderPaginationControls('users');

        if (!users || users.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4">Nenhum usuário encontrado.</td></tr>';
            return;
        }

        tableBody.innerHTML = '';
        for (const user of users) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${user.user_type}</td>
                <td class="actions">
                    <button class="btn-icon btn-edit" aria-label="Editar" data-user-id="${user.id}">✏️</button>
                    <button class="btn-icon btn-delete" aria-label="Deletar" data-user-id="${user.id}">🗑️</button>
                </td>
            `;
            tableBody.appendChild(row);
        }

        setupDeleteListeners('users-table-body', 'data-user-id', '/users/', loadUsersData);
        setupUserEditListeners('users-table-body', 'data-user-id', '/users/', 'user-modal');

    } catch (error) {
        console.error("Erro ao carregar usuários:", error);
        tableBody.innerHTML = '<tr><td colspan="4">Erro ao carregar dados.</td></tr>';
    }
}

/**
 * Configura o formulário do modal de Usuários (APENAS UPDATE)
 */
function setupUserModalForm() {
    const form = document.getElementById('user-form');
    if (!form) return;
    const errorElement = document.getElementById('user-form-error');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Salvando...';
        displayFormError(errorElement, null);

        const id = form.querySelector('#user-id').value;

        if (!id) {
            displayFormError(errorElement, new Error('ID do usuário não encontrado.'));
            submitButton.disabled = false;
            submitButton.textContent = 'Salvar Alterações';
            return;
        }

        try {
            const formData = new FormData(form);
            const data = {
                name: formData.get('name'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                active: formData.get('active') === 'on' 
            };

            await globalThis.api.put(`/users/${id}`, data); 

            alert('Usuário atualizado com sucesso!');
            document.getElementById('modal-overlay').click();
            loadUsersData(); 
            form.reset();
        } catch (error) {
            displayFormError(errorElement, error);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Salvar Alterações';
        }
    });
}

// -----------------------------------------------------------------------------
// MÓDULO: PACIENTES (patients.html)
// -----------------------------------------------------------------------------

async function loadPatientsData() {
    const tableBody = document.getElementById('patients-table-body');
    if (!tableBody) return;
    tableBody.innerHTML = '<tr><td colspan="5">Carregando...</td></tr>';
    
    const nameFilter = document.getElementById('filter-name')?.value || '';
    const cpfFilter = document.getElementById('filter-cpf')?.value || '';
    const page = paginationState.patients.currentPage;

    const params = new URLSearchParams({ page: page, limit: '10' });
    if (nameFilter) params.append('name', nameFilter);
    if (cpfFilter) params.append('cpf', cpfFilter);

    try {
        const data = await globalThis.api.get(`/patients?${params.toString()}`);
        const patients = data.data;

        paginationState.patients.currentPage = data.page;
        paginationState.patients.totalPages = data.pages;
        renderPaginationControls('patients');

        if (!patients || patients.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5">Nenhum paciente encontrado.</td></tr>';
            return;
        }

        tableBody.innerHTML = '';
        for (const patient of patients) {
            const row = document.createElement('tr');
            const nome = patient.users?.name || 'N/A';
            const cpf = patient.cpf || 'N/A';
            const birthDate = patient.birth_date || 'N/A';
            const telefone = patient.users?.email || '---';

            row.innerHTML = `
                <td>${nome}</td>
                <td>${cpf}</td>
                <td>${telefone}</td>
                <td>${birthDate}</td>
                <td class="actions">
                    <button class="btn-icon btn-edit" aria-label="Editar" data-patient-id="${patient.patient_id}">✏️</button>
                    <button class="btn-icon btn-delete" aria-label="Deletar" data-patient-id="${patient.patient_id}">🗑️</button>
                </td>
            `;
            tableBody.appendChild(row);
        }

        setupDeleteListeners('patients-table-body', 'data-patient-id', '/patients/', loadPatientsData);
        setupPatientEditListeners('patients-table-body', 'data-patient-id', '/patients/', 'patient-modal');

    } catch (error) {
        console.error("Erro ao carregar pacientes:", error);
        tableBody.innerHTML = '<tr><td colspan="5">Erro ao carregar dados.</td></tr>';
    }
}

/**
 * Adiciona 'escutadores' aos botões de filtro da página de pacientes
 */
function setupPatientFilters() {
    const filterButton = document.getElementById('filter-btn');
    
    if (filterButton) {
        filterButton.addEventListener('click', () => {
            paginationState.patients.currentPage = 1; 
            loadPatientsData();
        });
    }
}

/**
 * Configura o formulário do modal de Pacientes (CRIAR ou ATUALIZAR)
 */
function setupPatientModalForm() {
    const form = document.getElementById('patient-form');
    if (!form) return;
    const errorElement = document.getElementById('patient-form-error');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Salvando...';
        displayFormError(errorElement, null);
        
        const id = form.querySelector('#patient-id').value;
        const formData = new FormData(form);
        const isEditing = !!id;
        
        const endpoint = isEditing ? `/patients/${id}` : '/patients';
        const method = isEditing ? 'put' : 'post';
        
        let data = {};

        if (isEditing) {
            data = {
                name: formData.get('name'),
                email: formData.get('email'), 
                phone: formData.get('phone'),
                address: formData.get('address'),
                city: formData.get('city'),
                state: formData.get('state'),
                zip_code: formData.get('zip_code')
            };
        } else {
            data = {
                name: formData.get('name'),
                cpf: formData.get('cpf'),
                sus_number: formData.get('sus_number'),
                birth_date: formData.get('birth_date'),
                phone: formData.get('phone'),
                password: formData.get('password'),
                address: formData.get('address'),
                city: formData.get('city'),
                state: formData.get('state'),
                zip_code: formData.get('zip_code'),
                email: formData.get('email') 
            };
        }

        try {
            await globalThis.api[method](endpoint, data);

            alert(`Paciente ${isEditing ? 'atualizado' : 'criado'} com sucesso!`);
            document.getElementById('modal-overlay').click();
            loadPatientsData(); 
            form.reset();
        } catch (error) {
            displayFormError(errorElement, error);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Salvar';
        }
    });
}

// -----------------------------------------------------------------------------
// MÓDULO: MEDICAMENTOS (medications.html)
// -----------------------------------------------------------------------------

async function loadMedicationsData() {
    const tableBody = document.getElementById('medications-table-body');
    if (!tableBody) return;
    tableBody.innerHTML = '<tr><td colspan="4">Carregando...</td></tr>';
    
    const nameFilter = document.getElementById('filter-name')?.value || '';
    const categoryFilter = document.getElementById('filter-category')?.value || '';
    const page = paginationState.medications.currentPage;

    const params = new URLSearchParams({ page: page, limit: '10' });
    if (nameFilter) params.append('name', nameFilter);
    if (categoryFilter) params.append('category', categoryFilter);

    try {
        const data = await globalThis.api.get(`/medications?${params.toString()}`);
        const medications = data.data;

        paginationState.medications.currentPage = data.page;
        paginationState.medications.totalPages = data.pages;
        renderPaginationControls('medications');

        if (!medications || medications.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4">Nenhum medicamento encontrado.</td></tr>';
            return;
        }

        tableBody.innerHTML = '';
        for (const med of medications) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${med.name}</td>
                <td>${med.manufacturer || 'N/A'}</td>
                <td>${med.category || 'N/A'}</td>
                <td class="actions">
                    <button class="btn-icon btn-edit" aria-label="Editar" data-med-id="${med.id}">✏️</button>
                    <button class="btn-icon btn-delete" aria-label="Deletar" data-med-id="${med.id}">🗑️</button>
                </td>
            `;
            tableBody.appendChild(row);
        }

        setupDeleteListeners('medications-table-body', 'data-med-id', '/medications/', loadMedicationsData);
        setupMedicationEditListeners('medications-table-body', 'data-med-id', '/medications/', 'medication-modal');

    } catch (error) {
        console.error("Erro ao carregar medicamentos:", error);
        tableBody.innerHTML = '<tr><td colspan="4">Erro ao carregar dados.</td></tr>';
    }
}

/**
 * Adiciona 'escutadores' aos botões de filtro da página de medicamentos
 */
function setupMedicationFilters() {
    const filterButton = document.getElementById('filter-btn');
    
    if (filterButton) {
        filterButton.addEventListener('click', () => {
            paginationState.medications.currentPage = 1;
            loadMedicationsData();
        });
    }
}

/**
 * Configura o formulário do modal de Medicamentos (CRIAR ou ATUALIZAR)
 */
function setupMedicationModalForm() {
    const form = document.getElementById('medication-form');
    if (!form) return;
    const errorElement = document.getElementById('medication-form-error');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Salvando...';
        displayFormError(errorElement, null);
        
        const id = form.querySelector('#medication-id').value;
        const formData = new FormData(form);
        const isEditing = !!id;

        const endpoint = isEditing ? `/medications/${id}` : '/medications';
        const method = isEditing ? 'put' : 'post';

        if (isEditing) {
            const photoInput = form.querySelector('#medication-photo');
            if (!photoInput.files || photoInput.files.length === 0) {
                formData.delete('photo');
            }
        }

        try {
            await globalThis.api[method](endpoint, formData);

            alert(`Medicamento ${isEditing ? 'atualizado' : 'criado'} com sucesso!`);
            document.getElementById('modal-overlay').click();
            loadMedicationsData();
            form.reset();
        } catch (error) {
            displayFormError(errorElement, error);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Salvar';
        }
    });
}

// -----------------------------------------------------------------------------
// MÓDULO: INVENTÁRIO (inventory.html)
// -----------------------------------------------------------------------------

async function loadInventoryData() {
    const tableBody = document.getElementById('inventory-table-body');
    if (!tableBody) return;
    tableBody.innerHTML = '<tr><td colspan="4">Carregando...</td></tr>';

    const unitId = document.getElementById('filter-unit')?.value || '';
    const page = paginationState.inventory.currentPage;

    const params = new URLSearchParams({ page: page, limit: '20' });
    if (unitId) params.append('health_unit_id', unitId);
    
    try {
        const data = await globalThis.api.get(`/medication_inventory?${params.toString()}`);
        const inventoryItems = data.data;

        paginationState.inventory.currentPage = data.page;
        paginationState.inventory.totalPages = data.pages;
        renderPaginationControls('inventory');

        if (!inventoryItems || inventoryItems.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4">Nenhum item encontrado no inventário.</td></tr>';
            return;
        }

        tableBody.innerHTML = '';
        for (const item of inventoryItems) {
            const row = document.createElement('tr');
            const qty = item.available_quantity;
            
            let statusBadge = '';
            if (qty > 10) {
                statusBadge = '<span class="status-badge status-ok">Em estoque</span>';
                row.className = 'stock-ok';
            } else if (qty > 0) {
                statusBadge = '<span class="status-badge status-low">Estoque Baixo</span>';
                row.className = 'low-stock';
            } else {
                statusBadge = '<span class="status-badge status-canceled">Sem estoque</span>';
                row.className = 'low-stock';
            }

            row.innerHTML = `
                <td>${item.medication?.name || 'N/A'}</td>
                <td>${item.healthUnit?.name || 'N/A'}</td>
                <td class="stock-qty">${qty}</td>
                <td>${statusBadge}</td>
            `;
            tableBody.appendChild(row);
        }
    } catch (error) {
        console.error("Erro ao carregar inventário:", error);
        tableBody.innerHTML = '<tr><td colspan="4">Erro ao carregar dados.</td></tr>';
    }
}

/**
 * Carrega os filtros (Unidades) e configura os 'listeners'
 */
async function setupInventoryFilters() {
    const unitSelect = document.getElementById('filter-unit');
    const filterButton = document.getElementById('filter-btn');

    if (!unitSelect || !filterButton) return;

    try {
        const data = await globalThis.api.get('/health_units?limit=100');
        if (data.data) {
            for (const unit of data.data) {
                const option = document.createElement('option');
                option.value = unit.id;
                option.textContent = unit.name;
                unitSelect.appendChild(option);
            }
        }
    } catch (error) {
        console.error("Erro ao carregar unidades de saúde:", error);
    }
    
    filterButton.addEventListener('click', () => {
        paginationState.inventory.currentPage = 1;
        loadInventoryData();
    });
}

// -----------------------------------------------------------------------------
// MÓDULO: RESERVAS (reservations.html)
// -----------------------------------------------------------------------------

async function loadReservationsData() {
    const tableBody = document.getElementById('reservations-table-body');
    if (!tableBody) return;
    tableBody.innerHTML = '<tr><td colspan="5">Carregando...</td></tr>';
    
    const status = document.getElementById('filter-status')?.value || '';
    const fromDate = document.getElementById('filter-date-from')?.value || '';
    const toDate = document.getElementById('filter-date-to')?.value || '';
    const page = paginationState.reservations.currentPage;

    const params = new URLSearchParams({ page: page, limit: '10' });
    if (status) params.append('status', status);
    if (fromDate) params.append('from', fromDate);
    if (toDate) params.append('to', toDate);

    try {
        const data = await globalThis.api.get(`/medication_reservations?${params.toString()}`);
        const reservations = data.data;
        
        paginationState.reservations.currentPage = data.page;
        paginationState.reservations.totalPages = data.pages;
        renderPaginationControls('reservations');

        if (!reservations || reservations.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5">Nenhuma reserva encontrada.</td></tr>';
            return;
        }

        tableBody.innerHTML = '';
        for (const res of reservations) {
            const row = document.createElement('tr');
            const pickupDate = formatApiDateTime(res.scheduled_pickup_at);
            const status = res.status || 'unknown';
            const statusText = status.charAt(0).toUpperCase() + status.slice(1);
            const statusBadge = `<span class="status-badge status-${status}">${statusText}</span>`;
            
            let actionButtons = '';
            if (status === 'reserved') {
                actionButtons = `
                    <button class="btn btn-secondary btn-sm btn-update-status" data-id="${res.id}" data-new-status="ready">Mudar p/ Pronto</button>
                    <button class="btn-icon btn-delete btn-cancel-reservation" aria-label="Cancelar" data-id="${res.id}">❌</button>
                `;
            } else if (status === 'ready') {
                 actionButtons = `<button class="btn btn-secondary btn-sm btn-update-status" data-id="${res.id}" data-new-status="picked_up">Mudar p/ Retirado</button>`;
            }

            row.innerHTML = `
                <td>${res.patient?.users?.name || 'N/A'}</td>
                <td>${res.medication?.name || 'N/A'}</td>
                <td>${pickupDate}</td>
                <td>${statusBadge}</td>
                <td class="actions">${actionButtons}</td>
            `;
            tableBody.appendChild(row);
        }
        
        setupReservationActionButtons();
    } catch (error) {
        console.error("Erro ao carregar reservas:", error);
        tableBody.innerHTML = '<tr><td colspan="5">Erro ao carregar dados.</td></tr>';
    }
}

/**
 * Adiciona 'escutadores' aos botões de filtro da página de reservas
 */
function setupReservationFilters() {
    const filterButton = document.getElementById('filter-btn');
    
    if (filterButton) {
        filterButton.addEventListener('click', () => {
            paginationState.reservations.currentPage = 1;
            loadReservationsData();
        });
    }
}

/**
 * Adiciona 'escutadores' aos botões de Ação (Mudar Status, Cancelar)
 */
function setupReservationActionButtons() {
    
    for (const button of document.querySelectorAll('.btn-update-status')) {
        const newButton = button.cloneNode(true); 
        button.parentNode.replaceChild(newButton, button);
        
        newButton.addEventListener('click', async (e) => {
            const id = e.target.dataset.id;
            const newStatus = e.target.dataset.newStatus;
            if (!confirm(`Deseja alterar o status desta reserva para "${newStatus}"?`)) return;

            try {
                await globalThis.api.put(`/medication_reservations/${id}`, { status: newStatus });
                alert('Status atualizado com sucesso!');
                loadReservationsData();
            } catch (error) {
                console.error('Erro ao atualizar status:', error);
                alert(`Erro: ${error.message}`);
            }
        });
    }

    for (const button of document.querySelectorAll('.btn-cancel-reservation')) {
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);

        newButton.addEventListener('click', async (e) => {
            const id = e.currentTarget.dataset.id;
            if (!confirm(`Tem certeza que deseja CANCELAR esta reserva?`)) return;

            try {
                await globalThis.api.delete(`/medication_reservations/${id}`);
                alert('Reserva cancelada com sucesso!');
                loadReservationsData();
            } catch (error) {
                console.error('Erro ao cancelar reserva:', error);
                alert(`Erro: ${error.message}`);
            }
        });
    }
}

// -----------------------------------------------------------------------------
// MÓDULO: AGENDAMENTOS (appointments.html)
// -----------------------------------------------------------------------------

async function loadAppointmentsData() {
    const tableBody = document.getElementById('appointments-table-body');
    if (!tableBody) return;
    tableBody.innerHTML = '<tr><td colspan="5">Carregando...</td></tr>';
    
    const status = document.getElementById('filter-status')?.value || '';
    const date = document.getElementById('filter-date')?.value || '';
    const page = paginationState.appointments.currentPage;

    const params = new URLSearchParams({ page: page, limit: '10' });
    if (status) params.append('status', status);
    if (date) params.append('date_time', date);

    try {
        const data = await globalThis.api.get(`/appointments?${params.toString()}`);
        const appointments = data.data;

        const pagination = data.pagination;
        if (pagination) {
            paginationState.appointments.currentPage = pagination.page;
            paginationState.appointments.totalPages = pagination.pages;
        } else {
            paginationState.appointments.currentPage = 1;
            paginationState.appointments.totalPages = 1;
        }
        renderPaginationControls('appointments');

        if (!appointments || appointments.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5">Nenhum agendamento encontrado.</td></tr>';
            return;
        }

        tableBody.innerHTML = '';
        for (const app of appointments) {
            const row = document.createElement('tr');
            const status = app.status || 'unknown';
            const statusText = status.charAt(0).toUpperCase() + status.slice(1);
            const statusBadge = `<span class="status-badge status-${status}">${statusText}</span>`;

            row.innerHTML = `
                <td>${app.patient?.users?.name || 'N/A'}</td>
                <td>${app.professional?.user?.name || 'N/A'}</td>
                <td>${formatApiDateTime(app.date_time)}</td>
                <td>${statusBadge}</td>
                <td class="actions">
                    <button class="btn-icon btn-edit" aria-label="Editar" data-id="${app.id}">✏️</button>
                    <button class="btn-icon btn-delete" aria-label="Cancelar" data-id="${app.id}">🗑️</button>
                </td>
            `;
            tableBody.appendChild(row);
        }
        
        setupAppointmentActionButtons();

    } catch (error) {
        console.error("Erro ao carregar agendamentos:", error);
        tableBody.innerHTML = '<tr><td colspan="5">Erro ao carregar dados.</td></tr>';
    }
}

/**
 * Adiciona 'escutadores' aos botões de filtro da página de agendamentos
 */
function setupAppointmentFilters() {
    const filterButton = document.getElementById('filter-btn');
    
    if (filterButton) {
        filterButton.addEventListener('click', () => {
            paginationState.appointments.currentPage = 1;
            loadAppointmentsData();
        });
    }
}

/**
 * Carrega os selects do modal de Agendamento (Pacientes, Profissionais, Unidades)
 */
async function loadAppointmentModalSelects() {
    await Promise.all([
        populateSelect('appointment-patient', '/patients?limit=200', 'patient_id', ['users', 'name']),
        populateSelect('appointment-professional', '/professionals?limit=100', 'professional_id', ['user', 'name']),
        populateSelect('appointment-unit', '/health_units?limit=100', 'id', ['name'])
    ]);
}

/**
 * Configura o formulário do modal de Agendamentos (CRIAR ou ATUALIZAR)
 */
function setupAppointmentModalForm() {
    const form = document.getElementById('appointment-form');
    if (!form) return;
    const errorElement = document.getElementById('appointment-form-error');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Salvando...';
        displayFormError(errorElement, null);
        
        const id = form.querySelector('#appointment-id').value;
        const formData = new FormData(form);
        const localDate = formData.get('date_time');
        
        let isoDate = '';
        if (localDate) {
            isoDate = new Date(localDate).toISOString();
        }
        
        const isEditing = !!id;
        const endpoint = isEditing ? `/appointments/${id}` : '/appointments';
        const method = isEditing ? 'put' : 'post';
        
        let data = {};

        if (isEditing) {
            data = {
                date_time: isoDate,
                status: formData.get('status')
            };
        } else {
            data = {
                patient_id: Number.parseInt(formData.get('patient_id'), 10),
                professional_id: Number.parseInt(formData.get('professional_id'), 10),
                health_unit_id: Number.parseInt(formData.get('health_unit_id'), 10),
                specialty: formData.get('specialty'),
                date_time: isoDate,
                status: formData.get('status')
            };
        }

        try {
            await globalThis.api[method](endpoint, data);

            alert(`Agendamento ${isEditing ? 'atualizado' : 'criado'} com sucesso!`);
            document.getElementById('modal-overlay').click();
            loadAppointmentsData(); 
            form.reset();
        } catch (error) {
            displayFormError(errorElement, error);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Salvar';
        }
    });
}

/**
 * Adiciona 'escutadores' aos botões de Ação (Editar, Cancelar)
 */
function setupAppointmentActionButtons() {
    for (const button of document.querySelectorAll('#appointments-table-body .btn-delete')) {
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);

        newButton.addEventListener('click', async (e) => {
            const id = e.currentTarget.dataset.id;
            if (!confirm(`Tem certeza que deseja CANCELAR este agendamento?`)) return;

            try {
                await globalThis.api.delete(`/appointments/${id}`); 
                alert('Agendamento cancelado com sucesso!');
                loadAppointmentsData();
            } catch (error) {
                console.error('Erro ao cancelar agendamento:', error);
                alert(`Erro: ${error.message}`);
            }
        });
    }
    setupAppointmentEditListeners('#appointments-table-body', 'data-id', '/appointments/', 'appointment-modal');
}

// -----------------------------------------------------------------------------
// MÓDULO: PROFISSIONAIS (do users.html)
// -----------------------------------------------------------------------------

function setupProfessionalModalForm() {
    const form = document.getElementById('professional-form');
    if (!form) return;
    const errorElement = document.getElementById('professional-form-error');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Salvando...';
        displayFormError(errorElement, null);

        try {
            const formData = new FormData(form);
            await globalThis.api.post('/professionals', formData); 

            alert('Profissional criado com sucesso!');
            document.getElementById('modal-overlay').click();
            loadUsersData(); 
            form.reset();
        } catch (error) {
            displayFormError(errorElement, error);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Criar Profissional';
        }
    });
}


// -----------------------------------------------------------------------------
// FUNÇÕES DE AÇÃO REUTILIZÁVEIS (Editar/Deletar)
// -----------------------------------------------------------------------------

/**
 * Função reutilizável para configurar botões de 'deletar'
 */
function setupDeleteListeners(tableBodyId, dataAttribute, endpointPrefix, reloadFunction) {
    const tableBody = document.getElementById(tableBodyId);
    if (!tableBody) return;
    
    const datasetKey = dataAttribute.substring(5).replace(/-(\w)/g, (match, p1) => p1.toUpperCase()); 

    for (const button of tableBody.querySelectorAll(`.btn-delete[${dataAttribute}]`)) {
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        newButton.addEventListener('click', async (e) => {
            const id = e.currentTarget.dataset[datasetKey];
            
            if (!confirm(`Tem certeza que deseja deletar este item? Esta ação não pode ser desfeita.`)) {
                return;
            }

            try {
                await globalThis.api.delete(`${endpointPrefix}${id}`);
                alert('Item deletado com sucesso!');
                reloadFunction();
            } catch (error) {
                console.error('Erro ao deletar item:', error);
                alert(`Erro: ${error.message}`);
            }
        });
    }
}

/**
 * Função reutilizável para configurar botões de 'editar' (GENÉRICA)
 */
async function setupEditListeners(tableBodyId, dataAttribute, endpointPrefix, modalId, populateFormCallback) {
    const tableBody = document.getElementById(tableBodyId);
    if (!tableBody) return;
    
    const datasetKey = dataAttribute.substring(5).replace(/-(\w)/g, (match, p1) => p1.toUpperCase());

    for (const button of tableBody.querySelectorAll(`.btn-edit[${dataAttribute}]`)) {
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);

        newButton.addEventListener('click', async (e) => {
            const id = e.currentTarget.dataset[datasetKey];
            const modal = document.getElementById(modalId);
            const modalOverlay = document.getElementById('modal-overlay');
            if (!modal || !modalOverlay) return;

            const form = modal.querySelector('form');
            form.reset();
            const errorElement = form.querySelector('.error-message');
            displayFormError(errorElement, null); // Limpa
            
            modal.classList.add('open', 'editing');
            modal.classList.remove('creating');
            modalOverlay.classList.add('open');
            
            try {
                if (errorElement) errorElement.textContent = 'Carregando dados...';
                const data = await globalThis.api.get(`${endpointPrefix}${id}`);
                if (errorElement) errorElement.textContent = '';
                
                populateFormCallback(modal, data);

            } catch (error) {
                console.error('Erro ao buscar dados para edição:', error);
                if (errorElement) displayFormError(errorElement, new Error('Erro ao carregar dados.'));
            }
        });
    }
}

/**
 * Callback para preencher o modal de EDIÇÃO DE USUÁRIO
 */
function setupUserEditListeners(tableBodyId, dataAttribute, endpointPrefix, modalId) {
    setupEditListeners(tableBodyId, dataAttribute, endpointPrefix, modalId, (modal, data) => {
        const user = data.user; 
        modal.querySelector('.modal-header h3').textContent = 'Editar Usuário';
        modal.querySelector('#user-id').value = user.id;
        modal.querySelector('#user-name').value = user.name;
        modal.querySelector('#user-email').value = user.email;
        modal.querySelector('#user-phone').value = user.phone || '';
        modal.querySelector('#user-active').checked = user.active;
    });
}

/**
 * Callback para preencher o modal de EDIÇÃO DE PACIENTE
 */
function setupPatientEditListeners(tableBodyId, dataAttribute, endpointPrefix, modalId) {
    setupEditListeners(tableBodyId, dataAttribute, endpointPrefix, modalId, (modal, data) => {
        const patient = data.patient; 
        
        modal.querySelector('.modal-header h3').textContent = 'Editar Paciente';
        modal.querySelector('#patient-id').value = patient.id; 
        
        modal.querySelector('#patient-name').value = patient.users.name;
        modal.querySelector('#patient-email').value = patient.users.email || '';
        modal.querySelector('#patient-phone').value = patient.users.phone || '';
    });
}

/**
 * Callback para preencher o modal de EDIÇÃO DE MEDICAMENTO
 */
function setupMedicationEditListeners(tableBodyId, dataAttribute, endpointPrefix, modalId) {
    setupEditListeners(tableBodyId, dataAttribute, endpointPrefix, modalId, (modal, data) => {
        const med = data.medication;
        
        modal.querySelector('.modal-header h3').textContent = 'Editar Medicamento';
        modal.querySelector('#medication-id').value = med.id;
        modal.querySelector('#medication-name').value = med.name || '';
        modal.querySelector('#medication-active-ingredient').value = med.active_ingredient || '';
        modal.querySelector('#medication-category').value = med.category || '';
        modal.querySelector('#medication-manufacturer').value = med.manufacturer || '';
        modal.querySelector('#medication-dosage').value = med.dosage || '';
        modal.querySelector('#medication-description').value = med.description || '';
        modal.querySelector('#medication-contraindications').value = med.contraindications || '';
        
        const photoLabel = modal.querySelector('label[for="medication-photo"]');
        if (med.photo_url) {
            photoLabel.textContent = 'Foto (Deixe em branco para manter a atual)';
        } else {
            photoLabel.textContent = 'Foto';
        }
    });
}

/**
 * Callback para preencher o modal de EDIÇÃO DE AGENDAMENTO
 */
function setupAppointmentEditListeners(tableBodyId, dataAttribute, endpointPrefix, modalId) {
    setupEditListeners(tableBodyId, dataAttribute, endpointPrefix, modalId, async (modal, data) => {
        const app = data.appointment;
        
        modal.querySelector('.modal-header h3').textContent = 'Editar Agendamento';
        modal.querySelector('#appointment-id').value = app.id;
        
        // Desabilita campos
        modal.querySelector('#appointment-patient').disabled = true;
        modal.querySelector('#appointment-professional').disabled = true;
        modal.querySelector('#appointment-unit').disabled = true;
        modal.querySelector('#appointment-specialty').disabled = true;

        await loadAppointmentModalSelects(); 
        
        // Seta os valores
        modal.querySelector('#appointment-patient').value = app.patient_id;
        modal.querySelector('#appointment-professional').value = app.professional_id;
        modal.querySelector('#appointment-unit').value = app.health_unit_id;
        modal.querySelector('#appointment-specialty').value = app.specialty || '';

        // Seta os campos editáveis
        modal.querySelector('#appointment-datetime').value = formatISOToDatetimeLocal(app.date_time);
        modal.querySelector('#appointment-status').value = app.status;
    });
}

/**
 * Adiciona listener para re-habilitar campos do modal de agendamento ao fechar
 */
function initAppointmentModalListeners() {
    const modal = document.getElementById('appointment-modal');
    if (modal) {
        modal.addEventListener('transitionend', (e) => {
            if (!e.target.classList.contains('open')) {
                const form = e.target.querySelector('form');
                if (form) {
                    form.querySelector('#appointment-patient').disabled = false;
                    form.querySelector('#appointment-professional').disabled = false;
                    form.querySelector('#appointment-unit').disabled = false;
                    form.querySelector('#appointment-specialty').disabled = false;
                }
            }
        });
    }
}