# Documentação da Med.Sys
**Última atualização:** 31 de outubro de 2025

## 📋 Índice
1. [Introdução](#introdução)
2. [Autenticação](#autenticação)
3. [Usuários](#usuários)
4. [Pacientes](#pacientes)
5. [Profissionais](#profissionais)
6. [Unidades de Saúde](#unidades-de-saúde)
7. [Medicamentos](#medicamentos)
8. [Inventário de Medicamentos](#inventário-de-medicamentos)
9. [Reservas de Medicamentos](#reservas-de-medicamentos)
10. [Agendamentos](#agendamentos)
11. [Registros Médicos](#registros-médicos)
12. [Encaminhamentos](#encaminhamentos)


## 📝 Notas Importantes

- **Datas:** Use formato ISO `YYYY-MM-DDTHH:mm:ssZ` nas requisições
- **Formatação de Resposta:** 
  - Campos com sufixo `_at` (ex: `created_at`, `reserved_at`) retornam como `DD/MM/AAAA HH:mm`
  - Campos com sufixo `_date` (ex: `birth_date`, `appointment_date`) retornam como `DD/MM/AAAA`
  - Campos `registration_date` e `date_time` retornam como `DD/MM/AAAA HH:mm`
  - Todos os campos com datas nulas retornam como `null`
- **Paginação:** Padrão é `page=1&limit=10`
- **Filtros:** Todos os filtros são opcionais
- **Token:** Sempre incluir no header `Authorization: Bearer {token}`
- **Upload de Arquivos:** Use `multipart/form-data` para fotos
- **Validações:** Todas as entidades possuem validações com Yup
- **Geolocalização:** Suporte a cálculo de distância e ordenação por proximidade

## 🔐 Introdução

**URL Base:** `http://localhost:3000` (desenvolvimento)

**Autenticação:** JWT (Bearer Token)

**Tipos de Usuário:**
- `patient` - Paciente
- `professional` - Profissional de saúde
- `admin` - Administrador

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

### Logout
**POST** `/logout`

Invalida o token JWT atual.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "message": "Desconectado com sucesso"
}
```

---

### Recuperação de Senha - Solicitar
**POST** `/password/request_recovery`

Solicita código de recuperação via email ou SMS.

**Body:**
```json
{
  "email": "usuario@email.com"
}
```

**Ou por CPF:**
```json
{
  "cpf": "12345678901"
}
```

**Response (200):**
```json
{
  "message": "Código de recuperação enviado no telefone: 11999999999"
}
```

---

### Recuperação de Senha - Resetar
**POST** `/password/reset`

Reseta a senha usando o código de recuperação.

**Body:**
```json
{
  "userId": 1,
  "code": "123456",
  "newPassword": "novaSenha123"
}
```

**Response (200):**
```json
{
  "message": "Senha redefinida com sucesso"
}
```

---

## 👥 Usuários

### Listar Usuários (Admin)
**GET** `/users?page=1&limit=10&`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Admin User",
      "email": "admin@email.com",
      "user_type": "admin",
      "phone": "11999999999",
      "active": true,
      "registration_date": "2025-01-07T00:00:00.000Z"
    }
  ],
  "total": 1,
  "limit": 10,
  "page": 1,
  "pages": 1
}
```

---

### Obter Usuário (Admin)
**GET** `/users/:id`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "name": "Admin User",
    "email": "admin@email.com",
    "user_type": "admin",
    "phone": "11999999999",
    "active": true,
    "registration_date": "2025-01-07T00:00:00.000Z"
  }
}
```

---

### Atualizar Usuário (Admin)
**PUT** `/users/:id`

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "name": "Novo Nome",
  "email": "newemail@email.com",
  "phone": "11988888888",
  "active": true
}
```

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "name": "Novo Nome",
    "email": "newemail@email.com",
    "phone": "11988888888",
    "active": true
  }
}
```

---

### Deletar Usuário (Admin)
**DELETE** `/users/:id`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "message": "Usuário deletado com sucesso"
}
```

---

## 🏥 Pacientes

### Registrar Novo Paciente (Público)
**POST** `/patients`

**Body:**
```json
{
  "name": "João da Silva",
  "cpf": "12345678901",
  "sus_number": "123456789012345",
  "birth_date": "1990-05-15",
  "phone": "11999999999",
  "password": "Senha123",
  "address": "Rua das Flores, 123",
  "city": "São Paulo",
  "state": "SP",
  "zip_code": "01310100"
}
```

**Response (201):**
```json
{
  "patient": {
    "id": 1,
    "name": "João da Silva",
    "cpf": "123.456.789-01",
    "sus_number": "12345.6789.0123.45",
    "birth_date": "15/05/1990",
    "phone": "11999999999"
  }
}
```

---

### Listar Pacientes (Profissional/Admin)
**GET** `/patients?name=João&cpf=12345678901`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "data": [
    {
      "patient_id": 1,
      "cpf": "123.456.789-01",
      "sus_number": "12345.6789.0123.45",
      "birth_date": "15/05/1990",
      "users": {
        "user_id": 1,
        "name": "João da Silva",
        "email": "joao@email.com",
        "user_type": "patient",
        "active": true
      }
    }
  ],
  "total": 1,
  "limit": 10,
  "page": 1,
  "pages": 1
}
```

---

### Obter Paciente (Profissional/Admin)
**GET** `/patients/:id`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "patient": {
    "id": 1,
    "cpf": "123.456.789-01",
    "sus_number": "12345.6789.0123.45",
    "birth_date": "15/05/1990",
    "users": {
      "id": 1,
      "name": "João da Silva",
      "email": "joao@email.com",
      "phone": "11999999999"
    }
  }
}
```

---

### Obter Histórico Médico (Profissional)
**GET** `/patients/:id/medical_history`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "patient": {
		"id": 2,
		"cpf": "237.***.***-40",
		"sus_number": null,
		"birth_date": "25/10/1995",
		"users": {
			"id": 3,
			"name": "Lala Ferreira",
			"email": null
		},
		"appointments": [
			{
				"id": 2,
				"date_time": "16/09/2025",
				"specialty": "Dermatologia",
				"status": "completed",
				"medical_records": [
					{
						"id": 1,
						"record_date": "08/09/2025",
						"observations": "Paciente retornou para check-up de rotina. Nega novas queixas. Sinais vitais estáveis.",
						"prescribed_medications": "Nenhuma medicação prescrita no momento.",
						"requested_exams": "Exames de sangue de rotina: hemograma e perfil lipídico.",
						"disease_history": "Hipertensão controlada. Nega outras comorbidades.",
						"allergies": "Nenhuma alergia conhecida.",
						"treatment_plan": "Manter acompanhamento anual. Reforçar a importância da atividade física e dieta equilibrada."
					}
				]
			}
		]
	}
}
```

---

### Atualizar Paciente (Admin)
**PUT** `/patients/:id`

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "name": "João da Silva Santos",
  "email": "joao.novo@email.com",
  "phone": "11988888888",
  "address": "Avenida Paulista, 1000",
  "city": "São Paulo",
  "state": "SP",
  "zip_code": "01310100"
}
```

**Response (200):**
```json
{
  "patient": {
    "id": 1,
    "cpf": "123.456.789-01",
    "birth_date": "15/05/1990",
    "users": {
      "id": 1,
      "name": "João da Silva Santos",
      "email": "joao.novo@email.com"
    }
  }
}
```

---

### Deletar Paciente (Admin)
**DELETE** `/patients/:id`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "message": "Paciente desativado com sucesso"
}
```

---

## 👨‍⚕️ Profissionais

### Listar Profissionais
**GET** `/professionals?specialty=Neurologia`

**Response (200):**
```json
{
  "data": [
    {
      "professional_id": 7,
      "specialty": "Neurologia",
      "user": {
        "user_id": 7,
        "name": "Dra. Lavínia Leme",
        "email": "lavinia.leme@email.com",
        "phone": "11987654321"
      }
    }
  ],
  "total": 1,
  "limit": 10,
  "page": 1,
  "pages": 1
}
```

---

### Obter Profissional
**GET** `/professionals/:id`

**Response (200):**
```json
{
  "professional": {
    "id": 1,
    "user_id": 2,
    "specialty": "Cardiologia",
    "user": {
      "id": 2,
      "name": "Dr. Carlos Silva",
      "email": "carlos@email.com",
      "phone": "11987654321"
    }
  }
}
```

---

### Criar Profissional (Admin)
**POST** `/professionals`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Body (form-data):**
```
name: Dr. Carlos Silva
email: carlos@email.com
phone: 11987654321
password: Senha123
specialty: Cardiologia
photo: (arquivo de imagem)
```

**Response (201):**
```json
{
  "professional": {
    "id": 1,
    "user_id": 2,
    "specialty": "Cardiologia",
    "user": {
      "id": 2,
      "name": "Dr. Carlos Silva",
      "email": "carlos@email.com",
      "phone": "11987654321"
    }
  }
}
```

---

### Atualizar Profissional (Próprio/Admin)
**PUT** `/professionals/:id`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Body (form-data):**
```
name: Dr. Carlos Silva Santos
specialty: Cardiologia Intervencionista
photo: (arquivo de imagem - opcional)
```

**Response (200):**
```json
{
  "professional": {
    "id": 1,
    "specialty": "Cardiologia Intervencionista",
    "user": {
      "name": "Dr. Carlos Silva Santos"
    }
  }
}
```

---

### Deletar Profissional (Admin)
**DELETE** `/professionals/:id`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "message": "Profissional removido com sucesso"
}
```

---

## 🏢 Unidades de Saúde

### Listar Unidades de Saúde
**GET** `/health_units?page=1&limit=10&city=São Paulo&state=SP`

**Query Parameters:**
- `page` (opcional): Número da página (padrão: 1)
- `limit` (opcional): Itens por página (padrão: 10)
- `name` (opcional): Filtrar por nome
- `city` (opcional): Filtrar por cidade
- `state` (opcional): Filtrar por estado

**Parâmetros de Geolocalização (opcionais, em ordem de prioridade):**
- `latitude` + `longitude`: Coordenadas do usuário
- `zip_code`: CEP para geocoding 
- `address` + `city` + `state`: Endereço completo para geocoding 

**Nota:** Se o usuário estiver autenticado como paciente e tiver endereço cadastrado, a localização será usada automaticamente 

**Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Clínica Central",
      "address": "Rua das Flores, 123",
      "city": "São Paulo",
      "state": "SP",
      "zip_code": "01310100",
      "phone": "1133334444",
      "working_hours": "08:00 - 18:00",
      "photo_url": "https://cloudinary.com/...",
      "latitude": "-23.55052000",
      "longitude": "-46.63330800",
      "distance_km": 2.5,
      "distance_meters": 2500,
      "has_distance": true
    },
    {
      "id": 2,
      "name": "Hospital Regional",
      "address": "Av. Paulista, 1000",
      "city": "São Paulo",
      "state": "SP",
      "distance_km": 5.8,
      "distance_meters": 5800,
      "has_distance": true
    }
  ],
  "total": 2,
  "limit": 10,
  "page": 1,
  "pages": 1
}
```

**Exemplos de Requisição com Geolocalização:**

1. **Usando coordenadas diretas:**
```
GET /health_units?latitude=-23.5505&longitude=-46.6333
```

2. **Usando CEP:**
```
GET /health_units?zip_code=01310100
```

3. **Usando endereço completo:**
```
GET /health_units?address=Rua das Flores, 123&city=São Paulo&state=SP
```

4. **Combinando com filtros:**
```
GET /health_units?latitude=-23.5505&longitude=-46.6333&city=São Paulo&state=SP&name=Clínica
```

**Campos de Distância na Resposta:**
- `distance_km`: Distância em quilômetros 
- `distance_meters`: Distância em metros 
- `has_distance`: Indica se a distância foi calculada 
- `latitude` e `longitude`: Coordenadas da unidade 

**Ordenação:**
- Se localização fornecida: unidades ordenadas por distância (mais próxima primeiro)
- Unidades sem coordenadas aparecem por último, ordenadas por nome
- Se nenhuma localização fornecida: ordenação padrão por nome

---

### Obter Unidade de Saúde
**GET** `/health_units/:id`

**Response (200):**
```json
{
  "healthUnit": {
    "id": 1,
    "name": "Clínica Central",
    "address": "Rua das Flores, 123",
    "city": "São Paulo",
    "state": "SP",
    "zip_code": "01310100",
    "phone": "1133334444",
    "working_hours": "08:00 - 18:00",
    "photo_url": "https://cloudinary.com/..."
  }
}
```

---

### Criar Unidade de Saúde (Admin)
**POST** `/health_units`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Body (form-data):**
```
name: Clínica Central
address: Rua das Flores, 123
city: São Paulo
state: SP
zip_code: 01310100
phone: 1133334444
working_hours: 08:00 - 18:00
latitude: -23.5505 (opcional)
longitude: -46.6333 (opcional)
photo: (arquivo de imagem)
```

**Nota:** Os campos `latitude` e `longitude` são opcionais. Se fornecidos, ambos devem ser preenchidos. Latitude deve estar entre -90 e 90, longitude entre -180 e 180.

**Response (201):**
```json
{
  "healthUnit": {
    "id": 1,
    "name": "Clínica Central",
    "address": "Rua das Flores, 123",
    "city": "São Paulo",
    "state": "SP",
    "phone": "1133334444",
    "working_hours": "08:00 - 18:00"
  }
}
```

---

### Atualizar Unidade de Saúde (Admin)
**PUT** `/health_units/:id`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Body (form-data):**
```
name: Clínica Central - Matriz
phone: 1133335555
working_hours: 08:00 - 19:00
latitude: -23.5505 (opcional)
longitude: -46.6333 (opcional)
photo: (arquivo de imagem - opcional)
```

**Nota:** Os campos `latitude` e `longitude` podem ser atualizados. Se um for fornecido, o outro também deve ser fornecido.

**Response (200):**
```json
{
  "healthUnit": {
    "id": 1,
    "name": "Clínica Central - Matriz",
    "phone": "1133335555",
    "working_hours": "08:00 - 19:00"
  }
}
```

---

### Deletar Unidade de Saúde (Admin)
**DELETE** `/health_units/:id`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "message": "Unidade de saúde removida com sucesso"
}
```

---

## 💊 Medicamentos

### Listar Medicamentos
**GET** `/medications?page=1&limit=10&name=dipirona&category=analgésico&active_ingredient=dipirona`

**Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Dipirona 500mg",
      "active_ingredient": "Dipirona",
      "category": "Analgésico",
      "description": "Medicamento para alívio de dores e febres",
      "dosage": "500mg",
      "contraindications": "Nenhuma conhecida",
      "manufacturer": "Laboratório X",
      "photo_url": "https://cloudinary.com/..."
    }
  ],
  "total": 1,
  "limit": 10,
  "page": 1,
  "pages": 1
}
```

---

### Obter Medicamento
**GET** `/medications/:id`

**Response (200):**
```json
{
  "medication": {
    "id": 1,
    "name": "Dipirona 500mg",
    "active_ingredient": "Dipirona",
    "category": "Analgésico",
    "description": "Medicamento para alívio de dores e febres",
    "dosage": "500mg",
    "contraindications": "Nenhuma conhecida",
    "manufacturer": "Laboratório X",
    "photo_url": "https://cloudinary.com/..."
  }
}
```

---

### Criar Medicamento (Admin)
**POST** `/medications`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Body (form-data):**
```
name: Dipirona 500mg
active_ingredient: Dipirona
category: Analgésico
description: Medicamento para alívio de dores e febres
dosage: 500mg
contraindications: Nenhuma conhecida
manufacturer: Laboratório X
photo: (arquivo de imagem)
```

**Response (201):**
```json
{
  "medication": {
    "id": 1,
    "name": "Dipirona 500mg",
    "active_ingredient": "Dipirona",
    "category": "Analgésico",
    "dosage": "500mg",
    "manufacturer": "Laboratório X"
  }
}
```

---

### Atualizar Medicamento (Admin)
**PUT** `/medications/:id`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Body (form-data):**
```
dosage: 500mg - 1g
manufacturer: Laboratório Y
photo: (arquivo de imagem - opcional)
```

**Response (200):**
```json
{
  "medication": {
    "id": 1,
    "name": "Dipirona 500mg",
    "dosage": "500mg - 1g",
    "manufacturer": "Laboratório Y"
  }
}
```

---

### Deletar Medicamento (Admin)
**DELETE** `/medications/:id`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "message": "Medicamento removido com sucesso"
}
```

