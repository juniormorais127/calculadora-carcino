---
name: CarcinoGestão
description: Sistema operacional zootécnico e de precisão para carcinicultura brasileira
colors:
  primary: "#059669"
  primary-deep: "#065f46"
  primary-surface: "#ecfdf5"
  water-deep: "#0284c7"
  water-surface: "#f0f9ff"
  alert-amber: "#d97706"
  alert-danger: "#dc2626"
  neutral-bg: "#f8fafc"
  neutral-card: "#ffffff"
  neutral-border: "#e2e8f0"
  neutral-text: "#0f172a"
  neutral-muted: "#475569"
typography:
  display:
    fontFamily: "'Outfit', system-ui, sans-serif"
    fontSize: "clamp(1.5rem, 3vw, 2.25rem)"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  title:
    fontFamily: "'Outfit', system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
  body:
    fontFamily: "'Outfit', system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  small:
    fontFamily: "'Outfit', system-ui, sans-serif"
    fontSize: "0.75rem"
  micro:
    fontFamily: "'Outfit', system-ui, sans-serif"
    fontSize: "0.6875rem"
  nano:
    fontFamily: "'Outfit', system-ui, sans-serif"
    fontSize: "0.625rem"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "10px 18px"
  button-primary-hover:
    backgroundColor: "{colors.primary-deep}"
---

# Visual Design System — CarcinoGestão

## Overview
CarcinoGestão é uma ferramenta de telemetria zootécnica de precisão para fazendas de camarão marinho (*Litopenaeus vannamei*). Seu design rejeita deliberadamente os clichês estéticos de inteligência artificial generativa ("AI slop": cartões idênticos em grade infinita, gradientes roxos/índigo descontextualizados, brilhos de neon vazios e micro-textos de baixa legibilidade sob luz solar). 

A interface é orientada a **Operação e Controle de Campo**: alto contraste sob luz do sol, leitura de métricas numéricas tabulares instantânea, hierarquia de comando clara, áreas de toque amplas e paleta costeira autêntica (verde manguezal/costeiro, azul salino límpido e areia mineral).

## Colors
- **Verde Costeiro (Primário / Biometria / Viveiros Ativos)**:
  - Base: `#059669` (Tailwind `emerald-600`)
  - Profundo / Texto escuro: `#065f46` (Tailwind `emerald-800`), `#022c22` (`emerald-950`)
  - Fundo suave / Badge: `#ecfdf5` (`emerald-50`), borda `#a7f3d0` (`emerald-200`)
- **Azul Salino / Oceânico (Qualidade da Água / OD / Oxigenação)**:
  - Base: `#0284c7` (Tailwind `sky-600`) / `#0891b2` (`cyan-600`)
  - Profundo: `#0369a1` (`sky-700`)
  - Fundo suave: `#f0f9ff` (`sky-50`), borda `#bae6fd` (`sky-200`)
- **Âmbar Estuarino (Arraçoamento / Alimentação / Bandejas)**:
  - Base: `#d97706` (Tailwind `amber-600`)
  - Profundo: `#92400e` (`amber-800`)
  - Fundo suave: `#fffbeb` (`amber-50`), borda `#fde68a` (`amber-200`)
- **Alertas Zootécnicos (Amônia Tóxica, Nitrito Crítico, Oxigênio Baixo)**:
  - Emergencial / Perigo: `#dc2626` (Tailwind `red-600`), fundo `#fef2f2`, texto `#991b1b`
  - Crítico / Atenção: `#d97706` (Tailwind `amber-600`), fundo `#fffbeb`, texto `#b45309`
- **Neutros de Campo (Legibilidade Solar)**:
  - Superfície da aplicação: `#f8fafc` (`slate-50`)
  - Cartões e painéis: `#ffffff` (`white`)
  - Bordas estruturais: `#e2e8f0` (`slate-200`)
  - Texto principal (títulos e métricas): `#0f172a` (`slate-900`) com contraste 14:1
  - Texto de apoio e unidades: `#475569` (`slate-600`)

## Typography
- **Família Tipográfica**: `Outfit`, com suporte a números tabulares (`font-variant-numeric: tabular-nums`).
- **Números e Telemetria**: Números de biometria, doses de ração, concentrações em mg/L e temperaturas sempre utilizam numerais tabulares com peso `font-bold` ou `font-black` e unidades em tamanho menor (`kg/dia`, `g`, `mg/L`, `°C`) para evitar quebras visuais e facilitar comparação imediata.
- **Hierarquia de Títulos**: Títulos fortes, concisos e sem kickers decorativos ou subtítulos supérfluos.

## Layout
- **Scaffold Central**: Max-width de 1152px (`max-w-6xl`), com espaçamento lateral fluido (`px-3.5 sm:px-6`).
- **Navegação**:
  - Desktop: Barra superior segmentada com toque tátil, badges discretos e indicador visual da aba ativa.
  - Mobile: Barra de navegação inferior ergonomicamente posicionada com safe-area padding e botões táteis (mínimo 52px de altura).
- **Substituição da "Grade de Cartões Idênticos"**: O resumo operacional é estruturado com uma barra de comando mestre destacando a biomassa ativa e necessidade de ração, seguida por indicadores de status de viveiros e alertas críticos consolidados.

## Elevation & Depth
- Sombras suaves com deslocamento sutil (`shadow-xs` / `shadow-sm`: `0 1px 3px 0 rgb(15 23 42 / 0.05)`).
- Bordas de 1px em ardósia clara (`border-slate-200`) para delimitar claramente as áreas em ambientes com reflexo de luz solar.
- Transições de toque (`active:scale-[0.98] transition-transform duration-100`).

## Shapes
- Raio de curvatura harmonizado: `rounded-2xl` (16px) para cartões operacionais e modais; `rounded-xl` (12px) para botões de ação e inputs; `rounded-full` para badges de status e pills.

## Components
- **Botões de Ação Imediata**: "+ Biometria", "+ Medição de Água", "+ Novo Viveiro" com cores sólidas distintivas, sem gradientes genéricos.
- **Entrada Numérica com Steppers**: Controles táteis (+ / -) projetados para dedos molhados e agilidade no campo, com seleção automática do texto ao focar.
- **Ícones de Domínio Próprio**: Silhuetas anatômicas de camarão (*Litopenaeus vannamei*), bandeja de arraçoamento e medidores de água com ondas reais, evitando garfos, facas e ícones abstratos.

## Do's and Don'ts
- **DO**: Usar números tabulares (`tabular-nums`) em todas as leituras de peso, ração e água.
- **DO**: Garantir contraste mínimo de 4.5:1 em todos os textos sob luz diurna.
- **DO**: Agrupar alertas por severidade biológica (emergencial > crítico > atenção).
- **DON'T**: Usar kickers ou etiquetas redundantes (ex: pílulas de "Sua produção em um só lugar") acima de títulos de seção.
- **DON'T**: Usar gradientes arroxeados/índigo (`indigo`, `violet`) ou ícones mágicos (`Sparkles`) em calculadoras zootécnicas.
- **DON'T**: Empilhar cartões repetitivos com o mesmo tamanho e peso visual para dados de naturezas completamente distintas.
