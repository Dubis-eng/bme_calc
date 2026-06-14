# BME Calc — Calculadora de Balanço de Massa e Energia

BME Calc é uma plataforma corporativa avançada para modelagem física, cálculo de balanço de massa e energia, otimização por busca de metas (Goal Seek) e governança de cenários industriais.

---

## 🚀 Tecnologias Principais
* **Backend**: FastAPI (Python), SQLModel (ORM), Uvicorn, NetworkX (grafo de dependências), Scipy (solver de otimização).
* **Frontend**: React (TypeScript), TailwindCSS/Vanilla CSS, Axios.
* **Banco de Dados**: PostgreSQL 15 (Docker) com colunas JSONB.
* **Relatórios**: ReportLab (PDF) e openpyxl (Excel).

---

## 🛠️ Configuração e Execução

### Opção 1: Via Docker Compose (Recomendado)
Para subir todo o ecossistema (PostgreSQL, FastAPI Backend e React Frontend):
```bash
docker-compose up --build
```
* **Frontend**: [http://localhost:3000](http://localhost:3000)
* **Backend (API)**: [http://localhost:8000](http://localhost:8000)

### Opção 2: Execução Local para Desenvolvimento

#### 1. Backend
Navegue para a pasta `backend`, ative o ambiente virtual e instale as dependências:
```bash
cd backend
.venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

#### 2. Frontend
Navegue para a pasta `frontend` e inicie o servidor React:
```bash
cd frontend
npm install
npm start
```

---

## 🧪 Suíte de Testes e Homologação

### Executar Testes Unitários e de Integração
Navegue para a pasta `backend` com o ambiente virtual ativo e execute:
```bash
python -m pytest test_engine.py test_scenarios.py -v
```

### Executar Verificação e Auditoria de Qualidade
Para rodar a suite de qualidade do Antigravity Kit (segurança, linter, acessibilidade, performance e testes):
```bash
python .agent/scripts/checklist.py .
python .agent/scripts/verify_all.py . --url http://localhost:3000
```

---

## 📂 Organização da Documentação
Toda a documentação técnica e de governança do projeto está centralizada no diretório [docs/](file:///c:/Users/Dubis/Documents/GitHub/bme_calc/docs/):
* [docs/README.md](file:///c:/Users/Dubis/Documents/GitHub/bme_calc/docs/README.md): Mapa de Ingestão e Status de Funcionalidades.
* [docs/ARCHITECTURE.md](file:///c:/Users/Dubis/Documents/GitHub/bme_calc/docs/ARCHITECTURE.md): Detalhamento da arquitetura de software e estrutura de diretórios.
* [docs/AUDIT_RULES.md](file:///c:/Users/Dubis/Documents/GitHub/bme_calc/docs/AUDIT_RULES.md): Diretrizes de design system (Maestro UI), WCAG e comandos de validação.
* [docs/changelog.md](file:///c:/Users/Dubis/Documents/GitHub/bme_calc/docs/changelog.md): Histórico de lançamentos e versões do sistema.