---

## 📦 Inventário de Medicamentos

### Listar Inventário
**GET** `/medication_inventory?page=1&limit=10&medication_id=1&health_unit_id=1&available_quantity=10`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "medication_id": 1,
      "health_unit_id": 1,
      "available_quantity": 50,
      "update_date": "2025-10-29T10:30:00.000Z",
      "medication": {
        "id": 1,
        "name": "Dipirona 500mg",
        "active_ingredient": "Dipirona",
        "category": "Analgésico"
      },
      "healthUnit": {
        "id": 1,
        "name": "Clínica Central",
        "city": "São Paulo",
        "state": "SP"
      }
    }
  ],
  "total": 1,
  "limit": 10,
  "page": 1,
  "pages": 1
}
```

---

### Obter Inventário
**GET** `/medication_inventory/:id`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "inventory": {
    "id": 1,
    "medication_id": 1,
    "health_unit_id": 1,
    "available_quantity": 50,
    "update_date": "2025-10-29T10:30:00.000Z",
    "medication": {
      "id": 1,
      "name": "Dipirona 500mg",
      "active_ingredient": "Dipirona",
      "category": "Analgésico"
    },
    "healthUnit": {
      "id": 1,
      "name": "Clínica Central",
      "city": "São Paulo",
      "state": "SP"
    }
  }
}
```

