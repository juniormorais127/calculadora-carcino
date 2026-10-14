// Validação da qualidade de água contra a tabela de referência PARAMETROS_QUALIDADE_AGUA.
//
// Esta é a ÚNICA fonte das regras: as telas não devem repetir limiares no código,
// senão a tabela vira decorativa e os limites divergem entre si (foi o que
// aconteceu com o oxigênio: a tabela diz 4,5 / 3,0 / 2,0 mg/L e a interface
// usava 4,0 / 3,0).
//
// Regra de leitura da tabela: cada lado (abaixo/acima do ideal) só é sinalizado
// se a tabela definir algum limite para aquele lado. Parâmetro com otimoMax e
// sem alertaMax/criticoMax não gera aviso por valor alto — é o caso do oxigênio
// (supersaturação à tarde é normal no viveiro) e da alcalinidade.
//
// O nitrito é o único parâmetro com limiar dependente da salinidade
// (ver LIMIARES_NITRITO_POR_SALINIDADE).

import { PARAMETROS_QUALIDADE_AGUA, LIMIARES_NITRITO_POR_SALINIDADE } from "../data/carcinoData.js";

/** Fator de conversão NO2- -> N-NO2, para kits que reportam o íon e não o nitrogênio. */
export const FATOR_NO2_PARA_N = 3.2846;

export const NIVEIS = {
  OTIMO: "otimo",
  ATENCAO: "atencao",
  CRITICO: "critico",
  EMERGENCIAL: "emergencial",
  SEM_DADOS: "sem_dados"
};

const ROTULOS = {
  otimo: "Ótimo",
  atencao: "Atenção",
  critico: "Crítico",
  emergencial: "Emergencial",
  sem_dados: "Sem dados"
};

// Quanto menor, mais grave
const ORDEM = { emergencial: 0, critico: 1, atencao: 2, otimo: 3, sem_dados: 4 };

export function rotuloDoNivel(nivel) {
  return ROTULOS[nivel] || ROTULOS.sem_dados;
}

/** Converte para número tratando vazio, nulo e indefinido como ausência de dado. */
function numeroOuNulo(valor) {
  if (valor === null || valor === undefined || valor === "") return null;
  const n = Number(valor);
  return Number.isFinite(n) ? n : null;
}

/** Limiares de nitrito aplicáveis à salinidade informada (null se não houver salinidade). */
export function limiaresNitritoPorSalinidade(salinidadePpt) {
  const s = numeroOuNulo(salinidadePpt);
  if (s === null || s < 0) return null;
  const tabela = LIMIARES_NITRITO_POR_SALINIDADE;
  return tabela.find(f => s <= f.salinidadeMaxPpt) || tabela[tabela.length - 1];
}

function dentroDaFaixa(valor, min, max) {
  const acimaDoMinimo = min === undefined || valor >= min;
  const abaixoDoMaximo = max === undefined || valor <= max;
  return acimaDoMinimo && abaixoDoMaximo;
}

function formatarFaixa(p) {
  const u = p.unidade ? ` ${p.unidade}` : "";
  if (p.otimoMin !== undefined && p.otimoMax !== undefined) return `${p.otimoMin} a ${p.otimoMax}${u}`;
  if (p.otimoMax !== undefined) return `até ${p.otimoMax}${u}`;
  if (p.otimoMin !== undefined) return `acima de ${p.otimoMin}${u}`;
  return "--";
}

/** Classifica um valor já sabidamente fora da faixa ótima. */
function classificarForaDaFaixa(valor, p) {
  if (p.otimoMin !== undefined && valor < p.otimoMin) {
    // A tabela não define risco abaixo do ideal: não sinaliza
    if (p.criticoMin === undefined && p.alertaMin === undefined) return NIVEIS.OTIMO;
    if (p.criticoMin !== undefined && valor < p.criticoMin) return NIVEIS.EMERGENCIAL;
    if (p.alertaMin !== undefined && valor < p.alertaMin) return NIVEIS.CRITICO;
    return NIVEIS.ATENCAO;
  }
  if (p.otimoMax !== undefined && valor > p.otimoMax) {
    // A tabela não define risco acima do ideal: não sinaliza
    if (p.criticoMax === undefined && p.alertaMax === undefined) return NIVEIS.OTIMO;
    if (p.criticoMax !== undefined && valor > p.criticoMax) return NIVEIS.EMERGENCIAL;
    if (p.alertaMax !== undefined && valor > p.alertaMax) return NIVEIS.CRITICO;
    return NIVEIS.ATENCAO;
  }
  return NIVEIS.OTIMO;
}

