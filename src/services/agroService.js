// Serviços agronômicos e zootécnicos complementares ao calculatorService.
// Mantido separado para não misturar os cálculos de manejo diário (ração, água,
// calagem) com os cálculos de planejamento, classificação comercial e índices.
//
// Convenções adotadas em todo o arquivo:
//  - Entradas sempre numéricas em unidades do campo (kg, g, m², m³, mg/L, %).
//  - Funções puras: sem acesso a banco, sem efeitos colaterais.
//  - Valores impossíveis ou ausentes retornam zero/estado neutro em vez de NaN.

import {
  TABELA_CALIBRE_MERCADO,
  TABELA_GRANULOMETRIA_RACAO,
  CURVA_CRESCIMENTO_VANNAMEI,
  PARAMETROS_BALANCO_IONICO,
  PRODUTOS_CORRECAO_IONICA,
  FONTES_CARBONO_BFT,
  SISTEMAS_CULTIVO,
  TABELA_AERACAO_POR_DENSIDADE,
  TIPOS_AERADOR,
  METAS_INDICES_ZOOTECNICOS
} from "../data/carcinoData.js";

// Constantes de conversão
const LIBRA_EM_KG = 0.45359237;
const NITROGENIO_EM_PROTEINA = 6.25; // fator clássico: PB ÷ 6,25 = N
const CARBONO_NA_RACAO_PERCENT = 50; // Revista ABCC (2024): ~50% da ração comercial é carbono
const BICARBONATO_POR_KG_RACAO = 0.25; // ABCCam: 0,25 kg de NaHCO3 por kg de ração em BFT nitrificante

/**
 * Arredonda para N casas decimais sem retornar NaN.
 */
function arredondar(valor, casas = 2) {
  const n = Number(valor);
  if (!Number.isFinite(n)) return 0;
  return Number(n.toFixed(casas));
}

/**
 * Localiza a faixa de uma tabela indexada por peso (minPeso/maxPeso).
 * A última faixa é tratada como aberta no limite superior.
 * @returns {object|null}
 */
export function encontrarFaixaPorPeso(tabela, pesoMedioG) {
  const peso = Number(pesoMedioG);
  if (!Array.isArray(tabela) || !Number.isFinite(peso) || peso < 0) return null;

  for (const faixa of tabela) {
    const min = Number(faixa.minPeso) || 0;
    const max = Number(faixa.maxPeso);
    if (peso >= min && peso < max) return faixa;
  }

  // Acima da última faixa: usa a última (crescimento além da tabela)
  const ultima = tabela[tabela.length - 1];
  if (ultima && peso >= (Number(ultima.minPeso) || 0)) return ultima;
  return null;
}

/**
 * Converte contagem de mercado (unidades por libra) em unidades por kg.
 * @returns {number} un/kg
 */
export function contagemPorLibraParaUnPorKg(contagemPorLibra) {
  const c = Number(contagemPorLibra);
  if (!Number.isFinite(c) || c <= 0) return 0;
  return c / LIBRA_EM_KG;
}

/**
 * Classifica o calibre comercial (HOSO) a partir do peso médio do camarão.
 * @returns {{encontrado: boolean, calibre: string|null, classe: string|null,
 *            unPorKg: number, pesoMedioG: number, minUnPorKg: number, maxUnPorKg: number,
 *            pesoMinG: number, pesoMaxG: number, destino: string|null, observacao: string|null}}
 */
export function classificarCalibreMercado(pesoMedioG) {
  const peso = Number(pesoMedioG);
  const vazio = {
    encontrado: false, calibre: null, classe: null, unPorKg: 0, pesoMedioG: arredondar(peso, 2),
    minUnPorKg: 0, maxUnPorKg: 0, pesoMinG: 0, pesoMaxG: 0, destino: null, observacao: null
  };
  if (!Number.isFinite(peso) || peso <= 0) return vazio;

  // Cada calibre é definido pela contagem por libra; o peso cai entre os dois extremos
  for (const faixa of TABELA_CALIBRE_MERCADO) {
    const unPorKgMaior = contagemPorLibraParaUnPorKg(faixa.minPorLibra);
    const unPorKgMenor = contagemPorLibraParaUnPorKg(faixa.maxPorLibra);
    const pesoMinG = 1000 / unPorKgMenor;
    const pesoMaxG = 1000 / unPorKgMaior;

    if (peso >= pesoMinG && peso <= pesoMaxG) {
      return {
        encontrado: true,
        calibre: faixa.calibre,
        classe: faixa.classe,
        unPorKg: arredondar(1000 / peso, 0),
        pesoMedioG: arredondar(peso, 2),
        minUnPorKg: arredondar(unPorKgMenor, 0),
        maxUnPorKg: arredondar(unPorKgMaior, 0),
        pesoMinG: arredondar(pesoMinG, 2),
        pesoMaxG: arredondar(pesoMaxG, 2),
        destino: faixa.destino,
        observacao: faixa.observacao
      };
    }
  }

  // Fora das faixas conhecidas
  const primeira = TABELA_CALIBRE_MERCADO[0];
  const ultima = TABELA_CALIBRE_MERCADO[TABELA_CALIBRE_MERCADO.length - 1];
  const pesoMinimoComercial = 1000 / contagemPorLibraParaUnPorKg(ultima.maxPorLibra);
  const acimaDaTabela = peso > 1000 / contagemPorLibraParaUnPorKg(primeira.maxPorLibra);

  // Abaixo do menor calibre comercial: o lote ainda está em crescimento.
  // Só é problema se a despesca estiver sendo feita agora.
  if (!acimaDaTabela) {
    return {
      ...vazio,
      classe: "Em crescimento (sem calibre comercial)",
      destino: "Não aplicável nesta fase",
      observacao: `Lotes abaixo de ${arredondar(pesoMinimoComercial, 1)} g ainda não têm calibre de mercado. Se a despesca for agora, é colheita de emergência: revisar densidade, sanidade e qualidade de água.`
    };
  }

  return {
    ...vazio,
    classe: "Acima da tabela (extra grande)",
    destino: "Mercado premium / exportação de calibre especial",
    observacao: "Peso acima do maior calibre catalogado. Confirmar aceitação e preço com o comprador antes de manter o ciclo."
  };
}