---

### Criar Inventário (Profissional/Admin)
**POST** `/medication_inventory`

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "medication_id": 1,
  "health_unit_id": 1,
  "available_quantity": 100
}
```

**Response (201):**
```json
{
  "inventory": {
    "id": 1,
    "medication_id": 1,
    "health_unit_id": 1,
    "available_quantity": 100,
    "update_date": "2025-10-29T10:30:00.000Z"
  }
}
```

---

### Atualizar Inventário (Profissional/Admin)
**PUT** `/medication_inventory/:id`

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "available_quantity": 75
}
```

**Response (200):**
```json
{
  "inventory": {
    "id": 1,
    "medication_id": 1,
    "health_unit_id": 1,
    "available_quantity": 75,
    "update_date": "2025-10-29T10:45:00.000Z"
  }
}
```

---

### Deletar Inventário (Admin)
**DELETE** `/medication_inventory/:id`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "message": "Medicamento removido do estoque com sucesso"
}
```

---

## 🛒 Reservas de Medicamentos

### Listar Reservas
**GET** `/medication_reservations?page=1&limit=10&status=reserved&medication_id=1&health_unit_id=1&patient_id=1&from=2025-01-01&to=2025-12-31`

**Headers:**
```
Authorization: Bearer {token}
```

**Nota:** Pacientes veem apenas suas próprias reservas.

**Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "patient_id": 1,
      "medication_id": 1,
      "health_unit_id": 1,
      "quantity": 2,
      "status": "reserved",
      "scheduled_pickup_at": "2025-10-30T14:00:00.000Z",
      "reserved_at": "2025-10-29T10:30:00.000Z",
      "picked_up_at": null,
      "notes": "Retirar com receita",
      "medication": {
        "id": 1,
        "name": "Dipirona 500mg",
        "active_ingredient": "Dipirona",
        "category": "Analgésico",
        "manufacturer": "Laboratório X"
      },
      "healthUnit": {
        "id": 1,
        "name": "Clínica Central",
        "city": "São Paulo",
        "state": "SP"
      },
      "patient": {
        "id": 1,
        "user_id": 1,
        "cpf": "123.456.789-01",
        "users": {
          "id": 1,
          "name": "João da Silva",
          "email": "joao@email.com",
          "phone": "11999999999"
        }
      }
    }
  ],
  "total": 1,
  "limit": 10,
  "page": 1,
  "pages": 1
}
```

