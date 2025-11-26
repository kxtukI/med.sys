const paginationState = {
    users: { currentPage: 1, totalPages: 1 },
    patients: { currentPage: 1, totalPages: 1 },
    medications: { currentPage: 1, totalPages: 1 },
    inventory: { currentPage: 1, totalPages: 1 },
    reservations: { currentPage: 1, totalPages: 1 },
    appointments: { currentPage: 1, totalPages: 1 },
    schedules: { currentPage: 1, totalPages: 1 }
};

// Mapa de traduções para status
const statusTranslations = {
    // Agendamentos
    'scheduled': 'Agendado',
    'completed': 'Concluído',
    'canceled': 'Cancelado',
    // Reservas
    'reserved': 'Reservado',
    'ready': 'Pronto para Retirada',
    'picked_up': 'Retirado',
    'expired': 'Expirado'
};

function translateStatus(status) {
    return statusTranslations[status] || status;
}const modalConfig = new Map([
    ['add-professional-btn', { id: 'professional-modal', title: 'Novo Profissional' }],
    ['add-patient-btn', { id: 'patient-modal', title: 'Novo Paciente' }],
    ['add-medication-btn', { id: 'medication-modal', title: 'Novo Medicamento' }],
    ['add-appointment-btn', { id: 'appointment-modal', title: 'Novo Agendamento' }],
    ['add-schedule-btn', { id: 'schedule-modal', title: 'Novo Horário' }]
]);

function applyPermissions() {
    const role = localStorage.getItem('userRole');
    const isAdmin = role && (role.toLowerCase() === 'admin' || role.toLowerCase() === 'super_admin');

    const menuUsers = document.getElementById('menu-users');
    const btnAddProf = document.getElementById('add-professional-btn');
    const btnAddUser = document.getElementById('add-user-btn');
    const btnAddSchedule = document.getElementById('add-schedule-btn');

    if (isAdmin) {
        if (menuUsers) menuUsers.style.display = 'block';
        if (btnAddProf) btnAddProf.style.display = 'inline-block';
        if (btnAddUser) btnAddUser.style.display = 'inline-block';
        if (btnAddSchedule) btnAddSchedule.style.display = 'inline-block';

        setTimeout(() => {
            const deleteButtons = document.querySelectorAll('.btn-delete');
            deleteButtons.forEach(btn => btn.style.display = 'inline-block');
        }, 800);

    } else {

        if (menuUsers) menuUsers.style.display = 'none';
        if (btnAddProf) btnAddProf.style.display = 'none';
        if (btnAddUser) btnAddUser.style.display = 'none';
        if (btnAddSchedule) btnAddSchedule.style.display = 'none'; // Médico não cria horário

        setTimeout(() => {
            const deleteButtons = document.querySelectorAll('.btn-delete');
            deleteButtons.forEach(btn => btn.style.display = 'none');
        }, 800);
    }
}

document.addEventListener('DOMContentLoaded', () => {

    const pathname = globalThis.location.pathname;
    const isLoginPage = pathname.endsWith('index.html') ||
                        pathname.endsWith('/') ||
                        pathname.endsWith('/med-dashboard/');

    if (isLoginPage) return;

    applyPermissions();

    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            globalThis.auth.logout();
        });
    }

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

    const openModalButtons = document.querySelectorAll(
        '#add-professional-btn, #add-patient-btn, #add-medication-btn, #add-appointment-btn, #add-schedule-btn'
    );

    const closeModalButtons = document.querySelectorAll(
        '#close-modal-btn, #cancel-modal-btn, #modal-overlay, #prof-close-modal-btn, #prof-cancel-modal-btn, #close-schedule-btn, #cancel-schedule-btn, #close-inventory-modal-btn, #inventory-cancel-btn, .close-modal-btn, #cancel-record-btn'
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

                const header = modal.querySelector('.modal-header h3');
                if(header) header.textContent = config.title;

                const form = modal.querySelector('form');
                if (form) {
                    form.reset();
                    const hiddenId = form.querySelector('input[type="hidden"]');
                    if (hiddenId) hiddenId.value = '';
                    const errorMsg = form.querySelector('.error-message');
                    if (errorMsg) displayFormError(errorMsg, null);

                    if (config.id === 'patient-modal') {
                        modal.querySelectorAll('.field-for-create').forEach(el => el.style.display = 'block');
                        modal.querySelectorAll('.field-for-create input').forEach(input => input.setAttribute('required', 'true'));
                    }
                }

                if (config.id === 'appointment-modal') {
                    loadAppointmentModalSelects();
                }
                if (config.id === 'schedule-modal') {
                    loadScheduleModalSelects();
                }
            }
        });
    }

    for (const button of closeModalButtons) {
        button.addEventListener('click', () => {
            document.querySelectorAll('.modal.open').forEach(m => m.classList.remove('open', 'editing', 'creating'));
            if (modalOverlay) modalOverlay.classList.remove('open');
        });
    }

    const pageTitle = document.title;

    const pageActions = {
        'Dashboard': [loadDashboardData],
        'Usuários': [loadUsersData, setupUserModalForm, setupProfessionalModalForm, () => setupPaginationListeners('users', loadUsersData)],
        'Pacientes': [loadPatientsData, setupPatientFilters, setupPatientModalForm, () => setupPaginationListeners('patients', loadPatientsData)],
        'Medicamentos': [loadMedicationsData, setupMedicationFilters, setupMedicationModalForm, () => setupPaginationListeners('medications', loadMedicationsData)],
        'Inventário': [loadInventoryData, setupInventoryFilters, () => setupPaginationListeners('inventory', loadInventoryData)],
        'Reservas': [loadReservationsData, setupReservationFilters, () => setupPaginationListeners('reservations', loadReservationsData)],
        'Agendamentos': [loadAppointmentsData, setupAppointmentFilters, setupAppointmentModalForm, setupMedicalRecordModal, () => setupPaginationListeners('appointments', loadAppointmentsData), initAppointmentModalListeners],
        'Horários': [loadSchedulesData, setupScheduleForm]
    };

    for (const key in pageActions) {
        if (pageTitle.startsWith(key)) {
            for (const action of pageActions[key]) {
                try {
                    action();
                } catch(e) {
                    console.error(`Erro ao carregar módulo ${key}:`, e);
                }
            }
            setTimeout(applyPermissions, 1000);
            break;
        }
    }
});

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

