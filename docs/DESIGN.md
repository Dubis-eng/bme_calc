# 🎨 BME Calc — Design System (Studio Dark)

> **Versão 1.0** | Fonte de verdade do sistema de design visual da aplicação.
> Toda implementação CSS, componente e tema deve derivar dos tokens definidos aqui.

---

## 🎨 Paleta de Cores

### Filosofia
O tema **Studio Dark** é baseado em tons profundos navy/slate com destaques esmeralda e âmbar. Cores definidas em HSL para facilitar interpolações e variações de opacidade.

### Tokens Principais

| Token              | Hex        | HSL                 | Uso                            |
|--------------------|------------|---------------------|--------------------------------|
| `--bme-bg-primary` | `#0a0f1a`  | `220 40% 7%`        | Fundo principal do app         |
| `--bme-bg-secondary` | `#0f172a` | `222 38% 11%`      | Fundo secundário / sidebar     |
| `--bme-bg-card`    | `#131e35`  | `221 36% 15%`       | Fundo de cards e painéis       |
| `--bme-bg-surface` | `#1a2744`  | `220 34% 19%`       | Superfície elevada             |
| `--bme-border`     | `rgba(99,179,237,0.12)` | —    | Borda padrão (sutil)           |

### Cores de Acento

| Token           | Hex        | Uso                                  |
|-----------------|------------|--------------------------------------|
| `--bme-teal`    | `#14b8a6`  | Destaque primário, CTA               |
| `--bme-cyan`    | `#06b6d4`  | Degrade com teal, acento secundário  |
| `--bme-emerald` | `#10b981`  | Sucesso, badges OK                   |
| `--bme-amber`   | `#f59e0b`  | Inputs editáveis, alertas de atenção |
| `--bme-rose`    | `#f43f5e`  | Erros e estados críticos             |

> **Cores Banidas (Maestro UI)**: `violet`, `indigo`, `purple` — proibidos pelas diretrizes de paleta.

---

## 🔤 Tipografia

| Família            | Uso                                       | font-feature-settings             |
|--------------------|-------------------------------------------|-----------------------------------|
| **Inter Variable** | Texto UI, labels, descrições              | `cv02, cv03, cv04, cv11`          |
| **JetBrains Mono** | IDs de variáveis, fórmulas, valores numéricos | `tnum 1` (números tabulares)  |

> Todos os valores numéricos (resultados de cálculo) devem usar `font-feature-settings: "tnum" 1` via classe `.tabular-nums`.

---

## 🏔️ Sistema de Elevação (3 Camadas)

| Nível    | Background     | Box-Shadow                            | Uso                       |
|----------|----------------|---------------------------------------|---------------------------|
| Camada 0 | `#0a0f1a`      | nenhuma                               | Fundo base da página      |
| Camada 1 | `#131e35`+blur | `0 4px 24px rgba(0,0,0,0.4)`         | Cards e painéis           |
| Camada 2 | `#1a2744`      | `0 8px 32px rgba(0,0,0,0.5)`         | Menus flutuantes, hover   |

---

## 📋 Estados de Campo (INPUT / OUTPUT / CONSTANT)

| Tipo       | Borda             | Fundo            | Texto         | readOnly | Regra                        |
|------------|-------------------|------------------|---------------|----------|------------------------------|
| `INPUT`    | âmbar `#f59e0b`   | `slate-800/80`   | `slate-200`   | false    | Campo editável pelo usuário  |
| `CENARIO`  | âmbar claro       | `slate-800/80`   | `slate-200`   | false    | Premissa do cenário          |
| `OUTPUT`   | `slate-700/60`    | transparente     | `slate-200`   | true     | Resultado de fórmula         |
| `DERIVADA` | `cyan-700/40`     | transparente     | `cyan-400`    | true     | Derivação calculada          |
| `CONSTANT` | `slate-800/40`    | `slate-900/60`   | `slate-500`   | true     | Constante do sistema         |

---

## 🔆 Utilidades CSS Globais

### `.studio-surface`
Superfície elevada com backdrop blur para menus flutuantes.
```css
background: linear-gradient(135deg, rgba(26,39,68,0.95), rgba(19,30,53,0.98));
border: 1px solid rgba(99,179,237,0.18);
border-radius: 12px;
backdrop-filter: blur(16px);
box-shadow: 0 8px 32px rgba(0,0,0,0.5);
```

### `.glow-primary`
Efeito glow teal para CTAs e botões primários.
```css
box-shadow: 0 0 20px rgba(20,184,166,0.25), 0 0 40px rgba(20,184,166,0.10);
transition: box-shadow 0.3s ease;
```

### `.label-eyebrow`
Label estilo eyebrow para títulos de seções.
```css
font-size: 9px;
font-weight: 700;
text-transform: uppercase;
letter-spacing: 0.1em;
color: #475569;
```

### `.var-row-highlight`
Destaque de linha selecionada com barra lateral esmeralda.
```css
background: rgba(20,184,166,0.06);
box-shadow: inset 3px 0 0 hsl(172 66% 50%);
```

---

## 🧩 Padrões de Componentes

### Badges de Tipo de Variável (`TYPE_BADGE`)
- `INPUT` → fundo esmeralda translúcido, texto esmeralda
- `CENARIO` → fundo azul translúcido, texto azul
- `DERIVADA` → fundo cyan translúcido, texto cyan
- `OUTPUT` → fundo teal translúcido, texto teal

### Badges de Erro (`ERROR_BADGE`)
- `DIV_BY_ZERO` → fundo rose, texto rose
- `MISSING_VAR` → fundo âmbar, texto âmbar

### Botão Primário (`.btn-primary`)
Gradiente `teal-600 → cyan-600` com hover clareado. Sombra com glow teal no hover.

---

## 📎 Referências

- [styles/index.css](../frontend/src/styles/index.css) — Tokens CSS e componentes
- [styles/design-system.tsx](../frontend/src/styles/design-system.tsx) — Constantes React
- [tailwind.config.js](../frontend/tailwind.config.js) — Tokens Tailwind customizados
- [AUDIT_RULES.md](AUDIT_RULES.md) — Regras de paleta banida e conformidade visual