/**
 * Reúne a orientação de ração de uma fase: taxa, granulometria, proteína e tratos.
 * Combina a tabela de arraçoamento com a tabela de granulometria.
 * @returns {{fase: string|null, taxaPadraoPercent: number, frequenciaTratos: number,
 *            granulometriaMm: string|null, formato: string|null,
 *            proteinaBrutaPercent: string|null, observacao: string|null}}
 */
export function getRacaoFaseCompleta(pesoMedioG, tabelaAlimentacao) {
  const peso = Number(pesoMedioG);
  if (!Number.isFinite(peso) || peso <= 0 || !Array.isArray(tabelaAlimentacao)) {
    return {
      fase: null, taxaPadraoPercent: 0, frequenciaTratos: 0,
      granulometriaMm: null, formato: null, proteinaBrutaPercent: null, observacao: null
    };
  }

  const faixaAlimento = encontrarFaixaPorPeso(tabelaAlimentacao, peso);
  const faixaRacao = encontrarFaixaPorPeso(TABELA_GRANULOMETRIA_RACAO, peso);

  return {
    fase: faixaRacao?.fase || faixaAlimento?.fase || null,
    taxaPadraoPercent: arredondar(faixaAlimento?.taxaPadrao, 2),
    frequenciaTratos: Number(faixaAlimento?.frequenciaTratos) || 0,
    granulometriaMm: faixaRacao ? `${faixaRacao.granulometriaMinMm} a ${faixaRacao.granulometriaMaxMm} mm` : null,
    formato: faixaRacao?.formato || null,
    proteinaBrutaPercent: faixaRacao ? `${faixaRacao.proteinaBrutaMin} a ${faixaRacao.proteinaBrutaMax}%` : null,
    observacao: faixaRacao?.observacao || null
  };
}

/**
 * Compara o peso observado em uma biometria com a curva de crescimento de referência.
 * @param {object} params
 * @param {number} params.pesoMedioG Peso médio da biometria
 * @param {number} params.diasCultivo Dias desde o povoamento
 * @returns {{semana: number, pesoEsperadoG: number, gpdRealG: number, gpdEsperadoG: number,
 *            percentualDoEsperado: number, status: string, cor: string, orientacao: string}}
 */
export function avaliarCrescimento({ pesoMedioG, diasCultivo }) {
  const peso = Number(pesoMedioG);
  const dias = Number(diasCultivo);

  const vazio = {
    semana: 0, pesoEsperadoG: 0, gpdRealG: 0, gpdEsperadoG: 0,
    percentualDoEsperado: 0, status: "Sem dados", cor: "slate",
    orientacao: "Informe o peso médio e os dias de cultivo para comparar com a curva."
  };
  if (!Number.isFinite(peso) || peso <= 0 || !Number.isFinite(dias) || dias <= 0) return vazio;

  const semana = Math.max(1, Math.round(dias / 7));
  // Usa a semana mais próxima disponível na curva (a curva vai até a semana 16)
  const referencia = CURVA_CRESCIMENTO_VANNAMEI.reduce((maisProxima, item) =>
    Math.abs(item.semana - semana) < Math.abs(maisProxima.semana - semana) ? item : maisProxima
  );

  const gpdRealG = arredondar(peso / dias, 3);
  const percentual = arredondar((peso / referencia.pesoEsperadoG) * 100, 1);

  let status = "Ótimo";
  let cor = "emerald";
  let orientacao = "Crescimento dentro ou acima da curva de referência. Manter o manejo atual.";

  if (percentual >= 110) {
    status = "Acima da curva";
    cor = "emerald";
    orientacao = "Desempenho acima da referência. Verificar se a densidade e a qualidade de água permitem manter o ritmo até o calibre alvo.";
  } else if (percentual >= 90) {
    status = "Ótimo";
  } else if (percentual >= 75) {
    status = "Atenção";
    cor = "amber";
    orientacao = "Crescimento abaixo do esperado. Revisar bandejas, taxa de arraçoamento, oxigênio noturno e densidade efetiva do lote.";
  } else if (percentual >= 60) {
    status = "Baixo";
    cor = "orange";
    orientacao = "Crescimento muito abaixo da curva. Verificar sobrevivência real, sanidade (manchas, intestino), alcalinidade e carga de nitrogênio.";
  } else {
    status = "Crítico";
    cor = "rose";
    orientacao = "Crescimento crítico para a semana de cultivo. Fazer biometria de conferência, checar sanidade e considerar despesca antecipada.";
  }

  return {
    semana,
    pesoEsperadoG: referencia.pesoEsperadoG,
    gpdRealG,
    gpdEsperadoG: referencia.gpdEsperadoG,
    percentualDoEsperado: percentual,
    status,
    cor,
    orientacao
  };
}