function displayFormError(errorElement, error) {
    if (!errorElement) return;

    if (!error) {
        errorElement.innerHTML = '';
        errorElement.style.display = 'none';
        return;
    }

    console.error('Erro capturado no formulário:', error);

    let msg = "Erro desconhecido.";

    if (typeof error === 'string') {
        msg = error;
    } else if (error instanceof Error) {
        msg = error.message;
    } else if (typeof error === 'object') {
        msg = error.message || error.error || JSON.stringify(error);
    }

    if (msg === '[object Object]') {
        try { msg = JSON.stringify(error); } catch (e) {}
    }

    msg = msg.replace(/[{"}]/g, '').replace(/:/g, ': ').replace(/^Erro:\s*/i, '');

    let html = `<div style="background-color: #fee2e2; color: #991b1b; padding: 10px; border-radius: 6px; border: 1px solid #f87171; font-size: 0.9rem; text-align: left;">`;
    html += `<strong>⚠️ ${msg}</strong>`;

    if (error.details && Array.isArray(error.details)) {
        html += `<ul style="margin: 5px 0 0 20px; padding: 0;">`;
        error.details.forEach(d => html += `<li>${d}</li>`);
        html += `</ul>`;
    }
    html += `</div>`;

    errorElement.innerHTML = html;
    errorElement.style.display = 'block';
}

function formatApiDateTime(isoString) {
    if (!isoString) return 'N/A';
    try {
        // Verifica se já está no formato DD/MM/YYYY HH:MM
        const alreadyFormatted = isoString.match(/(\d{2})\/(\d{2})\/(\d{4})\s(\d{2}):(\d{2})/);
        if (alreadyFormatted) {
            const [, day, month, year, hours, minutes] = alreadyFormatted;
            return `${day}/${month}/${year} - ${hours}:${minutes}`;
        }
        
        // Parse para formato ISO: 2025-12-01T10:00:00
        const isoFormatted = isoString.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
        if (isoFormatted) {
            const [, year, month, day, hours, minutes] = isoFormatted;
            return `${day}/${month}/${year} - ${hours}:${minutes}`;
        }
        
        return 'Data inválida';
    } catch (e) { 
        console.error('Erro ao formatar data:', e);
        return 'Data inválida'; 
    }
}

function formatISOToDatetimeLocal(isoString) {
    if (!isoString) return '';
    try { return isoString.substring(0, 16); } catch (e) { return ''; }
}

async function populateSelect(selectId, endpoint, valueField, textFieldParts) {
    const select = document.getElementById(selectId);
    if (!select) return;
    select.innerHTML = `<option value="">Carregando...</option>`;
    try {
        const data = await globalThis.api.get(endpoint);
        const items = data.data || data;

        if (items) {
            select.innerHTML = `<option value="">Selecione uma opção</option>`;
            for (const item of items) {
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

async function loadDashboardData() {
    console.log("Carregando dados do Dashboard...");
    const patientStat = document.getElementById('stat-total-pacientes');
    const appointmentStat = document.getElementById('stat-agendamentos-hoje');
    const reservationStat = document.getElementById('stat-reservas-pendentes');
    const medicationStat = document.getElementById('stat-medicamentos-baixos');

    try {
        const patientsData = await globalThis.api.get('/patients?limit=1');
        if (patientStat) patientStat.textContent = patientsData.total || '0';
    } catch (e) { if (patientStat) patientStat.textContent = 'N/A'; }

    if (appointmentStat) appointmentStat.textContent = '-';
    if (reservationStat) reservationStat.textContent = '-';
    if (medicationStat) medicationStat.textContent = '-';
}

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
        applyPermissions();

    } catch (error) {
        console.error("Erro usuários:", error);
        tableBody.innerHTML = '<tr><td colspan="4">Acesso restrito ou erro de conexão.</td></tr>';
    }
}

function setupUserModalForm() {
    const form = document.getElementById('user-form');
    if (!form) return;
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    const errorElement = document.getElementById('user-form-error');

    newForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitButton = newForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Salvando...';
        displayFormError(errorElement, null);

        const id = newForm.querySelector('#user-id').value;

        try {
            const formData = new FormData(newForm);
            const data = {
                name: formData.get('name'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                active: formData.get('active') === 'on'
            };

            if (id) {
                 await globalThis.api.put(`/users/${id}`, data);
                 alert('Usuário atualizado com sucesso!');
                 document.getElementById('modal-overlay').click();
                 loadUsersData();
                 newForm.reset();
            }
        } catch (error) {
            displayFormError(errorElement, error);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Salvar Alterações';
        }
    });
}

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
        applyPermissions();

    } catch (error) {
        console.error("Erro ao carregar pacientes:", error);
        tableBody.innerHTML = '<tr><td colspan="5">Erro ao carregar dados.</td></tr>';
    }
}

function setupPatientFilters() {
    const filterButton = document.getElementById('filter-btn');
    if (filterButton) {
        filterButton.addEventListener('click', () => {
            paginationState.patients.currentPage = 1;
            loadPatientsData();
        });
    }
}

function setupPatientModalForm() {
    const form = document.getElementById('patient-form');
    if (!form) return;

    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    const errorElement = document.getElementById('patient-form-error');

    newForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitButton = newForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Salvando...';
        displayFormError(errorElement, null);

        const id = newForm.querySelector('#patient-id').value;
        const formData = new FormData(newForm);
        const isEditing = !!id;

        try {
            if (isEditing) {
                const data = {
                    name: formData.get('name'),
                    email: formData.get('email'),
                    phone: formData.get('phone'),
                    address: formData.get('address'),
                    city: formData.get('city'),
                    state: formData.get('state'),
                    zip_code: formData.get('zip_code')
                };
                await globalThis.api.put(`/patients/${id}`, data);
            } else {
                const data = Object.fromEntries(formData.entries());
                await globalThis.api.post('/patients', data);
            }

            alert(`Paciente ${isEditing ? 'atualizado' : 'criado'} com sucesso!`);
            document.getElementById('modal-overlay').click();
            loadPatientsData();
            newForm.reset();
        } catch (error) {
            displayFormError(errorElement, error);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Salvar';
        }
    });
}

