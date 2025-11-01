# 🏥 Med.Sys - Sistema de Gestão Médica
**Desenvolvido por Felipe Katuki, Julio D'Elboux, Yasmim Lopes e Maria Luiza Manco.**

Um sistema completo de gestão médica com funcionalidades para pacientes, profissionais, medicamentos, agendamentos e reservas.

## 📋 Características

- ✅ Autenticação com JWT
- ✅ Gestão de Usuários (Admin, Profissional, Paciente)
- ✅ Cadastro de Pacientes
- ✅ Gestão de Profissionais de Saúde
- ✅ Catálogo de Medicamentos
- ✅ Controle de Inventário de Medicamentos
- ✅ Sistema de Reservas de Medicamentos
- ✅ Agendamentos de Consultas
- ✅ Prontuários Médicos
- ✅ Encaminhamentos 
- ✅ Unidades de Saúde
- ✅ Geolocalização de Unidades de Saúde
- ✅ Validações com Yup
- ✅ Upload de Fotos (Cloudinary)
- ✅ Paginação em todas as listagens

---

## 🚀 Quick Start

### Pré-requisitos

- Node.js 
- npm ou yarn
- PostgreSQL (ou banco de dados compatível)
- Conta no Cloudinary (opcional, para upload de fotos)
- Conta no Twilio (opcional, para envio de SMS)

### Instalação

1. **Clone o repositório**
```bash
git clone https://github.com/kxtukI/med.sys.git
cd med.sys
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:
```env
# Banco de Dados
DATABASE_URL=postgresql://user:password@localhost:5432/med_sys

# JWT
JWT_SECRET=sua_chave_secreta_aqui

# Cloudinary (opcional)
CLOUDINARY_NAME=seu_cloud_name
CLOUDINARY_API_KEY=sua_api_key
CLOUDINARY_API_SECRET=seu_api_secret

# Twilio (para SMS)
TWILIO_SID=seu_twilio_sid
TWILIO_TOKEN=seu_twilio_token
TWILIO_FROM=seu_numero_twilio

# Email (para recuperação de senha)
EMAIL_USER=seu_email@gmail.com
EMAIL_PASS=sua_senha_app

# Node
NODE_ENV=development
PORT=3000
```

4. **Execute as migrações do banco de dados**
```bash
npm run migrate
```
*Ou*
```bash
yarn migrate
```

5. **Inicie o servidor**
```bash
npm run dev
```
*Ou*
```bash
yarn dev
```

O servidor estará rodando em `http://localhost:3000`

---

## 📚 Documentação da API

