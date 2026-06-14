# Tarefa 7.1: Criação do .gitignore e Boas Práticas

## Descrição
Criar o arquivo `.gitignore` na raiz do projeto para evitar o envio de arquivos desnecessários, sensíveis, ambientes virtuais e bancos de dados para o GitHub, seguindo as respostas da etapa de Discovery.

## Arquivos a Serem Ignorados
- **Diretório do Agent**: `.agent/` (e todo seu conteúdo local/volátil).
- **Ambiente Virtual e Caches Python**: `backend/.venv/`, `__pycache__/`, `.pytest_cache/`, `*.pyc`, `*.pyo`, `*.pyd`.
- **Node.js / React Frontend**: `node_modules/`, `dist/`, `build/`, `npm-debug.log*`, `yarn-debug.log*`, `yarn-error.log*`.
- **Bancos de Dados & Dumps Locais**: `*.db`, `*.sqlite`, `*.sql` (incluindo `test.db` e `backup_cenarios.sql`).
- **Segurança (Variáveis de Ambiente)**: `.env`, `.env.local`, `.env.development.local`, `.env.test.local`, `.env.production.local`.
- **Arquivos de Sistema/IDE**: `.vscode/`, `.idea/`, `Thumbs.db`, `.DS_Store`.

## Critérios de Aceitação
- O arquivo `.gitignore` deve estar localizado na raiz do projeto (`/`).
- O comando `git status` não deve mais listar arquivos sensíveis, dumps sql, arquivos `.agent/` ou bancos SQLite não versionados.
- Nenhuma regra deve quebrar os arquivos de código-fonte necessários para o build.