async function loadMedicationsData() {
    const grid = document.getElementById('medications-grid');
    if (!grid) return;
    grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 2rem;">Carregando...</div>';

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
            grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 2rem;">Nenhum medicamento encontrado.</div>';
            return;
        }

        grid.innerHTML = '';
        for (const med of medications) {
            const card = document.createElement('div');
            card.className = 'medication-card';
            card.setAttribute('data-med-id', med.id);
            
            // Renderizar imagem ou placeholder
            let imageHtml = '';
            if (med.photo_url) {
                imageHtml = `<img src="${med.photo_url}" alt="${med.name}" class="medication-card-image" onerror="this.replaceWith(this.nextElementSibling)">`;
            } else {
                imageHtml = `<div class="medication-card-image-placeholder"></div>`;
            }
            
            card.innerHTML = `
                ${imageHtml}
                <div class="medication-card-content">
                    <div class="medication-card-name">${med.name}</div>
                    <div class="medication-card-info">
                        <div><span class="medication-card-info-label">Fabricante:</span> ${med.manufacturer || 'N/A'}</div>
                        <div><span class="medication-card-info-label">Princípio Ativo:</span> ${med.active_ingredient || 'N/A'}</div>
                        ${med.dosage ? `<div><span class="medication-card-info-label">Dosagem:</span> ${med.dosage}</div>` : ''}
                    </div>
                    <span class="medication-card-category">${med.category || 'Sem categoria'}</span>
                    <div class="medication-card-actions">
                        <button class="btn-icon btn-edit" aria-label="Editar" data-med-id="${med.id}">✏️</button>
                        <button class="btn-icon btn-delete" aria-label="Deletar" data-med-id="${med.id}">🗑️</button>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        }

        setupDeleteListeners('medications-grid', 'data-med-id', '/medications/', loadMedicationsData);
        setupMedicationEditListeners('medications-grid', 'data-med-id', '/medications/', 'medication-modal');
        applyPermissions();

    } catch (error) {
        console.error("Erro ao carregar medicamentos:", error);
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: #dc3545;">Erro ao carregar dados.</div>';
    }
}

function setupMedicationFilters() {
    const filterButton = document.getElementById('filter-btn');
    if (filterButton) {
        filterButton.addEventListener('click', () => {
            paginationState.medications.currentPage = 1;
            loadMedicationsData();
        });
    }
}

function setupMedicationModalForm() {
    const form = document.getElementById('medication-form');
    if (!form) return;
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    const errorElement = document.getElementById('medication-form-error');

    newForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = newForm.querySelector('button[type="submit"]');
        btn.disabled = true; btn.textContent = 'Salvando...';
        displayFormError(errorElement, null);

        const id = newForm.querySelector('#medication-id').value;
        const method = id ? 'put' : 'post';
        const endpoint = id ? `/medications/${id}` : '/medications';

        const formData = new FormData(newForm);

        if (!id) formData.delete('id');

        const photoInput = newForm.querySelector('#medication-photo');
        if (!photoInput.files.length || photoInput.files[0].size === 0) {
            formData.delete('photo');
        }

        try {
            await globalThis.api[method](endpoint, formData);
            alert(`Medicamento salvo com sucesso!`);
            document.getElementById('modal-overlay').click();
            loadMedicationsData();
            newForm.reset();
        } catch (error) {
            displayFormError(errorElement, error);
        } finally {
            btn.disabled = false; btn.textContent = 'Salvar';
        }
    });
}

async function loadInventoryData() {
    const grid = document.getElementById('inventory-grid');
    if (!grid) return;
    grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 2rem;">Carregando...</div>';

    const unitId = document.getElementById('filter-unit')?.value || '';
    const status = document.getElementById('filter-status')?.value || '';
    const page = paginationState.inventory.currentPage;
    const params = new URLSearchParams({ page: page, limit: '20' });
    if (unitId) params.append('health_unit_id', unitId);

    try {
        const data = await globalThis.api.get(`/medication_inventory?${params.toString()}`);
        let inventoryItems = data.data;

        // Filtrar por status se necessário
        if (status) {
            inventoryItems = inventoryItems.filter(item => {
                const qty = item.available_quantity;
                if (status === 'adequate') return qty > 10;
                if (status === 'low') return qty > 0 && qty <= 10;
                if (status === 'out') return qty === 0;
                return true;
            });
        }

        paginationState.inventory.currentPage = data.page;
        paginationState.inventory.totalPages = data.pages;
        renderPaginationControls('inventory');

        if (!inventoryItems || inventoryItems.length === 0) {
            grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 2rem;">Nenhum item encontrado.</div>';
            return;
        }

        grid.innerHTML = '';
        for (const item of inventoryItems) {
            const card = document.createElement('div');
            card.className = 'inventory-card';
            card.setAttribute('data-inventory-id', item.id);
            
            const qty = item.available_quantity;
            let statusClass = 'inventory-status-adequate';
            let statusText = '✓ Adequado';
            
            if (qty === 0) {
                statusClass = 'inventory-status-out';
                statusText = '✕ Em Falta';
            } else if (qty > 0 && qty <= 10) {
                statusClass = 'inventory-status-low';
                statusText = '⚠ Baixo';
            }

            card.innerHTML = `
                <div class="inventory-card-header">
                    <div class="inventory-card-title">${item.medication?.name || 'N/A'}</div>
                    <span class="inventory-status-badge ${statusClass}">${statusText}</span>
                </div>
                <div class="inventory-card-info">
                    <div class="inventory-card-info-item">
                        <span class="inventory-card-info-label">Unidade:</span>
                        <span>${item.healthUnit?.name || 'N/A'}</span>
                    </div>
                    <div class="inventory-card-info-item">
                        <span class="inventory-card-info-label">Categoria:</span>
                        <span>${item.medication?.category || 'N/A'}</span>
                    </div>
                    <div class="inventory-card-info-item">
                        <span class="inventory-card-info-label">Princípio Ativo:</span>
                        <span>${item.medication?.active_ingredient || 'N/A'}</span>
                    </div>
                </div>
                <div class="inventory-quantity-display">
                    <span>${qty}</span>
                    <span class="inventory-quantity-unit">unidades</span>
                </div>
                <div class="inventory-card-actions">
                    <button class="btn btn-add" data-action="add" data-inventory-id="${item.id}">+ Entrada</button>
                    <button class="btn btn-remove" data-action="remove" data-inventory-id="${item.id}">- Saída</button>
                </div>
            `;
            grid.appendChild(card);
        }

        // Setup event listeners para os botões de ação
        setupInventoryActionListeners();
        applyPermissions();

    } catch (error) {
        console.error("Erro ao carregar inventário:", error);
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: #dc3545;">Erro ao carregar dados.</div>';
    }
}

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

    const statusFilter = document.getElementById('filter-status');
    if (statusFilter) {
        statusFilter.addEventListener('change', () => {
            paginationState.inventory.currentPage = 1;
            loadInventoryData();
        });
    }
}

function setupInventoryActionListeners() {
    const actionButtons = document.querySelectorAll('[data-action]');
    actionButtons.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            const action = btn.getAttribute('data-action');
            const inventoryId = btn.getAttribute('data-inventory-id');
            openInventoryModal(inventoryId, action);
        });
    });
}

async function openInventoryModal(inventoryId, action) {
    try {
        console.log('Abrindo modal de inventário', { inventoryId, action });
        const response = await globalThis.api.get(`/medication_inventory/${inventoryId}`);
        const inventory = response.inventory;
        
        const modal = document.getElementById('inventory-modal');
        const modalOverlay = document.getElementById('modal-overlay');
        
        if (!modal || !modalOverlay) {
            console.error('Modal ou overlay não encontrado');
            return;
        }
        
        const form = document.getElementById('inventory-form');
        
        document.getElementById('inventory-id').value = inventory.id;
        document.getElementById('inventory-current').value = inventory.available_quantity;
        document.getElementById('inventory-medication-info').textContent = 
            `${inventory.medication?.name || 'Medicamento'} - ${inventory.healthUnit?.name || 'Unidade'}`;
        document.getElementById('inventory-operation').value = action;
        document.getElementById('inventory-quantity').value = '';
        document.getElementById('inventory-reason').value = '';
        document.getElementById('inventory-form-error').textContent = '';
        document.getElementById('inventory-form-result').textContent = '';
        
        // Limpar listeners anteriores
        form.replaceWith(form.cloneNode(true));
        const newForm = document.getElementById('inventory-form');
        
        newForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await submitInventoryMovement(inventory);
        });
        
        // Remover classes anteriores e adicionar novas
        modal.classList.remove('editing', 'creating');
        modal.classList.add('open');
        modalOverlay.classList.add('open');
        
        console.log('Modal aberto com sucesso');
        
    } catch (error) {
        console.error('Erro ao abrir formulário:', error);
        alert('Erro ao abrir formulário: ' + error.message);
    }
}

async function submitInventoryMovement(inventory) {
    const inventoryId = document.getElementById('inventory-id').value;
    const operation = document.getElementById('inventory-operation').value;
    const quantity = parseInt(document.getElementById('inventory-quantity').value);
    const reason = document.getElementById('inventory-reason').value;
    const errorElement = document.getElementById('inventory-form-error');
    const resultElement = document.getElementById('inventory-form-result');
    
    errorElement.textContent = '';
    resultElement.textContent = '';
    
    if (!operation) {
        errorElement.textContent = 'Selecione o tipo de operação';
        return;
    }
    
    if (!quantity || quantity < 1) {
        errorElement.textContent = 'Digite uma quantidade válida';
        return;
    }
    
    const currentQty = inventory.available_quantity;
    let newQty = currentQty;
    
    if (operation === 'add') {
        newQty = currentQty + quantity;
    } else if (operation === 'remove') {
        if (quantity > currentQty) {
            errorElement.textContent = `Quantidade inválida. Disponível: ${currentQty}`;
            return;
        }
        newQty = currentQty - quantity;
    }
    
    try {
        const submitBtn = document.querySelector('#inventory-form button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Processando...';
        
        // Atualizar o inventário com a nova quantidade
        await globalThis.api.put(`/medication_inventory/${inventoryId}`, {
            available_quantity: newQty
        });
        
        resultElement.textContent = `✓ Movimentação registrada com sucesso! Nova quantidade: ${newQty}`;
        resultElement.style.color = 'var(--color-success)';
        
        setTimeout(() => {
            document.getElementById('modal-overlay').click();
            loadInventoryData();
        }, 1500);
        
    } catch (error) {
        errorElement.textContent = 'Erro ao registrar movimentação: ' + error.message;
    } finally {
        const submitBtn = document.querySelector('#inventory-form button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Registrar Movimentação';
    }
}

async function loadReservationsData() {
    const tableBody = document.getElementById('reservations-table-body');
    if (!tableBody) return;
    tableBody.innerHTML = '<tr><td colspan="5">Carregando...</td></tr>';

    const params = new URLSearchParams({ page: paginationState.reservations.currentPage, limit: '10' });

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
            const translatedStatus = translateStatus(res.status);
            let actionButtons = '';
            if (res.status === 'reserved') {
                actionButtons = `<button class="btn btn-secondary btn-sm btn-update-status" data-id="${res.id}" data-new-status="ready">Marcar Pronto</button>
                <button class="btn btn-danger btn-sm btn-cancel-reservation" data-id="${res.id}">Cancelar</button>`;
            } else if (res.status === 'ready') {
                actionButtons = `<button class="btn btn-secondary btn-sm btn-update-status" data-id="${res.id}" data-new-status="picked_up">Confirmar Retirada</button>
                <button class="btn btn-danger btn-sm btn-cancel-reservation" data-id="${res.id}">Cancelar</button>`;
            } else if (res.status === 'canceled') {
                actionButtons = `<span class="status-badge status-canceled">Cancelada</span>`;
            } else {
                actionButtons = `<span class="status-badge status-success">Finalizada</span>`;
            }

            row.innerHTML = `
                <td>${res.patient?.users?.name || 'N/A'}</td>
                <td>${res.medication?.name || 'N/A'}</td>
                <td>${pickupDate}</td>
                <td>${translatedStatus}</td>
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

function setupReservationFilters() {
    const filterButton = document.getElementById('filter-btn');
    if (filterButton) {
        filterButton.addEventListener('click', () => {
            paginationState.reservations.currentPage = 1;
            loadReservationsData();
        });
    }
}

function setupReservationActionButtons() {
    for (const button of document.querySelectorAll('.btn-update-status')) {
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);

        newButton.addEventListener('click', async (e) => {
            const id = e.target.dataset.id;
            const newStatus = e.target.dataset.newStatus;
            if (!confirm(`Confirmar status?`)) return;

            try {
                await globalThis.api.put(`/medication_reservations/${id}`, { status: newStatus });
                loadReservationsData();
            } catch (error) {
                alert(`Erro: ${error.message}`);
            }
        });
    }

    for (const button of document.querySelectorAll('.btn-cancel-reservation')) {
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);

        newButton.addEventListener('click', async (e) => {
            const id = e.currentTarget.dataset.id;
            if (!confirm(`Cancelar reserva?`)) return;
            try {
                await globalThis.api.delete(`/medication_reservations/${id}`);
                loadReservationsData();
            } catch (error) {
                alert(`Erro: ${error.message}`);
            }
        });
    }
}