/**
 * Calcula a massa de produto comercial necessária para elevar um íon em mg/L.
 * Fórmula: kg = [déficit (mg/L) × volume (m³)] ÷ [1000 × fração do elemento]
 * @returns {number} kg do produto comercial
 */
export function calcularDoseProduto({ volumeM3, deficitMgL, fracaoElemento }) {
  const vol = Number(volumeM3);
  const deficit = Number(deficitMgL);
  const fracao = Number(fracaoElemento);

  if (!Number.isFinite(vol) || vol <= 0) return 0;
  if (!Number.isFinite(deficit) || deficit <= 0) return 0;
  if (!Number.isFinite(fracao) || fracao <= 0 || fracao > 1) return 0;

  return arredondar((deficit * vol) / (1000 * fracao), 2);
}

/**
 * Calcula o alvo de cada íon (mg/L) a partir da salinidade da água.
 * Alvo = MAIOR valor entre o SEC (salinidade × fator de diluição da água do mar)
 * e o piso prático de manejo daquele íon.
 * @param {number} salinidadePpt Salinidade da água em ppt (g/L)
 * @returns {{salinidadePpt: number, alvos: object, alcalinidadeMinima: number,
 *            observacao: string, aviso: string}}
 */
export function calcularAlvosIonicosPorSalinidade(salinidadePpt) {
  const s = Number(salinidadePpt) || 0;
  const { minimosPraticos, ions } = PARAMETROS_BALANCO_IONICO;

  const alvos = {};
  Object.values(ions).forEach((ion) => {
    const sec = s > 0 ? arredondar(s * ion.fator, 1) : 0;
    const piso = Number(ion.minimoPratico) || 0;
    alvos[ion.chave] = {
      nome: ion.nome,
      unidade: ion.unidade,
      fator: ion.fator,
      sec,
      minimoPratico: piso || null,
      alvo: arredondar(Math.max(sec, piso), 1),
      observacao: ion.observacao
    };
  });

  return {
    salinidadePpt: arredondar(s, 1),
    alvos,
    alcalinidadeMinima: minimosPraticos.alcalinidade,
    observacao: s > 0
      ? "Alvo calculado pela diluição da água do mar na salinidade informada, respeitando os pisos práticos de manejo."
      : "Sem salinidade informada: foram usados apenas os pisos práticos (K 50, Mg 100, Ca 30 mg/L). Informe a salinidade para calcular o alvo real da água do mar diluída.",
    aviso: PARAMETROS_BALANCO_IONICO.aviso
  };
}

/**
 * Avalia as relações iônicas (Na:K, Mg:Ca e Ca:K), calcula o alvo de cada íon
 * a partir da salinidade e lista os produtos de correção com a dose em kg.
 * As relações são mássicas (mg/L ÷ mg/L), conforme a prática de manejo em
 * águas de baixa salinidade.
 * @param {object} params
 * @param {number} params.volumeM3 Volume do viveiro
 * @param {number} params.calcio mg/L de Ca2+
 * @param {number} params.magnesio mg/L de Mg2+
 * @param {number} params.potassio mg/L de K+
 * @param {number} params.sodio mg/L de Na+
 * @param {number} params.salinidadePpt Salinidade da água (ppt)
 * @returns {object} relações, diagnósticos e lista de produtos com dose em kg
 */