---

### Obter Reserva
**GET** `/medication_reservations/:id`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "reservation": {
    "id": 1,
    "patient_id": 1,
    "medication_id": 1,
    "health_unit_id": 1,
    "quantity": 2,
    "status": "reserved",
    "scheduled_pickup_at": "2025-10-30T14:00:00.000Z",
    "reserved_at": "2025-10-29T10:30:00.000Z",
    "picked_up_at": null,
    "notes": "Retirar com receita",
    "medication": {
      "id": 1,
      "name": "Dipirona 500mg",
      "active_ingredient": "Dipirona",
      "category": "Analgésico",
      "manufacturer": "Laboratório X"
    },
    "healthUnit": {
      "id": 1,
      "name": "Clínica Central",
      "city": "São Paulo",
      "state": "SP"
    },
    "patient": {
      "id": 1,
      "user_id": 1,
      "cpf": "123.456.789-01",
      "users": {
        "id": 1,
        "name": "João da Silva",
        "email": "joao@email.com",
        "phone": "11999999999"
      }
    }
  }
}
```

---

### Criar Reserva
**POST** `/medication_reservations`

**Headers:**
```
Authorization: Bearer {token}
```

**Body (Paciente):**
```json
{
  "medication_id": 1,
  "health_unit_id": 1,
  "quantity": 2,
  "scheduled_pickup_at": "2025-10-30T14:00:00Z",
  "notes": "Retirar com receita"
}
```

**Body (Profissional/Admin):**
```json
{
  "patient_id": 1,
  "medication_id": 1,
  "health_unit_id": 1,
  "quantity": 2,
  "scheduled_pickup_at": "2025-10-30T14:00:00Z",
  "notes": "Retirar com receita"
}
```

**Response (201):**
```json
{
  "reservation": {
    "id": 1,
    "patient_id": 1,
    "medication_id": 1,
    "health_unit_id": 1,
    "quantity": 2,
    "status": "reserved",
    "scheduled_pickup_at": "2025-10-30T14:00:00.000Z",
    "reserved_at": "2025-10-29T10:30:00.000Z",
    "picked_up_at": null,
    "notes": "Retirar com receita",
    "medication": {
      "id": 1,
      "name": "Dipirona 500mg"
    },
    "healthUnit": {
      "id": 1,
      "name": "Clínica Central"
    },
    "patient": {
      "id": 1,
      "users": {
        "id": 1,
        "name": "João da Silva"
      }
    }
  }
}
```

**Erros possíveis:**
- `400` - Paciente ou horário obrigatório/inválido
- `409` - Quantidade insuficiente em estoque

---

### Atualizar Reserva
**PUT** `/medication_reservations/:id`

**Headers:**
```
Authorization: Bearer {token}
```

**Body (Paciente - apenas cancelamento):**
```json
{
  "status": "canceled"
}
```

**Body (Profissional/Admin):**
```json
{
  "status": "ready",
  "scheduled_pickup_at": "2025-10-30T15:00:00Z",
  "notes": "Pronto para retirada"
}
```

**Status válidos:** `reserved`, `ready`, `picked_up`, `canceled`, `expired`

**Response (200):**
```json
{
  "reservation": {
    "id": 1,
    "patient_id": 1,
    "quantity": 2,
    "status": "ready",
    "scheduled_pickup_at": "2025-10-30T15:00:00.000Z",
    "picked_up_at": null,
    "notes": "Pronto para retirada"
  }
}
```

---

### Cancelar/Deletar Reserva
**DELETE** `/medication_reservations/:id`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "message": "Reserva cancelada com sucesso",
  "reservation": {
    "id": 1,
    "status": "canceled",
    "quantity": 2
  }
}
```