async function loadAppointmentsData() {
    const tableBody = document.getElementById('appointments-table-body');
    if (!tableBody) return;
    tableBody.innerHTML = '<tr><td colspan="5">Carregando...</td></tr>';

    const params = new URLSearchParams({ page: paginationState.appointments.currentPage, limit: '10' });

    try {
        const data = await globalThis.api.get(`/appointments?${params.toString()}`);
        const appointments = data.data || [];

        if (data.pagination) {
            paginationState.appointments.currentPage = data.pagination.page;
            paginationState.appointments.totalPages = data.pagination.pages;
        }
        renderPaginationControls('appointments');

        if (!appointments || appointments.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5">Nenhum agendamento encontrado.</td></tr>';
            return;
        }

        tableBody.innerHTML = '';
        for (const app of appointments) {
            const row = document.createElement('tr');
            const translatedStatus = translateStatus(app.status || 'unknown');
            const statusBadge = `<span class="status-badge status-${app.status || 'unknown'}">${translatedStatus}</span>`;

            const recordBtn = app.status !== 'canceled'
                ? `<button class="btn-icon btn-record" title="Prontuário" onclick="globalThis.openMedicalRecordModal(${app.id})">📋</button>`
                : '';

            row.innerHTML = `
                <td>${app.patient?.users?.name || 'N/A'}</td>
                <td>${app.professional?.user?.name || 'N/A'}</td>
                <td>${formatApiDateTime(app.date_time)}</td>
                <td>${statusBadge}</td>
                <td class="actions">
                    ${recordBtn}
                    <button class="btn-icon btn-edit" aria-label="Editar" data-id="${app.id}">✏️</button>
                    <button class="btn-icon btn-delete" aria-label="Cancelar" data-id="${app.id}">🗑️</button>
                </td>
            `;
            tableBody.appendChild(row);
        }

        setupAppointmentActionButtons();
        if (typeof applyPermissions === 'function') applyPermissions();

    } catch (error) {
        console.error("Erro ao carregar agendamentos:", error);
        tableBody.innerHTML = '<tr><td colspan="5">Erro ao carregar dados.</td></tr>';
    }
}

