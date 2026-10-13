import { TABELA_ALIMENTACAO_VANNAMEI, CALAGEM_SOLO_TABELA } from "../data/carcinoData.js";

/**
 * Calcula biomassa atual estimada em kg
 */
export function calculateBiomass(quantidadeCamaroes, pesoMedioG) {
  if (!quantidadeCamaroes || !pesoMedioG || quantidadeCamaroes <= 0 || pesoMedioG <= 0) return 0;
  return Number(((quantidadeCamaroes * pesoMedioG) / 1000).toFixed(2));
}

/**
 * Obtém a taxa recomendada de alimentação (% da biomassa/dia) pelo peso médio do camarão
 */
export function getFeedingRateInfo(pesoMedioG) {
  const p = Number(pesoMedioG) || 0;
  for (const faixa of TABELA_ALIMENTACAO_VANNAMEI) {
    if (p >= faixa.minPeso && p < faixa.maxPeso) {
      return faixa;
    }
  }
  // Se for maior que 40g
  return TABELA_ALIMENTACAO_VANNAMEI[TABELA_ALIMENTACAO_VANNAMEI.length - 1];
}

/**
 * Cálculo detalhado de ração diária com fatores de correção de campo
 */
export function calculateDailyFeed({
  biomassaKg,
  pesoMedioG,
  temperaturaC = 29,
  oxigenioMgL = 5.0,
  ajusteBandejaPercent = 0,
  tratosCustomizados = null
}) {
  const biomassa = Number(biomassaKg) || 0;
  const peso = Number(pesoMedioG) || 0;
  const temp = Number(temperaturaC) || 29;
  const o2 = Number(oxigenioMgL) || 5.0;
  const ajusteBandeja = Number(ajusteBandejaPercent) || 0;

  if (biomassa <= 0 || peso <= 0) {
    return {
      racaoBaseKg: 0,
      taxaPercentual: 0,
      fatorTemperatura: 1.0,
      fatorOxigenio: 1.0,
      ajusteBandejaKg: 0,
      racaoFinalKg: 0,
      numeroTratos: 3,
      racaoPorTratoKg: 0,
      avisos: ["Informe a biomassa e o peso médio para calcular a ração."]
    };
  }

  const infoFaixa = getFeedingRateInfo(peso);
  const taxaPadrao = infoFaixa.taxaPadrao;
  const racaoBaseKg = (biomassa * taxaPadrao) / 100;

  // Ajuste por Temperatura da Água
  let fatorTemperatura = 1.0;
  const avisos = [];

  if (temp < 22) {
    fatorTemperatura = 0.6;
    avisos.push("Temperatura fria (< 22°C): metabolismo reduzido severamente (-40% de ração).");
  } else if (temp < 25) {
    fatorTemperatura = 0.8;
    avisos.push("Temperatura amena (22-25°C): apetite reduzido (-20% de ração).");
  } else if (temp >= 25 && temp <= 32) {
    fatorTemperatura = 1.0; // Faixa perfeita
  } else if (temp > 33) {
    fatorTemperatura = 0.85;
    avisos.push("Temperatura muito alta (> 33°C): estresse térmico, suspender sobra de ração.");
  }

  // Ajuste por Oxigênio Dissolvido
  let fatorOxigenio = 1.0;
  if (o2 < 2.5) {
    fatorOxigenio = 0.0;
    avisos.push("ALERTA CRÍTICO: Oxigênio < 2.5 mg/L! Suspender 100% da alimentação e ligar aeração.");
  } else if (o2 < 3.5) {
    fatorOxigenio = 0.5;
    avisos.push("Oxigênio baixo (< 3.5 mg/L): cortar 50% da ração até restabelecer níveis ótimos.");
  } else if (o2 < 4.0) {
    fatorOxigenio = 0.8;
    avisos.push("Oxigênio em atenção (3.5 a 4.0 mg/L): reduzir 20% do trato.");
  }

  // Ajuste de bandejas de alimentação (-50% a +10%)
  const multiplicadorBandeja = 1 + (ajusteBandeja / 100);

  // Ração Final corrigida
  let racaoFinalKg = racaoBaseKg * fatorTemperatura * fatorOxigenio * multiplicadorBandeja;
  racaoFinalKg = Math.max(0, Number(racaoFinalKg.toFixed(2)));

  const numeroTratos = tratosCustomizados || infoFaixa.frequenciaTratos;
  const racaoPorTratoKg = numeroTratos > 0 ? Number((racaoFinalKg / numeroTratos).toFixed(2)) : 0;

  return {
    racaoBaseKg: Number(racaoBaseKg.toFixed(2)),
    taxaPercentual: taxaPadrao,
    faseCultivo: infoFaixa.fase,
    fatorTemperatura,
    fatorOxigenio,
    ajusteBandejaPercent,
    racaoFinalKg,
    numeroTratos,
    racaoPorTratoKg,
    avisos
  };
}

/**
 * Cálculo de correção de alcalinidade da água
 * Fórmula: Bicarbonato de Sódio = (Déficit em mg/L * Volume em m³ * 1.68) / 1000 (kg)
 * Cal Hidratada = (Déficit em mg/L * Volume em m³ * 0.74) / 1000 (kg)
 */