export function calcularBalancoIonico({
  volumeM3 = 0,
  calcio = 0,
  magnesio = 0,
  potassio = 0,
  sodio = 0,
  salinidadePpt = 0
}) {
  const vol = Number(volumeM3) || 0;
  const ca = Number(calcio) || 0;
  const mg = Number(magnesio) || 0;
  const k = Number(potassio) || 0;
  const na = Number(sodio) || 0;
  const salinidade = Number(salinidadePpt) || 0;

  const { relacoes } = PARAMETROS_BALANCO_IONICO;
  const { alvos, alcalinidadeMinima, observacao } = calcularAlvosIonicosPorSalinidade(salinidade);

  const relacaoNaK = k > 0 ? arredondar(na / k, 2) : 0;
  const relacaoMgCa = ca > 0 ? arredondar(mg / ca, 2) : 0;
  const relacaoCaK = k > 0 ? arredondar(ca / k, 2) : 0;

  function classificarRelacao(valor, referencia) {
    if (valor <= 0) {
      return { status: "Sem dados", cor: "slate", orientacao: "Informe os valores dos íons para avaliar esta relação." };
    }
    if (valor < referencia.minimo) {
      return { status: "Abaixo do ideal", cor: "amber", orientacao: `Relação abaixo do mínimo recomendado (${referencia.minimo}). O íon do numerador está baixo em relação ao do denominador: corrigir antes de aumentar a densidade.` };
    }
    if (valor > referencia.maximo) {
      return { status: "Acima do ideal", cor: "amber", orientacao: `Relação acima de ${referencia.maximo}. ${referencia.observacao || "Corrigir antes de aumentar a densidade de cultivo."}` };
    }
    return { status: "Ideal", cor: "emerald", orientacao: "Relação dentro da faixa recomendada para água de baixa salinidade." };
  }

  const diagnosticoNaK = classificarRelacao(relacaoNaK, relacoes.naK);
  const diagnosticoMgCa = classificarRelacao(relacaoMgCa, relacoes.mgCa);
  const diagnosticoCaK = classificarRelacao(relacaoCaK, relacoes.caK);

  // Déficits em relação ao alvo calculado para cada íon
  const deficitK = Math.max(0, arredondar(alvos.potassio.alvo - k, 2));
  const deficitCa = Math.max(0, arredondar(alvos.calcio.alvo - ca, 2));
  const deficitMg = Math.max(0, arredondar(alvos.magnesio.alvo - mg, 2));

  // Produtos sugeridos para cada íon deficiente
  const produtos = [];
  function adicionarProdutos(elemento, deficit) {
    if (deficit <= 0 || vol <= 0) return;
    PRODUTOS_CORRECAO_IONICA
      .filter(p => Number(p.elementos?.[elemento]) > 0)
      .forEach(p => {
        const fracao = Number(p.elementos[elemento]) / 100;
        produtos.push({
          produto: p.produto,
          formula: p.formula,
          elemento,
          deficitMgL: deficit,
          doseKg: calcularDoseProduto({ volumeM3: vol, deficitMgL: deficit, fracaoElemento: fracao }),
          observacao: p.observacao
        });
      });
  }

  adicionarProdutos("K", deficitK);
  adicionarProdutos("Ca", deficitCa);
  adicionarProdutos("Mg", deficitMg);

  // Alertas de viabilidade: corrigir Mg em volume grande é caro e pede fracionamento
  const alertas = [];

  // Coerência entre a salinidade e os íons medidos: água do mar diluída em X ppt
  // tem um mínimo esperado de cada íon. Valores muito abaixo disso indicam que a
  // salinidade e a análise podem ser de viveiros (ou datas) diferentes.
  if (salinidade >= 5) {
    const abaixo = [
      { nome: "Cálcio", atual: ca, esperado: alvos.calcio.sec },
      { nome: "Magnésio", atual: mg, esperado: alvos.magnesio.sec },
      { nome: "Potássio", atual: k, esperado: alvos.potassio.sec }
    ].filter(i => i.esperado > 0 && i.atual > 0 && i.atual < i.esperado * 0.4);

    if (abaixo.length > 0) {
      alertas.push(
        `${abaixo.map(i => i.nome).join(", ")} muito abaixo do esperado para ${arredondar(salinidade, 1)} ppt (água do mar diluída). Antes de comprar corretivo, confirme se a salinidade e a análise iônica são do mesmo viveiro e da mesma data — corrigir um perfil inconsistente desperdiça produto.`
      );
    }
  }

  const maiorDose = produtos.reduce((maior, p) => (p.doseKg > maior.doseKg ? p : maior), { doseKg: 0 });
  if (maiorDose.doseKg >= 1000) {
    alertas.push(
      `Dose elevada: ${maiorDose.produto} exige ${maiorDose.doseKg.toLocaleString("pt-BR")} kg para este volume. Aplicar fracionado em vários dias e conferir a viabilidade econômica — o sulfato de magnésio é o corretivo mais caro e a literatura questiona seu retorno em alguns casos.`
    );
  }
  if (deficitMg > 0 || deficitCa > 0) {
    alertas.push("A correção iônica rende mais quando feita no enchimento, antes do povoamento, com a água ainda sem biomassa.");
  }

  return {
    alertas,
    volumeM3: arredondar(vol, 2),
    salinidadePpt: arredondar(salinidade, 1),
    relacoes: {
      naK: { ...relacoes.naK, valor: relacaoNaK, ...diagnosticoNaK },
      mgCa: { ...relacoes.mgCa, valor: relacaoMgCa, ...diagnosticoMgCa },
      caK: { ...relacoes.caK, valor: relacaoCaK, ...diagnosticoCaK }
    },
    ions: {
      potassio: { ...alvos.potassio, atual: k, deficit: deficitK },
      calcio: { ...alvos.calcio, atual: ca, deficit: deficitCa },
      magnesio: { ...alvos.magnesio, atual: mg, deficit: deficitMg },
      sodio: { ...alvos.sodio, atual: na, deficit: 0 }
    },
    alcalinidadeMinima,
    produtos,
    observacao,
    aviso: PARAMETROS_BALANCO_IONICO.aviso
  };
}