async function loadAppointmentModalSelects() {
    await Promise.all([
        populateSelect('appointment-patient', '/patients?limit=200', 'patient_id', ['users', 'name']),
        populateSelect('appointment-professional', '/professionals?limit=100', 'id', ['user', 'name']),
        populateSelect('appointment-unit', '/health_units?limit=100', 'id', ['name'])
    ]);
}

function setupAppointmentModalForm() {
    const form = document.getElementById('appointment-form');
    if (!form) return;

    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    const errorMsg = document.getElementById('appointment-form-error');

    newForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = newForm.querySelector('button[type="submit"]');
        btn.disabled = true; btn.textContent = 'Salvando...';
        if(errorMsg) { errorMsg.textContent = ''; errorMsg.style.display = 'none'; }

        try {
            const fd = new FormData(newForm);
            const id = newForm.querySelector('#appointment-id').value;

            const dateInput = fd.get('date_time');
            if (!dateInput) throw new Error("Selecione data e hora.");

            const localDate = new Date(dateInput);
            const userTimezoneOffset = localDate.getTimezoneOffset() * 60000;
            const isoDateFixed = new Date(localDate.getTime() - userTimezoneOffset).toISOString();

            const patientId = parseInt(newForm.querySelector('#appointment-patient').value);
            const professionalId = parseInt(newForm.querySelector('#appointment-professional').value);
            const unitId = parseInt(newForm.querySelector('#appointment-unit').value);

            if(!patientId || !professionalId || !unitId) throw new Error("Preencha todos os campos.");

            const payload = {
                patient_id: patientId,
                professional_id: professionalId,
                health_unit_id: unitId,
                specialty: fd.get('specialty'),
                status: fd.get('status') || 'scheduled',
                date_time: isoDateFixed
            };

            if (id) await globalThis.api.put(`/appointments/${id}`, payload);
            else await globalThis.api.post('/appointments', payload);

            alert('Agendamento salvo com sucesso!');
            document.getElementById('modal-overlay').click();
            loadAppointmentsData();
        } catch (error) {
            const txt = error.details ? error.details : (error.message || "Erro ao salvar");
            if(errorMsg) {
                errorMsg.textContent = txt;
                errorMsg.style.display = 'block';
                errorMsg.style.color = '#d9534f';
            } else { alert(txt); }
        } finally {
            btn.disabled = false; btn.textContent = 'Salvar';
        }
    });
}

