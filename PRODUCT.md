# Product Truth — CarcinoGestão

## Platform
web

## Primary User
Produtor rural, técnico em aquicultura, engenheiro de pesca ou consultor de campo em fazendas de carcinicultura (cultivo de camarão marinho *Litopenaeus vannamei*). O usuário frequentemente opera o aplicativo no campo (à beira dos viveiros, sob luz solar direta, em smartphones e tablets) e no escritório da fazenda (para conferência de relatórios, exportação de PDFs e planejamento de ciclos).

## Core Job
Gerenciar com agilidade e precisão técnica o ciclo completo de cultivo:
1. **Cadastro e Monitoramento de Viveiros**: área, profundidade, densidade de estocagem, dias de cultivo (DOC) e status operacional.
2. **Biometria e Curva de Crescimento**: registro de peso médio (g), cálculo automático de ganho de peso diário (GPD), biomassa estimada, fator de conversão alimentar (FCA) e projeção de data de despesca.
3. **Monitoramento de Qualidade da Água**: medições periódicas de oxigênio dissolvido (OD), temperatura, pH, salinidade, alcalinidade, nitrito (com limiar dinâmico que escala conforme a salinidade), amônia total e metais de poço profundo (ferro e manganês).
4. **Calculadoras Zootécnicas Especializadas**:
   - Arraçoamento diário com base em tabelas de fabricantes nacionais (ADM, Guabi, AquaNutri).
   - Biorremediação com probióticos de solo e coluna de água (preparo, manutenção e choque para H2S).
   - Correção iônica para águas de baixa salinidade (cálcio, magnésio, potássio).
   - Dimensionamento de aeração mecânica por biomassa e oxigênio.
   - Bioflocos (relação Carbono:Nitrogênio e cálculo de melaço).
   - Calibre comercial e custo estimado de despesca.

## Operating Context
- **100% Local e Offline-First**: O app opera sem dependência de internet ou servidor remoto, utilizando Dexie.js (IndexedDB). Os dados da fazenda ficam salvos com segurança estritamente no aparelho do usuário.
- **Ambiente de Campo (Solar e Rústico)**: Requer contraste visual rigoroso (≥ 4.5:1), superfícies limpas sem excesso de camadas transparentes artificiais, tipografia nítida, botões táteis largos (mínimo 44px de alvo de toque) e números em fonte tabular (`tabular-nums`) para leitura instantânea de métricas de campo.
- **Responsividade Total (320px a 1440px)**: Sem transbordamento horizontal, com navegação fluida em telas mobile com safe-area inferior e expansão natural em desktop.

## Meaningful Differentiator
Um sistema zootécnico feito para a lida real da carcinicultura, sem o aspecto genérico de templates de IA ("AI slop" com roxos descontextualizados, excesso de cards idênticos ou gradientes vazios). A linguagem visual deve refletir **precisão zootécnica e tecnologia costeira sustentável**: verde costeiro profundo (mangue/estuário), azul marinho límpido, areia mineral e toques vibrantes de alerta técnico.