/**
 * Calcula a fonte de carbono necessária para ajustar a relação C:N do sistema
 * (manejo de bioflocos / controle de nitrogênio).
 *
 * Premissas explicitadas no retorno (e não regras absolutas de campo):
 *  - Carbono na ração comercial: ~45% da massa.
 *  - Nitrogênio na ração: PB ÷ 6,25.
 *  - O carbono da fonte escolhida entra como carbono disponível.
 * @returns {object} massas diárias e premissas adotadas
 */
export function calcularManejoBFT({
  racaoDiariaKg = 0,
  proteinaBrutaPercent = 35,
  alvoCN = 12.5,
  fonteCarbono = FONTES_CARBONO_BFT[0].fonte,
  sistemaNitrifying = true
}) {
  const racao = Number(racaoDiariaKg) || 0;
  const pb = Number(proteinaBrutaPercent) || 35;
  const alvo = Number(alvoCN) || 15;
  const fonte = FONTES_CARBONO_BFT.find(f => f.fonte === fonteCarbono) || FONTES_CARBONO_BFT[0];

  const premissas = [
    `Carbono na ração comercial: ${CARBONO_NA_RACAO_PERCENT}% da massa (Revista ABCC, 2024).`,
    `Nitrogênio na ração: proteína bruta ÷ ${NITROGENIO_EM_PROTEINA}.`,
    `Fonte de carbono: ${fonte.fonte} com ${fonte.carbonoPercent}% de carbono.`,
    `Bicarbonato: ${BICARBONATO_POR_KG_RACAO} kg de NaHCO3 por kg de ração ofertada (ABCCam, sistemas nitrificantes).`
  ];

  if (racao <= 0) {
    return {
      racaoDiariaKg: 0, nitrogenioKgDia: 0, carbonoRacaoKgDia: 0, relacaoCNRacao: 0,
      carbonoNecessarioKgDia: 0, carbonoFaltanteKgDia: 0, fonteNecessariaKgDia: 0,
      percentualDaRacao: 0, bicarbonatoKgDia: 0,
      fonte: fonte.fonte, alvoCN: alvo, premissas,
      observacao: "Informe a ração diária para calcular a demanda de carbono."
    };
  }

  const nitrogenioKgDia = arredondar(racao * (pb / 100) / NITROGENIO_EM_PROTEINA, 3);
  const carbonoRacaoKgDia = arredondar(racao * (CARBONO_NA_RACAO_PERCENT / 100), 3);
  const relacaoCNRacao = nitrogenioKgDia > 0 ? arredondar(carbonoRacaoKgDia / nitrogenioKgDia, 1) : 0;
  const carbonoNecessarioKgDia = arredondar(alvo * nitrogenioKgDia, 3);
  const carbonoFaltanteKgDia = arredondar(Math.max(0, carbonoNecessarioKgDia - carbonoRacaoKgDia), 3);
  const fonteNecessariaKgDia = carbonoFaltanteKgDia > 0
    ? arredondar(carbonoFaltanteKgDia / (fonte.carbonoPercent / 100), 3)
    : 0;
  const bicarbonatoKgDia = sistemaNitrifying
    ? arredondar(racao * BICARBONATO_POR_KG_RACAO, 3)
    : 0;

  return {
    racaoDiariaKg: arredondar(racao, 2),
    nitrogenioKgDia,
    carbonoRacaoKgDia,
    relacaoCNRacao,
    carbonoNecessarioKgDia,
    carbonoFaltanteKgDia,
    fonteNecessariaKgDia,
    percentualDaRacao: arredondar((fonteNecessariaKgDia / racao) * 100, 1),
    bicarbonatoKgDia,
    fonte: fonte.fonte,
    alvoCN: alvo,
    // Conferência prática de campo (Samocha): partir de açúcar ~30% da ração
    // ofertada e reduzir quando o nitrato começar a aparecer.
    conferenciaPratica: {
      referencia: "Açúcar em ~30% da ração ofertada, reduzindo quando o nitrato aparecer",
      valorKgDia: arredondar(racao * 0.3, 3),
      aplicavel: fonte.carbonoPercent >= 40
    },
    premissas,
    observacao: fonteNecessariaKgDia > 0
      ? "Aplicar fracionado ao longo do dia, com aeração funcionando, e medir a amônia antes de repetir a dose. Ao aparecer nitrato, reduzir a fonte de carbono gradualmente."
      : "A ração já fornece carbono suficiente para o alvo definido. Não há necessidade de fonte extra agora."
  };
}