---

## 📅 Agendamentos

### Listar Agendamentos
**GET** `/appointments?page=1&limit=10&patient_id=1&professional_id=1&health_unit_id=1&status=scheduled&date_time=2025-10-30`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "patient_id": 1,
      "professional_id": 1,
      "health_unit_id": 1,
      "date_time": "2025-10-30T14:00:00.000Z",
      "specialty": "Cardiologia",
      "status": "scheduled",
      "schedule_date": "10:30:00",
      "patient": {
        "id": 1,
        "users": {
          "id": 1,
          "name": "João da Silva"
        }
      },
      "professional": {
        "id": 1,
        "specialty": "Cardiologia",
        "user": {
          "id": 2,
          "name": "Dr. Carlos Silva"
        }
      },
      "health_unit": {
        "id": 1,
        "name": "Clínica Central"
      }
    }
  ],
  "pagination": {
    "total": 1,
    "limit": 10,
    "page": 1,
    "pages": 1
  }
}
```

---

### Obter Agendamento
**GET** `/appointments/:id`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "appointment": {
    "id": 1,
    "patient_id": 1,
    "professional_id": 1,
    "health_unit_id": 1,
    "date_time": "2025-10-30T14:00:00.000Z",
    "specialty": "Cardiologia",
    "status": "scheduled",
    "schedule_date": "10:30:00",
    "patient": {
      "id": 1,
      "users": {
        "id": 1,
        "name": "João da Silva"
      }
    },
    "professional": {
      "id": 1,
      "specialty": "Cardiologia",
      "user": {
        "id": 2,
        "name": "Dr. Carlos Silva"
      }
    },
    "health_unit": {
      "id": 1,
      "name": "Clínica Central"
    }
  }
}
```

