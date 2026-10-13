// Serviço de cálculo zootécnico e dosagens de probióticos de solo / biorremediação
// para cultivo de Litopenaeus vannamei.

import { DADOS_PROBIOTICOS_SOLO } from "../data/probioticosSolo.js";

/**
 * Calcula a dosagem e o protocolo de biofermentação/aplicação do probiótico de solo.
 *
 * @param {object} params
 * @param {number} params.areaM2 - Área do viveiro em metros quadrados
 * @param {string} params.finalidade - 'manutencao' | 'choque' | 'preparo'
 * @param {string} params.nivelLodo - 'leve' | 'moderado' | 'severo'
 * @param {boolean} params.modoAtivado - se true, calcula biofermentação com melaço e aeração
 * @param {boolean} params.temCheiroH2S - presença de cheiro de ovo podre / gás sulfídrico
 * @returns {object} Resultado detalhado do manejo de solo
 */
export function calcularManejoProbioticoSolo({
  areaM2 = 10000,
  finalidade = "manutencao",
  nivelLodo = "moderado",
  modoAtivado = true,
  temCheiroH2S = false
} = {}) {
  const area = Math.max(0, Number(areaM2) || 0);
  const areaHa = area / 10000;

  let doseBaseKgHa = 1.0;
  let frequencia = "Semanal";
  let diasAplicacao = 1;
  let recomendacaoManejo = "";

  if (finalidade === "preparo") {
    doseBaseKgHa = nivelLodo === "severo" ? 8.0 : nivelLodo === "moderado" ? 6.0 : 4.0;
    frequencia = "Aplicação única no preparo (primeira lâmina d'água de 15 a 20 cm)";
    diasAplicacao = 1;
    recomendacaoManejo = "Aplicar 3 a 5 dias antes de completar o enchimento e estocar as pós-larvas. O probiótico coloniza o sedimento virgem e previne blooms de bactérias indesejáveis.";
  } else if (finalidade === "choque" || temCheiroH2S || nivelLodo === "severo") {
    doseBaseKgHa = temCheiroH2S ? 2.5 : nivelLodo === "severo" ? 2.0 : 1.5;
    frequencia = "Diário durante 3 dias consecutivos";
    diasAplicacao = 3;
    recomendacaoManejo = "Tratamento de choque para colapso de fundo e neutralização de H2S. Aplicar preferencialmente às 09h00 com aeradores ligados para máxima circulação.";
  } else {
    // Manutenção preventiva semanal
    doseBaseKgHa = nivelLodo === "moderado" ? 1.0 : 0.6;
    frequencia = "1x por semana";
    diasAplicacao = 1;
    recomendacaoManejo = "Aplicação semanal de rotina. Concentre 60% da calda ativada nos alimentadores e comedouros onde há maior deposição de sobras de ração.";
  }

  const doseDiariaKg = Number((doseBaseKgHa * areaHa).toFixed(2));
  const doseTotalCicloTratamentoKg = Number((doseDiariaKg * diasAplicacao).toFixed(2));

  // Protocolo de ativação / biofermentação (se ativado)
  const melacoKg = modoAtivado ? Number((doseDiariaKg * 1.2).toFixed(2)) : 0;
  const aguaAtivacaoL = modoAtivado ? Math.round(doseDiariaKg * 30) : 0;
  const tempoAeracaoHoras = modoAtivado ? 18 : 0; // média 12 a 24h

  const avisos = [];

  if (temCheiroH2S) {
    avisos.push({
      tipo: "critico",
      texto: "Alerta Crítico: O odor de ovo podre indica gás sulfídrico (H2S) livre no sedimento. Reduza imediatamente o arraçoamento em 30% a 50% por 48 horas e mantenha aeração noturna máxima."
    });
  }

  if (nivelLodo === "severo") {
    avisos.push({
      tipo: "alerta",
      texto: "Acúmulo severo de lodo preto: Realize raspagem ou aplicação direcionada da calda de Bacillus nos pontos mortos de circulação e ao redor das bandejas."
    });
  }

  if (modoAtivado) {
    avisos.push({
      tipo: "sucesso",
      texto: "A ativação prévia com melaço e aeração multiplica a contagem bacteriana de 10^9 para até 10^11 UFC/mL, reduzindo em até 50% o custo por hectare em relação à aplicação seca."
    });
  } else {
    avisos.push({
      tipo: "info",
      texto: "Aplicação direta em pó: Dissolva o pó em baldes de água do próprio viveiro por 30 minutos antes de espalhar."
    });
  }

  return {
    areaM2: area,
    areaHa: Number(areaHa.toFixed(2)),
    finalidade,
    nivelLodo,
    temCheiroH2S,
    modoAtivado,
    doseBaseKgHa,
    doseDiariaKg,
    diasAplicacao,
    doseTotalCicloTratamentoKg,
    frequencia,
    melacoKg,
    aguaAtivacaoL,
    tempoAeracaoHoras,
    recomendacaoManejo,
    avisos
  };
}