export function calculateWaterCorrection({
  volumeM3,
  alcalinidadeAtual,
  alcalinidadeMeta = 130,
  phAtual = 8.0
}) {
  const vol = Number(volumeM3) || 0;
  const atual = Number(alcalinidadeAtual) || 0;
  const meta = Number(alcalinidadeMeta) || 130;
  const ph = Number(phAtual) || 8.0;

  const deficit = Math.max(0, meta - atual);

  if (vol <= 0 || deficit === 0) {
    return {
      deficit: 0,
      bicarbonatoKg: 0,
      calHidratadaKg: 0,
      recomendacao: "Alcalinidade dentro do padrão desejado. Não requer correção no momento."
    };
  }

  const bicarbonatoKg = Number(((deficit * vol * 1.68) / 1000).toFixed(2));
  const calHidratadaKg = Number(((deficit * vol * 0.74) / 1000).toFixed(2));

  let recomendacao = "";
  if (ph >= 8.2) {
    recomendacao = "Como o pH atual é ≥ 8.2, use exclusivamente BICARBONATO DE SÓDIO. Cal hidratada pode causar pico letal de pH.";
  } else if (ph < 7.5) {
    recomendacao = "Como tanto a alcalinidade quanto o pH estão baixos, a CAL HIDRATADA pode ser usada em doses fracionadas pela manhã, ou alternada com bicarbonato.";
  } else {
    recomendacao = "Bicarbonato de sódio é a opção mais segura para tamponamento sem risco de estresse osmótico nos camarões.";
  }

  return {
    deficit,
    bicarbonatoKg,
    calHidratadaKg,
    recomendacao,
    doseMaximaDiariaKg: Number(((30 * vol * 1.68) / 1000).toFixed(2)) // Limite seguro de 30 mg/L por dia
  };
}

/**
 * Calcula a fração de amônia não-ionizada tóxica (NH3)
 * Fórmula padrão de Emerson et al.
 */
export function calculateToxicAmmonia(amoniaTotalMgL, ph, temperaturaC, salinidadePpt = 20) {
  const nat = Number(amoniaTotalMgL) || 0;
  const p = Number(ph) || 8.0;
  const temp = Number(temperaturaC) || 29;

  if (nat <= 0) {
    return { nh3: 0, porcentagemToxica: 0, status: "Normal", cor: "emerald" };
  }

  const kelvin = temp + 273.15;
  const pKa = 0.09018 + (2729.92 / kelvin);
  const fracaoToxica = 1 / (Math.pow(10, pKa - p) + 1);
  const nh3 = Number((nat * fracaoToxica).toFixed(4));
  const porcentagem = Number((fracaoToxica * 100).toFixed(2));

  let status = "Seguro / Ótimo";
  let cor = "emerald";
  let orientacao = "Níveis sob controle. Manter monitoramento regular.";

  if (nh3 >= 0.10) {
    status = "Emergência Letal";
    cor = "rose";
    orientacao = "Mortalidade iminente! Cortar ração, renovar água se possível e aplicar probióticos nitrificantes/melaço.";
  } else if (nh3 >= 0.05) {
    status = "Crítico";
    cor = "amber";
    orientacao = "Toxicidade perigosa para brânquias. Reduzir ração imediatamente e verificar alcalinidade.";
  } else if (nh3 >= 0.03) {
    status = "Alerta";
    cor = "yellow";
    orientacao = "Nível limítrofe de estresse crônico. Observar consumo nas bandejas.";
  }

  return {
    nh3,
    porcentagemToxica: porcentagem,
    status,
    cor,
    orientacao
  };
}

/**
 * Calcula necessidade de calcário para calagem de solo seco entre ciclos
 */
export function calculateSoilLiming(areaM2, phSolo) {
  const area = Number(areaM2) || 0;
  const ph = Number(phSolo) || 7.0;

  if (area <= 0) return { doseTotalKg: 0, doseKgPorHa: 0, recomendacao: "Informe a área do viveiro." };

  const areaHa = area / 10000;
  let faixa = CALAGEM_SOLO_TABELA.find(f => ph <= f.phMax) || CALAGEM_SOLO_TABELA[CALAGEM_SOLO_TABELA.length - 1];

  const doseTotalKg = Number((faixa.doseKgPorHa * areaHa).toFixed(0));

  return {
    areaHa: Number(areaHa.toFixed(2)),
    doseKgPorHa: faixa.doseKgPorHa,
    doseTotalKg,
    recomendacao: faixa.recomendacao
  };
}

/**
 * Cálculo de planejamento de povoamento e densidade
 */
export function calculateStocking({
  areaM2,
  densidadeAlvoM2,
  pesoFinalAlvoG = 14,
  sobrevivenciaEsperadaPercent = 75
}) {
  const area = Number(areaM2) || 0;
  const densidade = Number(densidadeAlvoM2) || 0;
  const pesoAlvo = Number(pesoFinalAlvoG) || 14;
  const sob = Number(sobrevivenciaEsperadaPercent) || 75;

  const totalPLs = Math.round(area * densidade);
  const camaroesEsperadosDespesca = Math.round(totalPLs * (sob / 100));
  const biomassaEsperadaKg = Number(((camaroesEsperadosDespesca * pesoAlvo) / 1000).toFixed(2));
  const areaHa = area / 10000;
  const produtividadeKgHa = areaHa > 0 ? Number((biomassaEsperadaKg / areaHa).toFixed(2)) : 0;

  return {
    totalPLs,
    camaroesEsperadosDespesca,
    biomassaEsperadaKg,
    produtividadeKgHa
  };
}
