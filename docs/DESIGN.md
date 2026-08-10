# 🎨 BME Calc — Design System (Pure White & High Contrast Black)

> **Versão 2.0** | Fonte de verdade do sistema de design visual da aplicação.
> Toda implementação CSS, componente e tema deve derivar dos tokens e diretrizes definidos aqui.

---

## 🎨 Paleta de Cores e Filosofia Visual

### Filosofia
O design system **Pure White & High Contrast Black** prioriza nítidez máxima, ergonomia visual e legibilidade profissional em ambiente corporativo. 
Utiliza fundo branco puro (`#FFFFFF`), cartões em tom de superfície limpa, bordas estruturadas em tom de ardósia/slate e **tipografia em preto puro em negrito (`#000000` / `font-bold text-black`)**.

### Tokens Principais

| Token                | Hex / Classe Tailwind | Uso                                               |
|----------------------|-----------------------|---------------------------------------------------|
| `--bme-bg-primary`   | `#ffffff` / `bg-white`| Fundo principal das páginas, tabelas e modais     |
| `--bme-bg-secondary` | `#f8fafc` / `bg-slate-50` | Fundo secundário, cartões de agrupamento e barras |
| `--bme-bg-surface`   | `#f1f5f9` / `bg-slate-100` | Superfície elevada para hovers e cabeçalhos     |
| `--bme-border`       | `#cbd5e1` / `border-slate-300` | Borda estruturada de alta definição              |
| `--bme-text-primary` | `#000000` / `text-black font-bold` | Texto principal, rótulos, IDs e valores numéricos |

### Cores de Acento e Badges

| Token           | Hex        | Uso                                                        |
|-----------------|------------|------------------------------------------------------------|
| `--bme-teal`    | `#0f766e`  | Destaque primário, botões principais de ação (Teal 700)   |
| `--bme-amber`   | `#b45309`  | Destaque de variáveis editáveis, alertas e Busca de Metas  |
| `--bme-emerald` | `#047857`  | Status OK, confirmações e variáveis de saída (OUTPUT)      |
| `--bme-red`     | `#b91c1c`  | Erros, ações destrutivas (Excluir) e avisos críticos       |

---

## 🔤 Tipografia

| Família            | Uso                                           | Estilo Predominante                |
|--------------------|-----------------------------------------------|------------------------------------|
| **Inter Variable** | Interfaces, botões, modais, rótulos e tabelas | `font-bold text-black` (Negrito)   |
| **JetBrains Mono** | IDs de variáveis, códigos de fórmulas         | `font-mono font-bold text-black`   |

> **Regra de Ouro da Tipografia**: Nenhum rótulo, título, ID ou valor numérico pode ter tom cinza desbotado ou ilegível. Todos usam **negrito de alto contraste (`font-bold text-black`)**.

---

## 💬 Balões de Tooltip & Ajuda (`Tooltip.tsx`)

- **Portal de Tooltip**: Renderizado via React Portal com fundo branco puro (`bg-white`), bordas em `border-slate-300`, sombra tridimensional elevada (`shadow-2xl`) e tipografia nítida.
- **Ajuda de Campo (`FieldTooltip`)**: Ícone de interrogação com fundo claro, borda nítida e texto em preto negrito (`text-black font-bold border-slate-400 bg-slate-100 hover:bg-teal-600 hover:text-white`).

---

## 📋 Estados de Campo (INPUT / OUTPUT / CENARIO / CONSTANT)

| Tipo       | Borda             | Fundo          | Texto                   | Regra                                     |
|------------|-------------------|----------------|-------------------------|-------------------------------------------|
| `INPUT`    | `border-amber-300`| `bg-amber-50`  | `text-black font-bold`  | Campo editável pelo usuário (Destacado)   |
| `CENARIO`  | `border-amber-300`| `bg-amber-50`  | `text-black font-bold`  | Premissa do cenário ativo                 |
| `OUTPUT`   | `border-slate-300`| `bg-white`     | `text-black font-bold`  | Resultado calculado pelo motor AST        |
| `CONSTANT` | `border-slate-300`| `bg-slate-100` | `text-black font-bold`  | Constante global do sistema               |

---

## 📊 Plano de Safra & Modais
- **Plano de Safra (`HarvestPlanTable.tsx`)**: Colunas fixas e mensais com fundo branco puro, cabeçalhos em negrito e acúmulo mensal destacado em tom Teal suave (`bg-teal-50 text-teal-950 font-bold`).
- **Modais e Submodais**: Todos os modais possuem cabeçalho em `bg-slate-900 text-white` para contraste institucional, corpo em `bg-white text-black` e rodapé em `bg-slate-50 border-t border-slate-300`.