---

### Criar Agendamento (Profissional/Admin)
**POST** `/appointments`

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "patient_id": 1,
  "professional_id": 1,
  "health_unit_id": 1,
  "date_time": "2025-10-30T14:00:00Z",
  "specialty": "Cardiologia",
  "status": "scheduled"
}
```

**Response (201):**
```json
{
  "appointment": {
    "id": 1,
    "patient_id": 1,
    "professional_id": 1,
    "health_unit_id": 1,
    "date_time": "2025-10-30T14:00:00.000Z",
    "specialty": "Cardiologia",
    "status": "scheduled",
    "patient": {
      "id": 1,
      "users": {
        "id": 1,
        "name": "João da Silva"
      }
    },
    "professional": {
      "id": 1,
      "specialty": "Cardiologia",
      "user": {
        "id": 2,
        "name": "Dr. Carlos Silva"
      }
    }
  }
}
```

---

### Atualizar Agendamento (Profissional/Admin)
**PUT** `/appointments/:id`

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "date_time": "2025-10-31T14:00:00Z",
  "status": "scheduled"
}
```

**Status válidos:** `scheduled`, `canceled`, `completed`

**Response (200):**
```json
{
  "appointment": {
    "id": 1,
    "date_time": "2025-10-31T14:00:00.000Z",
    "status": "scheduled"
  }
}
```