/**
 * Identifica o sistema de cultivo provável e dimensiona a aeração necessária.
 * @returns {{sistema: string|null, faixaDensidade: string|null, hpPorHaMin: number,
 *            hpPorHaMax: number, hpTotalMin: number, hpTotalMax: number,
 *            produtividadeKgHaCiclo: string|null, observacao: string|null}}
 */
/**
 * Interpola a demanda de aeração (HP/ha) para qualquer densidade, a partir da
 * tabela da Cartilha de IMNV (ABCCam). Fora dos limites da tabela, devolve o
 * valor do extremo mais próximo.
 * @returns {{min: number, max: number}}
 */
export function interpolarAeracaoPorDensidade(densidadeM2) {
  const densidade = Number(densidadeM2) || 0;
  const tabela = TABELA_AERACAO_POR_DENSIDADE;
  const primeira = tabela[0];
  const ultima = tabela[tabela.length - 1];

  if (densidade <= primeira.densidadeM2) return { min: primeira.hpHaMin, max: primeira.hpHaMax };
  if (densidade >= ultima.densidadeM2) return { min: ultima.hpHaMin, max: ultima.hpHaMax };

  for (let i = 1; i < tabela.length; i += 1) {
    if (densidade <= tabela[i].densidadeM2) {
      const anterior = tabela[i - 1];
      const atual = tabela[i];
      const t = (densidade - anterior.densidadeM2) / (atual.densidadeM2 - anterior.densidadeM2);
      return {
        min: anterior.hpHaMin + t * (atual.hpHaMin - anterior.hpHaMin),
        max: anterior.hpHaMax + t * (atual.hpHaMax - anterior.hpHaMax)
      };
    }
  }
  return { min: ultima.hpHaMin, max: ultima.hpHaMax };
}

/**
 * Identifica o sistema de cultivo provável e dimensiona a aeração necessária,
 * interpolando a tabela de HP/ha por densidade e ajustando pelo tipo de aerador.
 * @param {object} params
 * @param {number} params.areaM2 Área do viveiro
 * @param {number} params.densidadeM2 Densidade de povoamento (camarões/m²)
 * @param {string} [params.tipoAerador] Tipo de aerador (ver TIPOS_AERADOR)
 * @returns {{sistema: string|null, faixaDensidade: string|null, tipoAerador: string,
 *            hpPorHaMin: number, hpPorHaMax: number, hpTotalMin: number, hpTotalMax: number,
 *            regimeAeracao: string, produtividadeKgHaCiclo: string|null, observacao: string}}
 */
export function dimensionarAeracao({ areaM2 = 0, densidadeM2 = 0, tipoAerador = TIPOS_AERADOR[0].tipo }) {
  const area = Number(areaM2) || 0;
  const densidade = Number(densidadeM2) || 0;
  const aerador = TIPOS_AERADOR.find(t => t.tipo === tipoAerador) || TIPOS_AERADOR[0];

  const vazio = {
    sistema: null, faixaDensidade: null, tipoAerador: aerador.tipo,
    hpPorHaMin: 0, hpPorHaMax: 0, hpTotalMin: 0, hpTotalMax: 0,
    regimeAeracao: "", produtividadeKgHaCiclo: null,
    observacao: "Informe a área e a densidade de povoamento para dimensionar a aeração."
  };
  if (area <= 0 || densidade <= 0) return vazio;

  const sistema = SISTEMAS_CULTIVO.find(s => densidade >= s.densidadeMinM2 && densidade <= s.densidadeMaxM2)
    || (densidade > SISTEMAS_CULTIVO[SISTEMAS_CULTIVO.length - 1].densidadeMaxM2
      ? SISTEMAS_CULTIVO[SISTEMAS_CULTIVO.length - 1]
      : SISTEMAS_CULTIVO[0]);

  const areaHa = area / 10000;
  const base = interpolarAeracaoPorDensidade(densidade);
  const hpPorHaMin = arredondar(base.min * aerador.fatorPotencia, 1);
  const hpPorHaMax = arredondar(base.max * aerador.fatorPotencia, 1);

  // Em sistemas com aeração contínua, o manejo de oxigênio é 24 h
  const regimeAeracao = densidade > 50 ? "24 horas por dia" : sistema.regimeAeracao;

  return {
    sistema: sistema.sistema,
    faixaDensidade: `${sistema.densidadeMinM2} a ${sistema.densidadeMaxM2} cam/m²`,
    tipoAerador: aerador.tipo,
    hpPorHaMin,
    hpPorHaMax,
    hpTotalMin: arredondar(hpPorHaMin * areaHa, 1),
    hpTotalMax: arredondar(hpPorHaMax * areaHa, 1),
    regimeAeracao,
    produtividadeKgHaCiclo: `${sistema.produtividadeMinKgHa.toLocaleString("pt-BR")} a ${sistema.produtividadeMaxKgHa.toLocaleString("pt-BR")} kg/ha/ciclo`,
    observacao: `${sistema.observacao} Manter oxigênio dissolvido acima de 4 mg/L (ideal acima de 5 mg/L). ${aerador.observacao}`
  };
}

