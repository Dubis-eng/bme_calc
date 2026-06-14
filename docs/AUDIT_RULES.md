# 📋 Diretrizes de Auditoria Ativa e Memória de Design

Este arquivo centraliza as regras de boas práticas, restrições e comandos de auditoria do ecossistema BME Calc. O agente DEVE consultar este arquivo no início de cada ciclo para evitar regressões estruturais.

---

## 🎨 Diretrizes do Design System (Maestro UI)
1. **Paleta de Cores**:
   * **Cores Permitidas**: Gradientes e elementos de destaque baseados em `teal`, `cyan` e `emerald`.
   * **Cores Banidas**: Tons de roxo (`violet`, `indigo`) são estritamente proibidos pelas regras visuais Maestro UI.
2. **Tipografia e Estilo**:
   * Bordas finas e suaves (`border-slate-200/60`).
   * Sombras discretas (`shadow-sm`) e fundos claros harmoniosos (`bg-slate-50`).
   * Badges de status com fundos pastéis contrastantes para visibilidade.

---

## ♿ Requisitos de Acessibilidade (WCAG)
1. **Associação de Controles**: Todos os campos de input, selects e inputs de dados na tabela devem possuir tags `<label>` associadas de forma implícita ou explícita.
2. **Atributos Descritivos**: Uso obrigatório de `aria-label` descritivos em todos os controles interativos (ex: `aria-label="Valor para H10"`).
3. **Navegação Física**:
   * Links de escape presentes no topo da página (ex: `skip-to-main-content`).
   * Botões e links devem responder a gatilhos de teclado (`onKeyDown` para tecla `Enter`).

---

## 🛡️ Regras de Código Limpo e Densidade
1. **Tamanho Máximo de Arquivos (P0)**: Nenhum arquivo de código-fonte (`.py`, `.tsx`, `.ts`) deve exceder **300 linhas físicas** de código.
2. **Tipagem TypeScript Estrita (P8.1)**: O uso do tipo `any` é estritamente proibido. Todas as variáveis, payloads e retornos devem ter tipos definidos ou casts seguros via interfaces.
3. **Guard Clauses**: Evitar aninhamento de ifs superior a 3 níveis usando retornos rápidos para simplificar a legibilidade.

---

## 🔍 Comandos de Auditoria Mandatórios

Para validar se o projeto está em conformidade com as regras antes de qualquer commit ou deploy, execute:

### 1. Auditoria Local Rápidas
```bash
python .agent/scripts/checklist.py .
```

### 2. Suite Completa de Qualidade (E2E, Performance, Acessibilidade)
```bash
python .agent/scripts/verify_all.py . --url http://localhost:3000
```
> **Nota**: Garanta que tanto o frontend quanto o backend estejam rodando localmente antes de disparar a suite completa.