function setupAppointmentFilters() {
    const filterButton = document.getElementById('filter-btn');
    if (filterButton) {
        filterButton.addEventListener('click', () => {
            paginationState.appointments.currentPage = 1;
            loadAppointmentsData();
        });
    }
}

function setupAppointmentActionButtons() {
    const tbody = document.getElementById('appointments-table-body');
    if (!tbody) return;

    tbody.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const id = e.currentTarget.dataset.id;
            if (!confirm(`Deseja realmente cancelar este agendamento?`)) return;
            try {
                await globalThis.api.delete(`/appointments/${id}`);
                alert('Cancelado com sucesso!');
                loadAppointmentsData();
            } catch (error) { alert(error.message); }
        });
    });

    setupAppointmentEditListeners('#appointments-table-body', 'data-id', '/appointments/', 'appointment-modal');
}

globalThis.openMedicalRecordModal = function(appointmentId) {
    const modal = document.getElementById('medical-record-modal');
    const overlay = document.getElementById('modal-overlay');
    const idInput = document.getElementById('record-appointment-id');

    if (modal && overlay && idInput) {
        idInput.value = appointmentId;
        modal.classList.add('open');
        overlay.classList.add('open');
    } else {
        alert("Modal de prontuário não encontrado");
    }
};

function setupMedicalRecordModal() {
    const modal = document.getElementById('medical-record-modal');
    const form = document.getElementById('medical-record-form');
    if (!modal || !form) return;

    const closeBtn = modal.querySelector('.close-modal-btn') || document.getElementById('close-record-btn');
    const cancelBtn = document.getElementById('cancel-record-btn');

    [closeBtn, cancelBtn].forEach(btn => {
        if(btn) btn.addEventListener('click', () => {
            modal.classList.remove('open');
            document.getElementById('modal-overlay').classList.remove('open');
        });
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = form.querySelector('button[type="submit"]');
        btn.disabled = true; btn.textContent = 'Salvando...';

        try {
            const fd = new FormData(form);
            const data = {
                appointment_id: parseInt(fd.get('appointment_id')),
                observations: fd.get('observations'),
                prescribed_medications: fd.get('prescribed_medications'),
                requested_exams: fd.get('requested_exams'),
                record_date: new Date().toISOString()
            };

            await globalThis.api.post('/medical_records', data);
            alert('Prontuário salvo!');
            modal.classList.remove('open');
            document.getElementById('modal-overlay').classList.remove('open');
            form.reset();
        } catch (error) {
            alert('Erro: ' + (error.message || 'Falha ao salvar'));
        } finally {
            btn.disabled = false; btn.textContent = 'Salvar Prontuário';
        }
    });
}

let currentProfessionalId = null;

async function getCurrentProfessional() {
    if (currentProfessionalId) return currentProfessionalId;
    try {
        const userId = parseInt(localStorage.getItem('userId'));
        const role = localStorage.getItem('userRole');
        if (role === 'admin' || role === 'super_admin') return null;

        const res = await globalThis.api.get('/professionals?limit=100');
        const professionals = res.data || [];
        const myProfile = professionals.find(p => p.user && p.user.id === userId);

        if (myProfile) {
            currentProfessionalId = myProfile.id;
            return myProfile.id;
        }
    } catch (e) {
        console.error("Erro ao buscar ID profissional:", e);
    }
    return null;
}

async function loadSchedulesData() {
    const tbody = document.getElementById('schedule-table-body');
    if(!tbody) return;
    tbody.innerHTML = '<tr><td colspan="5">Carregando...</td></tr>';

    try {
        const profId = await getCurrentProfessional();
        const role = localStorage.getItem('userRole');
        const isAdmin = role === 'admin' || role === 'super_admin';

        let endpoint = '/professional_schedules?limit=20';
        if (!isAdmin && profId) {
            endpoint += `&professional_id=${profId}`;
        }

        const res = await globalThis.api.get(endpoint);
        const schedules = res.data || [];

        if(schedules.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5">Nenhum horário definido.</td></tr>';
            return;
        }

        const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

        tbody.innerHTML = schedules.map(s => {
            const canDelete = isAdmin || (profId && s.professional_id === profId);
            return `
            <tr>
                <td>${days[s.day_of_week]}</td>
                <td>${s.health_unit?.name || 'N/A'}</td>
                <td>${s.startTime?.slice(0,5)}</td>
                <td>${s.endTime?.slice(0,5)}</td>
                <td class="actions">
                    ${canDelete ? `<button class="btn-icon btn-delete" onclick="deleteSchedule(${s.id})">🗑️</button>` : ''}
                </td>
            </tr>
        `}).join('');

    } catch(e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="5">Erro ao carregar horários.</td></tr>';
    }
}