---

### Cancelar Agendamento (Admin)
**DELETE** `/appointments/:id`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "message": "Agendamento cancelado com sucesso",
  "appointment": {
    "id": 1,
    "status": "canceled"
  }
}
```

---

## 📋 Registros Médicos

### Listar Registros Médicos
**GET** `/medical_records?page=1&limit=10`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "appointment_id": 1,
      "record_date": "2025-10-30",
      "observations": "Paciente com pressão alta",
      "prescribed_medications": "Losartana 50mg",
      "requested_exams": "Eletrocardiograma",
      "disease_history": "Hipertensão",
      "allergies": "Penicilina",
      "treatment_plan": "Acompanhamento mensal"
    }
  ],
  "total": 1,
  "limit": 10,
  "page": 1,
  "pages": 1
}
```

---

### Obter Registros por Paciente
**GET** `/medical_records/patient/:patient_id?page=1&limit=10`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "appointment_id": 1,
      "record_date": "2025-10-30",
      "observations": "Paciente com pressão alta",
      "prescribed_medications": "Losartana 50mg",
      "requested_exams": "Eletrocardiograma",
      "disease_history": "Hipertensão",
      "allergies": "Penicilina"
    }
  ],
  "total": 1,
  "limit": 10,
  "page": 1,
  "pages": 1
}
```

---

### Obter Registro Médico
**GET** `/medical_records/:id`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "medical_record": {
    "id": 1,
    "appointment_id": 1,
    "record_date": "2025-10-30",
    "observations": "Paciente com pressão alta",
    "prescribed_medications": "Losartana 50mg",
    "requested_exams": "Eletrocardiograma",
    "disease_history": "Hipertensão",
    "allergies": "Penicilina",
    "treatment_plan": "Acompanhamento mensal"
  }
}
```