/**
 * Calcula a conversão alimentar (FCA) do ciclo e classifica o resultado.
 * FCA = ração consumida ÷ ganho de biomassa.
 */
export function calcularFCA({ racaoAcumuladaKg = 0, biomassaInicialKg = 0, biomassaFinalKg = 0 }) {
  const racao = Number(racaoAcumuladaKg) || 0;
  const bioInicial = Number(biomassaInicialKg) || 0;
  const bioFinal = Number(biomassaFinalKg) || 0;
  const meta = METAS_INDICES_ZOOTECNICOS.fca;

  const ganhoKg = arredondar(bioFinal - bioInicial, 2);
  if (racao <= 0 || ganhoKg <= 0) {
    return {
      fca: 0, ganhoBiomassaKg: Math.max(0, ganhoKg), status: "Sem dados", cor: "slate",
      meta, orientacao: "Informe a ração acumulada e a biomassa final (maior que a inicial) para calcular o FCA."
    };
  }

  const fca = arredondar(racao / ganhoKg, 2);
  let status = "Atenção";
  let cor = "amber";
  let orientacao = "FCA acima do limite saudável. Revisar ajuste de bandejas, granulometria, oxigênio noturno e sobrevivência real.";

  if (fca <= meta.otimo) {
    status = "Ótimo";
    cor = "emerald";
    orientacao = "Conversão alimentar excelente. Ração sendo aproveitada com eficiência.";
  } else if (fca <= meta.bom) {
    status = "Bom";
    cor = "emerald";
    orientacao = "Conversão dentro do esperado para o sistema. Manter o acompanhamento das bandejas.";
  } else if (fca <= meta.atencao) {
    status = "Atenção";
    cor = "amber";
    orientacao = "Conversão no limite. Cada ponto de FCA representa custo direto: reforçar o ajuste de bandejas.";
  } else {
    status = "Crítico";
    cor = "rose";
  }

  return { fca, ganhoBiomassaKg: ganhoKg, status, cor, meta, orientacao };
}

/**
 * Custo de produção por quilo, com destaque para a participação da ração.
 * @returns {{custoRacao: number, custoOutros: number, custoTotal: number,
 *            custoPorKg: number, participacaoRacaoPercent: number}}
 */
export function calcularCustoProducao({
  racaoConsumidaKg = 0,
  precoRacaoKg = 0,
  outrosCustos = 0,
  biomassaProduzidaKg = 0
}) {
  const racao = Number(racaoConsumidaKg) || 0;
  const preco = Number(precoRacaoKg) || 0;
  const outros = Number(outrosCustos) || 0;
  const bio = Number(biomassaProduzidaKg) || 0;

  const custoRacao = arredondar(racao * preco, 2);
  const custoTotal = arredondar(custoRacao + outros, 2);

  return {
    custoRacao,
    custoOutros: arredondar(outros, 2),
    custoTotal,
    custoPorKg: bio > 0 ? arredondar(custoTotal / bio, 2) : 0,
    participacaoRacaoPercent: custoTotal > 0 ? arredondar((custoRacao / custoTotal) * 100, 1) : 0
  };
}

/**
 * Estima a população do viveiro por amostragem (método do quadro/puçá).
 * N = (indivíduos capturados ÷ área amostrada) × área total
 * @returns {{populacaoEstimada: number, densidadeM2: number,
 *            sobrevivenciaPercent: number, confiabilidade: string}}
 */
export function estimarPopulacaoPorAmostragem({
  capturados = 0,
  areaAmostradaM2 = 0,
  areaTotalM2 = 0,
  quantidadePovoada = 0
}) {
  const n = Number(capturados) || 0;
  const areaAmostra = Number(areaAmostradaM2) || 0;
  const areaTotal = Number(areaTotalM2) || 0;
  const povoada = Number(quantidadePovoada) || 0;

  if (n <= 0 || areaAmostra <= 0 || areaTotal <= 0) {
    return {
      populacaoEstimada: 0, densidadeM2: 0, sobrevivenciaPercent: 0,
      confiabilidade: "Sem dados — informe capturados, área amostrada e área total.",
      aviso: null
    };
  }

  const populacaoEstimada = Math.round((n / areaAmostra) * areaTotal);
  const densidadeM2 = arredondar(populacaoEstimada / areaTotal, 2);
  const sobrevivenciaPercent = povoada > 0 ? arredondar((populacaoEstimada / povoada) * 100, 1) : 0;

  // Quanto maior a área amostrada em relação ao viveiro, mais confiável a estimativa
  const coberturaPercent = (areaAmostra / areaTotal) * 100;
  let confiabilidade = "Baixa — amostragem pequena, repetir em mais pontos.";
  if (coberturaPercent >= 0.5) confiabilidade = "Alta — cobertura adequada do viveiro.";
  else if (coberturaPercent >= 0.2) confiabilidade = "Média — aceitável para acompanhamento de rotina.";

  // Sobrevivência acima de 100% só é possível com erro de amostragem, de área
  // ou de quantidade povoada registrada.
  let aviso = null;
  if (povoada > 0 && sobrevivenciaPercent > 100) {
    aviso = "Sobrevivência calculada acima de 100%: impossível na prática. Conferir a área total do viveiro, a área amostrada e a quantidade de PLs realmente povoada.";
  } else if (povoada > 0 && sobrevivenciaPercent < 20) {
    aviso = "Sobrevivência estimada muito baixa (< 20%). Confirmar com novas amostragens antes de decidir por despesca de emergência.";
  }

  return { populacaoEstimada, densidadeM2, sobrevivenciaPercent, confiabilidade, aviso };
}