async function loadScheduleModalSelects() {
    await populateSelect('schedule-unit', '/health_units?limit=100', 'id', ['name']);

    const selectProf = document.getElementById('schedule-professional');
    const divProf = document.getElementById('div-select-professional');
    const role = localStorage.getItem('userRole');
    const isAdmin = role === 'admin' || role === 'super_admin';

    if (isAdmin) {
        if(divProf) divProf.style.display = 'block';
        await populateSelect('schedule-professional', '/professionals?limit=100', 'id', ['user', 'name']);
    } else {
        if(divProf) divProf.style.display = 'none';
        const myProfId = await getCurrentProfessional();
        if (myProfId && selectProf) {
            selectProf.innerHTML = `<option value="${myProfId}" selected>Eu</option>`;
        }
    }
}

function setupScheduleForm() {
    const form = document.getElementById('schedule-form');
    if(!form) return;
    const err = document.getElementById('schedule-form-error');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = form.querySelector('button[type="submit"]');
        btn.disabled = true; btn.textContent = 'Salvando...';
        displayFormError(err, null);

        try {
            const fd = new FormData(form);
            let profId = fd.get('professional_id');

            if (!profId) {
                profId = await getCurrentProfessional();
            }

            if (!profId) {
                throw new Error("Não foi possível identificar o profissional logado.");
            }

            const data = {
                health_unit_id: parseInt(fd.get('health_unit_id')),
                day_of_week: parseInt(fd.get('day_of_week')),
                start_time: fd.get('start_time'),
                end_time: fd.get('end_time'),
                slot_duration_minutes: parseInt(fd.get('slot_duration_minutes')),
                professional_id: parseInt(profId)
            };

            await globalThis.api.post('/professional_schedules', data);
            alert('Horário criado com sucesso!');
            document.getElementById('modal-overlay').click();
            loadSchedulesData();
            form.reset();

        } catch(e) {
            displayFormError(err, e);
        } finally {
            btn.disabled = false; btn.textContent = 'Salvar Horário';
        }
    });
}
globalThis.deleteSchedule = async (id) => {
    if(!confirm('Remover este horário?')) return;
    try { await globalThis.api.delete(`/professional_schedules/${id}`); loadSchedulesData(); }
    catch(e) { alert(e.message); }
};

function setupProfessionalModalForm() {
    const form = document.getElementById('professional-form');
    if (!form) return;
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    const errorElement = document.getElementById('professional-form-error');

    newForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitButton = newForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Salvando...';
        displayFormError(errorElement, null);

        try {
            const formData = new FormData(newForm);
            await globalThis.api.post('/professionals', formData);
            alert('Profissional criado com sucesso!');
            document.getElementById('modal-overlay').click();
            loadUsersData();
            newForm.reset();
        } catch (error) {
            displayFormError(errorElement, error);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Criar Profissional';
        }
    });
}

function setupDeleteListeners(tableBodyId, dataAttribute, endpointPrefix, reloadFunction) {
    const tableBody = document.getElementById(tableBodyId);
    if (!tableBody) return;
    const datasetKey = dataAttribute.substring(5).replace(/-(\w)/g, (match, p1) => p1.toUpperCase());

    for (const button of tableBody.querySelectorAll(`.btn-delete[${dataAttribute}]`)) {
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);

        newButton.addEventListener('click', async (e) => {
            const id = e.currentTarget.dataset[datasetKey];
            if (!confirm(`Tem certeza que deseja deletar este item?`)) return;

            try {
                await globalThis.api.delete(`${endpointPrefix}${id}`);
                alert('Item deletado com sucesso!');
                reloadFunction();
            } catch (error) {
                alert(`Erro: ${error.message}`);
            }
        });
    }
}

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
            displayFormError(errorElement, null);

            modal.classList.add('open', 'editing');
            modal.classList.remove('creating');
            modalOverlay.classList.add('open');

            try {
                const data = await globalThis.api.get(`${endpointPrefix}${id}`);
                populateFormCallback(modal, data);
            } catch (error) {
                console.error('Erro ao buscar dados para edição:', error);
                if (errorElement) displayFormError(errorElement, new Error('Erro ao carregar dados.'));
            }
        });
    }
}

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

function setupPatientEditListeners(tableBodyId, dataAttribute, endpointPrefix, modalId) {
    setupEditListeners(tableBodyId, dataAttribute, endpointPrefix, modalId, (modal, data) => {
        const patient = data.patient;
        modal.querySelector('.modal-header h3').textContent = 'Editar Paciente';
        modal.querySelector('#patient-id').value = patient.id;
        modal.querySelector('#patient-name').value = patient.users.name;
        modal.querySelector('#patient-email').value = patient.users.email || '';
        modal.querySelector('#patient-phone').value = patient.users.phone || '';

        if (modal.querySelectorAll('.field-for-create')) {
            modal.querySelectorAll('.field-for-create').forEach(el => el.style.display = 'none');
            modal.querySelectorAll('.field-for-create input').forEach(i => i.removeAttribute('required'));
        }
    });
}

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
    });
}