/**
 * Avalia um parâmetro da tabela de referência.
 * @param {string} chave Chave em PARAMETROS_QUALIDADE_AGUA
 * @param {number} valor Leitura da medição
 * @param {{salinidadePpt?: number}} [contexto] Necessário para o nitrito
 * @returns {{chave: string, nome?: string, unidade?: string, valor: number|null,
 *            nivel: string, rotulo: string, faixaOtima?: string, impacto?: string,
 *            limiteAplicado?: object|null, aviso?: string}}
 */
export function avaliarParametro(chave, valor, contexto = {}) {
  const parametro = PARAMETROS_QUALIDADE_AGUA[chave];
  // Number(null) é 0: sem esta guarda um campo vazio viraria "emergencial"
  const n = numeroOuNulo(valor);

  if (!parametro || n === null) {
    return { chave, valor: null, nivel: NIVEIS.SEM_DADOS, rotulo: ROTULOS.sem_dados, limiteAplicado: null };
  }

  const base = {
    chave,
    nome: parametro.nome,
    unidade: parametro.unidade,
    valor: n,
    impacto: parametro.impacto,
    limiteAplicado: null
  };

  if (parametro.limiaresPorSalinidade) {
    const limiares = limiaresNitritoPorSalinidade(contexto.salinidadePpt);

    if (!limiares) {
      return {
        ...base,
        nivel: NIVEIS.SEM_DADOS,
        rotulo: ROTULOS.sem_dados,
        aviso: "Informe a salinidade junto com o nitrito: o limite de segurança depende dela (a 2 ppt o seguro é ~0,3 mg/L; a 35 ppt, ~32 mg/L)."
      };
    }

    let nivel = NIVEIS.EMERGENCIAL;
    if (n <= limiares.otimoMax) nivel = NIVEIS.OTIMO;
    else if (n <= limiares.alertaMax) nivel = NIVEIS.ATENCAO;
    else if (n <= limiares.criticoMax) nivel = NIVEIS.CRITICO;

    return {
      ...base,
      nivel,
      rotulo: ROTULOS[nivel],
      faixaOtima: `até ${limiares.otimoMax} ${parametro.unidade} para até ${limiares.salinidadeMaxPpt} ppt`,
      limiteAplicado: { ...limiares, base: "mg/L de N-NO2" }
    };
  }

  let nivel = dentroDaFaixa(n, parametro.otimoMin, parametro.otimoMax)
    ? NIVEIS.OTIMO
    : classificarForaDaFaixa(n, parametro);

  // Contexto de manejo: valores que são condição esperada do sistema, não falha.
  // Ex.: salinidade baixa em cultivo de interior — o que decide é o balanço iônico.
  let contextual = false;
  let observacaoManejo = null;
  if (parametro.alertaContextoAbaixo !== undefined && n < parametro.alertaContextoAbaixo && nivel !== NIVEIS.EMERGENCIAL) {
    nivel = NIVEIS.ATENCAO;
    contextual = true;
    observacaoManejo = parametro.observacaoManejo || null;
  }

  return {
    ...base,
    nivel,
    rotulo: ROTULOS[nivel],
    faixaOtima: formatarFaixa(parametro),
    contextual,
    observacaoManejo
  };
}

/**
 * Avalia uma medição completa de qualidade de água.
 * @param {object} medicao Registro da tabela qualidadeAgua
 * @returns {{salinidadePpt: number|null, resultados: Array, nivelGeral: string,
 *            rotuloGeral: string, alertas: Array}}
 */
export function avaliarQualidadeAgua(medicao = {}) {
  const salinidadePpt = Number(medicao.salinidade);
  const contexto = { salinidadePpt };

  const resultados = Object.keys(PARAMETROS_QUALIDADE_AGUA)
    .map(chave => avaliarParametro(chave, medicao[chave], contexto))
    .filter(r => r.valor !== null);

  const avaliados = resultados.filter(r => r.nivel !== NIVEIS.SEM_DADOS);
  const nivelGeral = avaliados.length === 0
    ? NIVEIS.SEM_DADOS
    : avaliados.reduce((pior, r) => (ORDEM[r.nivel] < ORDEM[pior] ? r.nivel : pior), NIVEIS.OTIMO);

  return {
    salinidadePpt: Number.isFinite(salinidadePpt) ? salinidadePpt : null,
    resultados,
    nivelGeral,
    rotuloGeral: ROTULOS[nivelGeral],
    // O que exige ação agora
    alertas: resultados.filter(r => r.nivel === NIVEIS.CRITICO || r.nivel === NIVEIS.EMERGENCIAL)
  };
}