/**
 * Avalia indicadores do ciclo contra as metas de referência.
 * Aceita qualquer subconjunto de índices; os ausentes são ignorados.
 * @returns {Array<{indice: string, nome: string, unidade: string, valor: number,
 *                  meta: object, status: string, cor: string, observacao: string}>}
 */
export function avaliarIndicesZootecnicos(valores = {}, referencias = {}) {
  const resultado = [];

  Object.entries(METAS_INDICES_ZOOTECNICOS).forEach(([chave, metaBase]) => {
    // Permite sobrescrever as metas globais por algo específico do viveiro
    // (ex.: produtividade esperada calculada pela densidade real do lote)
    const meta = { ...metaBase, ...(referencias[chave] || {}) };
    const valor = Number(valores[chave]);
    if (!Number.isFinite(valor) || valor <= 0) return;

    const maiorMelhor = meta.melhorQuando === "maior";
    let status = "Crítico";
    let cor = "rose";

    if (maiorMelhor) {
      if (valor >= meta.otimo) { status = "Ótimo"; cor = "emerald"; }
      else if (valor >= meta.bom) { status = "Bom"; cor = "emerald"; }
      else if (valor >= meta.atencao) { status = "Atenção"; cor = "amber"; }
    } else {
      if (valor <= meta.otimo) { status = "Ótimo"; cor = "emerald"; }
      else if (valor <= meta.bom) { status = "Bom"; cor = "emerald"; }
      else if (valor <= meta.atencao) { status = "Atenção"; cor = "amber"; }
    }

    resultado.push({
      indice: chave,
      nome: meta.nome,
      unidade: meta.unidade,
      valor: arredondar(valor, 2),
      meta,
      status,
      cor,
      observacao: meta.observacao
    });
  });

  return resultado;
}

/**
 * Prazo estimado até a despesca para atingir um peso alvo, com base na curva.
 * Usa o GPD esperado da faixa de peso atual até o alvo.
 * @returns {{pesoAlvoG: number, pesoAtualG: number, faltaG: number,
 *            gpdConsiderado: number, diasEstimados: number, semanaEstimada: number,
 *            observacao: string}}
 */
export function projetarDespesca({ pesoAtualG = 0, pesoAlvoG = 0, gpdObservadoG = 0 }) {
  const atual = Number(pesoAtualG) || 0;
  const alvo = Number(pesoAlvoG) || 0;
  const gpdObservado = Number(gpdObservadoG) || 0;

  if (atual <= 0 || alvo <= 0 || alvo <= atual) {
    return {
      pesoAlvoG: alvo, pesoAtualG: atual, faltaG: Math.max(0, arredondar(alvo - atual, 2)),
      gpdConsiderado: 0, diasEstimados: 0, semanaEstimada: 0,
      observacao: "O peso alvo precisa ser maior que o peso atual para projetar a despesca."
    };
  }

  // Prioriza o GPD observado na fazenda; sem ele, usa a curva de referência
  const faixaReferencia = encontrarFaixaPorPeso(
    CURVA_CRESCIMENTO_VANNAMEI.map(c => ({ ...c, minPeso: c.pesoEsperadoG, maxPeso: c.pesoEsperadoG * 1.35 })),
    atual
  );
  const gpdReferencia = Number(faixaReferencia?.gpdEsperadoG) || 0.15;
  const gpdConsiderado = gpdObservado > 0 ? gpdObservado : gpdReferencia;

  const faltaG = arredondar(alvo - atual, 2);
  const diasEstimados = Math.ceil(faltaG / gpdConsiderado);

  return {
    pesoAlvoG: alvo,
    pesoAtualG: atual,
    faltaG,
    gpdConsiderado: arredondar(gpdConsiderado, 3),
    diasEstimados,
    semanaEstimada: Math.round(diasEstimados / 7),
    observacao: gpdObservado > 0
      ? "Projeção baseada no GPD observado nas biometrias desta fazenda."
      : "Projeção baseada na curva de referência (sem GPD observado informado). Informe o GPD real para maior precisão."
  };
}
