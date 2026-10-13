// Dados de referência agronômica e zootécnica para carcinicultura (Litopenaeus vannamei)
// Fontes: EMBRAPA, ABCC, FAO e literatura técnica especializada

export const TABELA_ALIMENTACAO_VANNAMEI = [
  { minPeso: 0.0, maxPeso: 1.0, taxaMin: 12.0, taxaMax: 15.0, taxaPadrao: 13.5, frequenciaTratos: 5, fase: "Berçário / Pós-Larva" },
  { minPeso: 1.0, maxPeso: 2.0, taxaMin: 8.0, taxaMax: 10.0, taxaPadrao: 9.0, frequenciaTratos: 4, fase: "Juvenil Inicial" },
  { minPeso: 2.0, maxPeso: 5.0, taxaMin: 6.0, taxaMax: 8.0, taxaPadrao: 7.0, frequenciaTratos: 4, fase: "Juvenil Médio" },
  { minPeso: 5.0, maxPeso: 8.0, taxaMin: 5.0, taxaMax: 6.0, taxaPadrao: 5.5, frequenciaTratos: 3, fase: "Engorda Inicial" },
  { minPeso: 8.0, maxPeso: 12.0, taxaMin: 4.0, taxaMax: 5.0, taxaPadrao: 4.5, frequenciaTratos: 3, fase: "Engorda Média" },
  { minPeso: 12.0, maxPeso: 16.0, taxaMin: 3.0, taxaMax: 4.0, taxaPadrao: 3.5, frequenciaTratos: 3, fase: "Engorda Avançada" },
  { minPeso: 16.0, maxPeso: 20.0, taxaMin: 2.5, taxaMax: 3.0, taxaPadrao: 2.7, frequenciaTratos: 2, fase: "Pré-Despesca" },
  { minPeso: 20.0, maxPeso: 40.0, taxaMin: 1.8, taxaMax: 2.3, taxaPadrao: 2.0, frequenciaTratos: 2, fase: "Despesca / Comercial" },
];

export const PARAMETROS_QUALIDADE_AGUA = {
  oxigenio: {
    nome: "Oxigênio Dissolvido",
    unidade: "mg/L",
    otimoMin: 4.5,
    otimoMax: 8.0,
    alertaMin: 3.0,
    criticoMin: 2.0,
    impacto: "Abaixo de 3,5 mg/L suspender arraçoamento. Abaixo de 2,5 mg/L acionar aeração de emergência imediatamente."
  },
  temperatura: {
    nome: "Temperatura",
    unidade: "°C",
    otimoMin: 28.0,
    otimoMax: 32.0,
    alertaMin: 24.0,
    alertaMax: 34.0,
    criticoMin: 20.0,
    criticoMax: 36.0,
    impacto: "Temperaturas abaixo de 25°C reduzem o apetite em até 50%. Acima de 33°C aceleram metabolismo e consumo de oxigênio."
  },
  ph: {
    nome: "pH",
    unidade: "",
    otimoMin: 7.8,
    otimoMax: 8.5,
    alertaMin: 7.2,
    alertaMax: 8.8,
    criticoMin: 6.5,
    criticoMax: 9.2,
    impacto: "Variação diária não deve ultrapassar 0.5 unidades. pH > 8.8 potencializa toxicidade da amônia não-ionizada."
  },
  salinidade: {
    nome: "Salinidade",
    unidade: "ppt (g/L)",
    otimoMin: 15.0,
    otimoMax: 30.0,
    alertaMin: 5.0,
    alertaMax: 40.0,
    criticoMin: 1.0,
    criticoMax: 48.0,
    impacto: "Vannamei tolera de 0.5 a 45 ppt. Em baixa salinidade (< 5 ppt), o balanço de Na:K (28:1) e Mg:Ca (3:1) é mandatório."
  },
  alcalinidade: {
    nome: "Alcalinidade Total",
    unidade: "mg/L CaCO3",
    otimoMin: 120.0,
    otimoMax: 180.0,
    alertaMin: 80.0,
    criticoMin: 60.0,
    impacto: "Abaixo de 100 mg/L causa problemas de muda (troca de casca mole) e instabilidade no pH. Corrigir com Bicarbonato."
  },
  amoniaTotal: {
    nome: "Amônia Total (NAT)",
    unidade: "mg/L",
    otimoMax: 0.5,
    alertaMax: 1.5,
    criticoMax: 3.0,
    impacto: "A fração tóxica (NH3) deve ficar rigorosamente abaixo de 0.05 mg/L para evitar asfixia e mortalidade."
  },
  nitrito: {
    nome: "Nitrito (N-NO2)",
    unidade: "mg/L",
    otimoMax: 0.2,
    alertaMax: 0.8,
    criticoMax: 1.5,
    impacto: "Metahemoglobina e estresse osmótico. Em águas de salinidade baixa o nitrito é ainda mais tóxico devido à falta de cloreto."
  },
  transparencia: {
    nome: "Transparência (Secchi)",
    unidade: "cm",
    otimoMin: 30.0,
    otimoMax: 45.0,
    alertaMin: 20.0,
    alertaMax: 60.0,
    impacto: "< 25 cm indica bloom excessivo de fitoplâncton (risco de anoxia noturna). > 50 cm indica água muito clara (proliferação de algas bentônicas/cabelo)."
  }
};

export const CALAGEM_SOLO_TABELA = [
  { phMax: 5.0, doseKgPorHa: 3500, recomendacao: "Solos fortemente ácidos. Aplicar calcário dolomítico e incorporar 10-15cm." },
  { phMax: 5.5, doseKgPorHa: 2500, recomendacao: "Acidez média. Incorporar calcário dolomítico com antecedência de 15 dias." },
  { phMax: 6.0, doseKgPorHa: 1800, recomendacao: "Acidez moderada. Calcário calcítico ou dolomítico." },
  { phMax: 6.5, doseKgPorHa: 1000, recomendacao: "Levemente ácido. Manutenção preventiva de pH e reserva de cálcio." },
  { phMax: 7.0, doseKgPorHa: 500, recomendacao: "Solo neutro. Apenas manutenção leve se o histórico do viveiro exigir." },
  { phMax: 14.0, doseKgPorHa: 0, recomendacao: "Solo alcalino. Não aplicar calcário ou cal." }
];

export const AJUSTE_BANDEJAS_ALIMENTACAO = [
  { status: "Limpa (100% consumida em < 1h30)", ajustePercentual: +10, descricao: "Aumentar 10% na próxima oferta (apetite agressivo)" },
  { status: "Normal (< 5% de sobras após 2h)", ajustePercentual: 0, descricao: "Manter cálculo zootécnico sem alterações" },
  { status: "Leves sobras (10% a 20%)", ajustePercentual: -10, descricao: "Reduzir 10% no próximo trato para evitar acúmulo no fundo" },
  { status: "Sobras médias (20% a 40%)", ajustePercentual: -25, descricao: "Reduzir 25%. Checar oxigênio dissolvido e temperatura" },
  { status: "Sobras críticas (> 50%) ou ecdise massiva", ajustePercentual: -50, descricao: "Reduzir 50% ou cortar trato. Possível pico de muda ou anoxia" }
];
