# Med Dashboard - Painel Administrativo

Este é um projeto de frontend para um painel administrativo simples, focado em gerenciamento de pacientes, medicamentos, agendamentos e reservas. O painel foi construído utilizando apenas tecnologias web puras (HTML, CSS e JavaScript ES6), sem o uso de frameworks.

Este frontend se conecta a uma API de backend separada para realizar todas as operações de CRUD (Criar, Ler, Atualizar, Deletar).

## 🚀 Tecnologias Utilizadas

* **Frontend:** HTML5
* **Estilização:** CSS3 puro (sem frameworks)
* **JavaScript:** JavaScript ES6+ (Vanilla JS)
* **Requisições HTTP:** Fetch API
* **Autenticação:** JWT (salvo no `localStorage`)

## ✨ Funcionalidades

O painel administrativo cobre todas as operações essenciais de gerenciamento:

* **Autenticação:** Login e Logout seguros usando Token JWT.
* **Dashboard:** Página inicial com cartões de estatísticas principais.
* **Gestão de Usuários:**
    * Listar todos os usuários (Pacientes e Profissionais).
    * Criar novos **Profissionais** (com upload de foto).
    * Editar dados de usuários existentes.
    * Desativar (deletar) usuários.
* **Gestão de Pacientes:**
    * CRUD completo (Criar, Ler, Editar, Deletar).
    * Filtros por Nome e CPF.
* **Gestão de Medicamentos:**
    * CRUD completo (Criar, Ler, Editar, Deletar).
    * Suporte a upload de fotos (`multipart/form-data`).
* **Gestão de Agendamentos:**
    * CRUD completo (Criar, Ler, Editar Status/Data, Cancelar).
    * Filtros por Status e Data.
* **Gestão de Reservas:**
    * Listar reservas.
    * Mudar status da reserva (de `reserved` -> `ready` -> `picked_up`).
    * Cancelar reservas.
* **Inventário:**
    * Visualização de estoque por unidade.
    * Alertas visuais para estoque baixo (< 10 unidades).
* **Funcionalidades Gerais:**
    * Paginação completa em todas as tabelas.
    * Design responsivo (Mobile-first).
    * Tratamento de erros da API (ex: "Dados inválidos") exibidos no modal.

## ⚙️ Como Executar

### 1. Pré-requisitos

* A API de backend deve estar online. Este projeto está configurado no arquivo `js/api.js` para usar a API em:
    `https://med-sys-3z00.onrender.com/`
* Devido à política de CORS do navegador, você não pode simplesmente abrir o `index.html` (com `file:///...`). O projeto precisa ser servido por um servidor web local.

### 2. Executando com o Live Server (VS Code)

A forma mais fácil de rodar o projeto é utilizando a extensão [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) no Visual Studio Code.

1.  Instale a extensão "Live Server".
2.  No VS Code, clique com o botão direito no arquivo `index.html`.
3.  Selecione **"Open with Live Server"**.

Isso irá iniciar o projeto em um endereço como `http://127.0.0.1:5500/`, que tem permissão (via CORS) para acessar a API.

### 3. Acesso

Para fazer login, você precisa de uma conta de **Administrador**.

* **Importante:** Contas de administrador (`user_type: "admin"`) **não podem** ser criadas pelo frontend. Elas devem ser criadas manualmente no banco de dados do backend.