---

### Criar Registro Médico (Profissional/Admin)
**POST** `/medical_records`

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "appointment_id": 1,
  "record_date": "2025-10-30",
  "observations": "Paciente com pressão alta",
  "prescribed_medications": "Losartana 50mg",
  "requested_exams": "Eletrocardiograma",
  "disease_history": "Hipertensão",
  "allergies": "Penicilina",
  "treatment_plan": "Acompanhamento mensal"
}
```

**Response (201):**
```json
{
  "medical_record": {
    "id": 1,
    "appointment_id": 1,
    "record_date": "2025-10-30",
    "observations": "Paciente com pressão alta",
    "prescribed_medications": "Losartana 50mg",
    "requested_exams": "Eletrocardiograma",
    "disease_history": "Hipertensão",
    "allergies": "Penicilina",
    "treatment_plan": "Acompanhamento mensal"
  }
}
```

---

### Atualizar Registro Médico (Profissional/Admin)
**PUT** `/medical_records/:id`

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "observations": "Paciente com pressão alta - controlada",
  "prescribed_medications": "Losartana 50mg - continuar"
}
```

**Response (200):**
```json
{
  "medical_record": {
    "id": 1,
    "appointment_id": 1,
    "observations": "Paciente com pressão alta - controlada",
    "prescribed_medications": "Losartana 50mg - continuar"
  }
}
```

---

### Deletar Registro Médico (Admin)
**DELETE** `/medical_records/:id`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "message": "Registro médico removido com sucesso"
}
```

---

## 🔗 Encaminhamentos

### Listar Encaminhamentos (Profissional/Admin)
**GET** `/referrals?page=1&limit=10`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "data": [
    {
    "id": 1,
	"patient_id": 5,
	"from_professional_id": 5,
	"to_specialty": "Cardiologia",
	"notes": "Paciente com histórico de hipertensão. Solicito avaliação cardiológica.",
	"status": "used",
	"valid_until": "2026-01-15T00:00:00.000Z",
	"appointment_id": 6
    }
  ],
  "pagination": {
    "total": 1,
    "limit": 10,
    "page": 1,
    "pages": 1
  }
}
```

---

### Obter Encaminhamento (Profissional/Admin)
**GET** `/referrals/:id`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "referral": {
	"id": 2,
	"patient_id": 6,
	"from_professional_id": 1,
	"to_specialty": "Cardiologia",
	"notes": "Paciente com muito amor no coração. Solicito avaliação cardiológica.",
	"status": "used",
	"valid_until": "2026-01-15T00:00:00.000Z",
	"appointment_id": 8
  }
}
```

---

### Criar Encaminhamento (Profissional/Admin)
**POST** `/referrals`

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "patient_id": 1,
  "to_specialty": "Cardiologia",
  "from_professional_id": 1,
  "reason": "Avaliação cardiológica completa",
  "valid_until": "2025-12-29",
  "notes": "Urgente"
}
```

**Response (201):**
```json
{
  "referral": {
    "id": 1,
    "patient_id": 1,
    "to_specialty": "Cardiologia",
    "from_professional_id": 1,
    "status": "approved",
    "reason": "Avaliação cardiológica completa",
    "issued_at": "2025-10-29",
    "valid_until": "2025-12-29",
    "notes": "Urgente"
  }
}
```

---

### Atualizar Encaminhamento (Profissional/Admin)
**PUT** `/referrals/:id`

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "status": "used",
  "notes": "Consulta realizada com sucesso"
}
```

**Status válidos:** `approved`, `used`, `rejected`, `expired`

**Response (200):**
```json
{
  "referral": {
    "id": 1,
    "patient_id": 1,
    "to_specialty": "Cardiologia",
    "status": "used",
    "notes": "Consulta realizada com sucesso"
  }
}
```