Acesse a documentação completa em [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

### Endpoints Principais

```
POST   /sessions                          # Login
POST   /logout                            # Logout
POST   /password/request_recovery         # Recuperação de senha
POST   /password/reset                    # Reset de senha

GET    /users                             # Listar usuários (Admin)
GET    /patients                          # Listar pacientes
GET    /professionals                     # Listar profissionais
GET    /health_units                      # Listar unidades de saúde (com geolocalização)
GET    /medications                       # Listar medicamentos
GET    /medication_inventory              # Listar inventário
GET    /medication_reservations           # Listar reservas
GET    /appointments                      # Listar agendamentos
GET    /medical_records                   # Listar registros médicos
GET    /referrals                         # Listar encaminhamentos
```

### 🌍 Geolocalização de Unidades de Saúde

O endpoint `/health_units` suporta cálculo de distância e ordenação por proximidade:

**Exemplos de uso:**

```bash
# Usando coordenadas diretas
GET /health_units?latitude=-23.5505&longitude=-46.6333

# Usando CEP
GET /health_units?zip_code=01310100

# Usando endereço completo
GET /health_units?address=Rua das Flores, 123&city=São Paulo&state=SP

# Combinando com filtros
GET /health_units?latitude=-23.5505&longitude=-46.6333&city=São Paulo
```

**Resposta inclui:**
- `distance_km`: Distância em quilômetros
- `distance_meters`: Distância em metros
- Ordenação automática por proximidade

---

## 🔑 Autenticação

### Login
**POST** `/sessions`

Realiza login e retorna um token JWT.

**Body:**
```json
{
  "email": "usuario@email.com",
  "password": "senha123"
}
```

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "name": "João Silva",
    "email": "joao@email.com",
    "user_type": "patient",
    "phone": "11999999999"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```
---

## 📊 Estrutura do Projeto

```
src/
├── app/
│   ├── controllers/        # Lógica de negócio
│   ├── models/             # Modelos do Sequelize
│   ├── middlewares/        # Middlewares (auth, validation)
│   └── utils/              # Funções auxiliares
├── config/                 # Configurações
├── database/
│   ├── index.js           # Conexão com BD
│   └── migrations/        # Migrações
├── routes.js              # Rotas da API
├── app.js                 # Configuração Express
└── server.js              # Entrada da aplicação
```

---

## 👥 Tipos de Usuário

| Tipo | Acesso |
|------|--------|
| **Admin** | Gestão completa (usuários, medicamentos, unidades) |
| **Professional** | Criar agendamentos, registros médicos, encaminhamentos |
| **Patient** | Ver histórico, fazer reservas de medicamentos |

---

## 📋 Funcionalidades Principais

### 1. Gestão de Pacientes
- Cadastro com CPF, SUS, data de nascimento
- Histórico médico completo
- Agendamentos associados

### 2. Medicamentos
- Catálogo completo com fotos
- Ingrediente ativo, dosagem, fabricante
- Contraindicações e descrição

### 3. Reservas de Medicamentos
- Paciente reserva medicamento em unidade
- Status: reserved → ready → picked_up
- Horário agendado de retirada
- Inventário atualizado automaticamente
- Suporte a cancelamento e expiração

### 4. Agendamentos
- Agenda com profissional de saúde
- Validação de encaminhamento (para especialistas)
- Status: scheduled, completed, canceled

### 5. Registros Médicos
- Prontuário eletrônico
- Observações, prescrições, alergias
- Plano de tratamento

### 6. Inventário
- Quantidade por medicamento e unidade
- Controle de estoque
- Rastreamento de movimentação

### 7. Geolocalização de Unidades de Saúde
- Cálculo de distância entre usuário e unidades
- Ordenação automática por proximidade
- Suporte a 3 métodos de localização:
  - Coordenadas diretas (latitude/longitude)
  - Endereço do perfil do paciente
  - CEP ou endereço via query params
- Retorna distância em quilômetros e metros

---

## 🔄 Fluxo de Reserva de Medicamento

```
1. Paciente cria reserva
   ↓
2. Sistema valida estoque (deduz do inventário)
   ↓
3. Reserva criada com status "reserved"
   ↓
4. Profissional muda para "ready"
   ↓
5. Paciente retira (status "picked_up")
   ↓
6. Finalizado!
```

Se cancelar ou expirar → estoque é reposto automaticamente

---

### ⏱️ Formatação de Datas nas Respostas
- Datas completas (`*_at`, `_timestamp`, `registration_date`, etc.) retornam no formato `DD/MM/AAAA HH:mm`
- Datas simples (`*_date`) retornam no formato `DD/MM/AAAA`
- Campos nulos permanecem como `null`

## 📊 Validações

Todas as entidades possuem validações com **Yup**:

- Emails válidos
- Passwords com mínimo 8 caracteres
- Datas futuras para agendamentos
- Quantidades positivas
- CPF válido
- SUS com 15 dígitos

---

## 🔒 Segurança

- JWT com expiração
- Senhas criptografadas com bcryptjs
- Validação de autorização por role
- Middleware de autenticação
- Transações no banco de dados

---

## 🗂️ Estrutura de Banco de Dados

### Tabelas Principais

- `users` - Usuários do sistema
- `patients` - Pacientes
- `professionals` - Profissionais de saúde
- `health_units` - Unidades de saúde
- `medications` - Medicamentos
- `medication_inventory` - Estoque por unidade
- `medication_reservations` - Reservas de medicamentos ⭐
- `appointments` - Agendamentos
- `medical_records` - Registros médicos
- `referrals` - Encaminhamentos

---

## 📚 Mais Informações

- [API Documentation](./API_DOCUMENTATION.md) - Documentação completa da API
- [GitHub](https://github.com/kxtukI/med.sys) - Repositório

---