function setupAppointmentEditListeners(tableSelector, dataAttr, endpointPrefix, modalId) {
    const tableBody = document.querySelector(tableSelector);
    if (!tableBody) return;
    const attrKey = dataAttr.replace('data-', '');

    tableBody.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const id = e.currentTarget.dataset[attrKey];
            const modal = document.getElementById(modalId);
            const overlay = document.getElementById('modal-overlay');
            if (!modal) return;

            modal.classList.add('open', 'editing');
            if(overlay) overlay.classList.add('open');

            try {
                await loadAppointmentModalSelects();
                const data = await globalThis.api.get(`${endpointPrefix}${id}`);
                const app = data.appointment;

                modal.querySelector('#appointment-id').value = app.id;

                const setVal = (selId, val) => {
                    const el = modal.querySelector(selId);
                    if(el && val) el.value = val;
                };
                setVal('#appointment-patient', app.patient_id);
                setVal('#appointment-professional', app.professional_id);
                setVal('#appointment-unit', app.health_unit_id);

                modal.querySelector('#appointment-specialty').value = app.specialty || '';
                modal.querySelector('#appointment-status').value = app.status;

                if (app.date_time) {
                    const dateObj = new Date(app.date_time);
                    const tzOffset = dateObj.getTimezoneOffset() * 60000;
                    const localISOTime = (new Date(dateObj - tzOffset)).toISOString().slice(0, 16);
                    modal.querySelector('#appointment-datetime').value = localISOTime;
                }
            } catch (error) {
                console.error(error);
                alert("Erro ao carregar agendamento.");
            }
        });
    });
}

function initAppointmentModalListeners() {
    const modal = document.getElementById('appointment-modal');
    if (modal) {
        modal.addEventListener('transitionend', (e) => {
            if (!e.target.classList.contains('open')) {
                const form = e.target.querySelector('form');
                if (form) {
                    form.querySelectorAll('select, input').forEach(el => el.disabled = false);
                }
            }
        });
    }
}

// --- CALENDAR FUNCTIONS ---
let currentCalendarDate = new Date();
let allAppointments = [];

function initializeCalendar() {
    const calendarDaysContainer = document.getElementById('calendar-days');
    if (!calendarDaysContainer) return;

    renderCalendar();
    setupCalendarNavigation();
    loadCalendarAppointments();
    
    // Load today's appointments on initialization
    setTimeout(() => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;
        loadUpcomingAppointments(todayStr);
    }, 500);
}

function renderCalendar() {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    
    // Update header
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                       'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    document.getElementById('calendar-month-year').textContent = `${monthNames[month]} ${year}`;
    
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    
    const calendarDays = document.getElementById('calendar-days');
    calendarDays.innerHTML = '';
    
    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
        const day = daysInPrevMonth - i;
        const dayElement = createDayElement(day, true);
        calendarDays.appendChild(dayElement);
    }
    
    // Current month days
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        const isToday = day === today.getDate() && 
                       month === today.getMonth() && 
                       year === today.getFullYear();
        
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const hasAppointment = allAppointments.some(apt => apt.date === dateStr);
        
        const dayElement = createDayElement(day, false, isToday, hasAppointment, dateStr);
        calendarDays.appendChild(dayElement);
    }
    
    // Next month days
    const remainingDays = 42 - (firstDay + daysInMonth);
    for (let day = 1; day <= remainingDays; day++) {
        const dayElement = createDayElement(day, true);
        calendarDays.appendChild(dayElement);
    }
}

function createDayElement(day, isOtherMonth, isToday = false, hasAppointment = false, dateStr = '') {
    const element = document.createElement('div');
    element.className = 'calendar-day';
    element.textContent = day;
    
    if (isOtherMonth) {
        element.classList.add('other-month');
    } else {
        if (isToday) element.classList.add('today');
        if (hasAppointment) element.classList.add('has-event');
        
        if (dateStr) {
            element.addEventListener('click', () => {
                document.querySelectorAll('.calendar-day.selected').forEach(el => {
                    el.classList.remove('selected');
                });
                element.classList.add('selected');
                loadUpcomingAppointments(dateStr);
            });
        }
    }
    
    return element;
}

function setupCalendarNavigation() {
    const prevBtn = document.getElementById('calendar-prev');
    const nextBtn = document.getElementById('calendar-next');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
            renderCalendar();
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
            renderCalendar();
        });
    }
}

async function loadCalendarAppointments() {
    try {
        const res = await globalThis.api.get('/appointments?limit=1000');
        allAppointments = res.data.map(apt => {
            // Parse date from ISO or formatted string
            let dateStr = '';
            if (apt.date_time) {
                // Try to extract from various formats
                const match = apt.date_time.match(/(\d{2})\/(\d{2})\/(\d{4})/);
                if (match) {
                    // Convert DD/MM/YYYY to YYYY-MM-DD
                    const [, day, month, year] = match;
                    dateStr = `${year}-${month}-${day}`;
                } else if (apt.date_time.includes('T')) {
                    // ISO format
                    dateStr = apt.date_time.split('T')[0];
                }
            }
            return { ...apt, date: dateStr };
        });
        renderCalendar();
    } catch (error) {
        console.error('Erro ao carregar agendamentos:', error);
    }
}

function loadUpcomingAppointments(selectedDate) {
    const container = document.getElementById('upcoming-appointments');
    
    const selectedAppointments = allAppointments.filter(apt => apt.date === selectedDate);
    
    if (selectedAppointments.length === 0) {
        container.innerHTML = '<p class="empty-state">Nenhum agendamento para este dia</p>';
        return;
    }
    
    container.innerHTML = selectedAppointments.map(apt => `
        <div class="upcoming-item">
            <div class="upcoming-item-time">${apt.date_time}</div>
            <div class="upcoming-item-patient"><strong>${apt.patient?.users?.name || 'N/A'}</strong></div>
            <div class="upcoming-item-professional">${apt.professional?.user?.name || 'N/A'}</div>
        </div>
    `).join('');
}

// Initialize calendar when page loads
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('calendar-days')) {
        initializeCalendar();
    }
});
