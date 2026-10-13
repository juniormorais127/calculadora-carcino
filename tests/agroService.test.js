import test from "node:test";
import assert from "node:assert/strict";

import {
  classificarCalibreMercado,
  contagemPorLibraParaUnPorKg,
  getRacaoFaseCompleta,
  avaliarCrescimento,
  calcularDoseProduto,
  calcularAlvosIonicosPorSalinidade,
  calcularBalancoIonico,
  calcularManejoBFT,
  interpolarAeracaoPorDensidade,
  dimensionarAeracao,
  calcularFCA,
  calcularCustoProducao,
  estimarPopulacaoPorAmostragem,
  avaliarIndicesZootecnicos,
  projetarDespesca,
  encontrarFaixaPorPeso
} from "../src/services/agroService.js";
import { TABELA_ALIMENTACAO_VANNAMEI } from "../src/data/carcinoData.js";

const perto = (valor, esperado, tolerancia = 0.05) =>
  assert.ok(Math.abs(valor - esperado) <= tolerancia, `esperado ~${esperado}, obtido ${valor}`);

test("calibre comercial", async (t) => {
  await t.test("converte contagem por libra em unidades por kg", () => {
    perto(contagemPorLibraParaUnPorKg(41), 90.4, 0.1);
    perto(contagemPorLibraParaUnPorKg(50), 110.2, 0.1);
  });

  await t.test("classifica o peso médio na faixa de mercado", () => {
    const r = classificarCalibreMercado(11);
    assert.equal(r.encontrado, true);
    assert.equal(r.calibre, "41/50");
    assert.equal(r.unPorKg, 91);
    perto(r.pesoMinG, 9.07, 0.02);
    perto(r.pesoMaxG, 11.06, 0.02);
  });

  await t.test("lote pequeno ainda em crescimento não recebe calibre de descarte", () => {
    const r = classificarCalibreMercado(0.5);
    assert.equal(r.encontrado, false);
    assert.equal(r.calibre, null);
    assert.match(r.classe, /crescimento/i);
  });

  await t.test("acima do maior calibre é sinalizado como extra grande", () => {
    assert.match(classificarCalibreMercado(35).classe, /extra grande/i);
  });

  await t.test("peso inválido não quebra o cálculo", () => {
    assert.equal(classificarCalibreMercado(0).encontrado, false);
    assert.equal(classificarCalibreMercado(NaN).encontrado, false);
  });
});

test("fase de arraçoamento", async (t) => {
  await t.test("combina taxa, granulometria e proteína do peso médio", () => {
    const r = getRacaoFaseCompleta(13, TABELA_ALIMENTACAO_VANNAMEI);
    perto(r.taxaPadraoPercent, 4.4);
    assert.equal(r.frequenciaTratos, 3);
    assert.equal(r.granulometriaMm, "2.5 a 3 mm");
    assert.equal(r.proteinaBrutaPercent, "30 a 32%");
  });

  await t.test("faixas da tabela cobrem todo o intervalo de peso sem buraco", () => {
    for (let peso = 0.1; peso <= 30; peso += 0.1) {
      const faixa = encontrarFaixaPorPeso(TABELA_ALIMENTACAO_VANNAMEI, peso);
      assert.ok(faixa, `sem faixa para ${peso.toFixed(1)} g`);
    }
  });

  await t.test("peso acima da última faixa usa o limite superior", () => {
    const r = getRacaoFaseCompleta(45, TABELA_ALIMENTACAO_VANNAMEI);
    perto(r.taxaPadraoPercent, 2.6);
  });
});

test("avaliação de crescimento", async (t) => {
  await t.test("peso 11,9 g em 63 dias fica acima da curva", () => {
    const r = avaliarCrescimento({ pesoMedioG: 11.9, diasCultivo: 63 });
    assert.equal(r.semana, 9);
    perto(r.pesoEsperadoG, 8.3);
    perto(r.gpdRealG, 0.189, 0.001);
    assert.equal(r.status, "Acima da curva");
  });

  await t.test("lote travado é classificado como crítico", () => {
    const r = avaliarCrescimento({ pesoMedioG: 4, diasCultivo: 63 });
    assert.equal(r.status, "Crítico");
    assert.equal(r.cor, "rose");
  });

  await t.test("sem dados retorna estado neutro", () => {
    assert.equal(avaliarCrescimento({ pesoMedioG: 0, diasCultivo: 0 }).status, "Sem dados");
  });
});

test("correção iônica", async (t) => {
  await t.test("dose do produto segue a fração elementar", () => {
    // 20 mg/L de Ca em 1.000 m³ = 20 kg de Ca; CaCl2.2H2O tem 27,2% de Ca
    perto(calcularDoseProduto({ volumeM3: 1000, deficitMgL: 20, fracaoElemento: 0.272 }), 73.53, 0.01);
    assert.equal(calcularDoseProduto({ volumeM3: 0, deficitMgL: 20, fracaoElemento: 0.272 }), 0);
    assert.equal(calcularDoseProduto({ volumeM3: 1000, deficitMgL: 0, fracaoElemento: 0.272 }), 0);
  });

  await t.test("alvo é o maior valor entre a água do mar diluída e o piso prático", () => {
    const { alvos } = calcularAlvosIonicosPorSalinidade(4);
    perto(alvos.calcio.alvo, 46.4, 0.1); // 4 × 11,6 (SEC vence o piso de 30)
    perto(alvos.magnesio.alvo, 156.4, 0.1); // 4 × 39,1
    perto(alvos.potassio.alvo, 50); // SEC 42,8 fica abaixo do piso de 50
  });

  await t.test("sem salinidade usa apenas os pisos práticos", () => {
    const { alvos } = calcularAlvosIonicosPorSalinidade(0);
    perto(alvos.potassio.alvo, 50);
    perto(alvos.calcio.alvo, 30);
    perto(alvos.magnesio.alvo, 100);
  });

  await t.test("balanço aponta relações fora da faixa e calcula os produtos", () => {
    const r = calcularBalancoIonico({ volumeM3: 10000, calcio: 20, magnesio: 25, potassio: 12, sodio: 400, salinidadePpt: 4 });
    perto(r.relacoes.naK.valor, 33.33, 0.01);
    perto(r.relacoes.mgCa.valor, 1.25, 0.01);
    assert.equal(r.relacoes.mgCa.status, "Abaixo do ideal");
    perto(r.ions.potassio.deficit, 38, 0.01);
    perto(r.ions.magnesio.deficit, 131.4, 0.01);

    const kcl = r.produtos.find(p => p.produto === "Cloreto de Potássio");
    perto(kcl.doseKg, 725.19, 0.01); // 38 × 10.000 ÷ (1000 × 0,524)
    assert.ok(r.alertas.some(a => /dose elevada/i.test(a)), "deveria alertar sobre dose elevada");
  });

  await t.test("avisa quando os íons medidos não batem com a salinidade", () => {
    // 22 ppt com Ca/Mg/K de água doce é perfil fisicamente inconsistente
    const r = calcularBalancoIonico({ volumeM3: 12000, calcio: 30, magnesio: 25, potassio: 12, sodio: 6699, salinidadePpt: 22 });
    assert.ok(r.alertas.some(a => /muito abaixo do esperado/i.test(a)), "deveria avisar sobre incoerência");

    // Água doce (sal baixa) não dispara esse aviso: ali o piso prático é que manda
    const aguaDoce = calcularBalancoIonico({ volumeM3: 12000, calcio: 20, magnesio: 25, potassio: 12, sodio: 400, salinidadePpt: 1 });
    assert.equal(aguaDoce.alertas.some(a => /muito abaixo do esperado/i.test(a)), false);
  });

  await t.test("água equilibrada não gera produtos nem alerta de dose", () => {
    // A 5 ppt o alvo de Mg sobe para 195 mg/L (5 × 39,1), então 200 mg/L fecha a conta
    const r = calcularBalancoIonico({ volumeM3: 10000, calcio: 60, magnesio: 200, potassio: 55, sodio: 1500, salinidadePpt: 5 });
    assert.deepEqual(r.produtos, []);
    assert.equal(r.alertas.some(a => /dose elevada/i.test(a)), false);
    perto(r.ions.magnesio.deficit, 0);
  });
});

test("bioflocos (C:N)", async (t) => {
  await t.test("100 kg de ração a 35% PB pede carbono complementar", () => {
    const r = calcularManejoBFT({ racaoDiariaKg: 100, proteinaBrutaPercent: 35, alvoCN: 12.5 });
    perto(r.nitrogenioKgDia, 5.6, 0.01); // 100 × 0,35 ÷ 6,25
    perto(r.carbonoRacaoKgDia, 50, 0.01); // 50% da ração
    perto(r.relacaoCNRacao, 8.9, 0.1);
    perto(r.fonteNecessariaKgDia, 57.14, 0.01); // (12,5 × 5,6 − 50) ÷ 0,35 (melaço a 35% de C)
    perto(r.bicarbonatoKgDia, 25, 0.01);
  });

  await t.test("sem ração não calcula dose", () => {
    const r = calcularManejoBFT({ racaoDiariaKg: 0 });
    assert.equal(r.fonteNecessariaKgDia, 0);
    assert.match(r.observacao, /informe a ração/i);
  });
});

test("dimensionamento de aeração", async (t) => {
  await t.test("interpola entre os pontos da tabela da cartilha", () => {
    perto(interpolarAeracaoPorDensidade(100).min, 26);
    perto(interpolarAeracaoPorDensidade(50).min, 9, 0.01); // meio do caminho entre 40 (6) e 60 (12)
    perto(interpolarAeracaoPorDensidade(1).min, 1); // abaixo da tabela usa o primeiro ponto
    perto(interpolarAeracaoPorDensidade(300).min, 40); // acima usa o último
  });

  await t.test("densidade alta exige aeração 24 h e o total escala com a área", () => {
    const r = dimensionarAeracao({ areaM2: 10000, densidadeM2: 100 });
    perto(r.hpPorHaMin, 26);
    perto(r.hpTotalMin, 26);
    assert.equal(r.regimeAeracao, "24 horas por dia");

    const dois = dimensionarAeracao({ areaM2: 20000, densidadeM2: 100 });
    perto(dois.hpTotalMin, 52, 0.1);
  });

  await t.test("difusor reduz a potência necessária", () => {
    const pas = dimensionarAeracao({ areaM2: 10000, densidadeM2: 80 });
    const difusor = dimensionarAeracao({ areaM2: 10000, densidadeM2: 80, tipoAerador: "Difusor / soprador (ar comprimido)" });
    assert.ok(difusor.hpPorHaMin < pas.hpPorHaMin);
    assert.match(difusor.tipoAerador, /Difusor/);
  });

  await t.test("sem área ou densidade não dimensiona", () => {
    assert.equal(dimensionarAeracao({ areaM2: 0, densidadeM2: 10 }).sistema, null);
  });
});

test("índices zootécnicos e custo", async (t) => {
  await t.test("FCA classifica pelo limite de cada faixa", () => {
    perto(calcularFCA({ racaoAcumuladaKg: 1400, biomassaInicialKg: 0, biomassaFinalKg: 1120 }).fca, 1.25);
    assert.equal(calcularFCA({ racaoAcumuladaKg: 1400, biomassaInicialKg: 0, biomassaFinalKg: 1120 }).status, "Ótimo");
    assert.equal(calcularFCA({ racaoAcumuladaKg: 2000, biomassaInicialKg: 0, biomassaFinalKg: 1000 }).status, "Crítico");
    assert.equal(calcularFCA({ racaoAcumuladaKg: 1000, biomassaInicialKg: 500, biomassaFinalKg: 400 }).status, "Sem dados");
  });

  await t.test("custo isola a participação da ração", () => {
    const r = calcularCustoProducao({ racaoConsumidaKg: 1800, precoRacaoKg: 8.5, outrosCustos: 9000, biomassaProduzidaKg: 1100 });
    perto(r.custoRacao, 15300);
    perto(r.custoPorKg, 22.09, 0.01);
    perto(r.participacaoRacaoPercent, 63, 0.1);
  });

  await t.test("amostragem estima população e avisa sobre sobrevivência impossível", () => {
    const ok = estimarPopulacaoPorAmostragem({ capturados: 20, areaAmostradaM2: 2, areaTotalM2: 10000, quantidadePovoada: 120000 });
    assert.equal(ok.populacaoEstimada, 100000);
    perto(ok.sobrevivenciaPercent, 83.3, 0.1);
    assert.equal(ok.aviso, null);

    const impossivel = estimarPopulacaoPorAmostragem({ capturados: 42, areaAmostradaM2: 2, areaTotalM2: 10000, quantidadePovoada: 120000 });
    assert.match(impossivel.aviso, /acima de 100%/i);
  });

  await t.test("metas podem ser sobrescritas pelo esperado do viveiro", () => {
    const comPadrao = avaliarIndicesZootecnicos({ produtividadeKgHaCiclo: 1022 });
    const comMetaLocal = avaliarIndicesZootecnicos({ produtividadeKgHaCiclo: 1022 }, { produtividadeKgHaCiclo: { otimo: 2000, bom: 1200, atencao: 800 } });
    assert.equal(comPadrao[0].status, "Atenção");
    assert.equal(comMetaLocal[0].status, "Atenção");
    const ajustada = avaliarIndicesZootecnicos({ produtividadeKgHaCiclo: 1022 }, { produtividadeKgHaCiclo: { otimo: 900, bom: 700, atencao: 400 } });
    assert.equal(ajustada[0].status, "Ótimo");
  });

  await t.test("FCA melhora quando o valor cai", () => {
    assert.equal(avaliarIndicesZootecnicos({ fca: 1.2 })[0].status, "Ótimo");
    assert.equal(avaliarIndicesZootecnicos({ fca: 2.4 })[0].status, "Crítico");
  });
});

test("projeção de despesca", async (t) => {
  await t.test("usa o GPD observado quando informado", () => {
    const r = projetarDespesca({ pesoAtualG: 11.9, pesoAlvoG: 14, gpdObservadoG: 0.19 });
    perto(r.faltaG, 2.1, 0.01);
    assert.equal(r.diasEstimados, 12); // 2,1 ÷ 0,19 arredondado para cima
    assert.match(r.observacao, /GPD observado/i);
  });

  await t.test("cai na curva de referência sem GPD informado", () => {
    const r = projetarDespesca({ pesoAtualG: 10, pesoAlvoG: 14 });
    assert.ok(r.gpdConsiderado > 0);
    assert.match(r.observacao, /curva de referência/i);
  });

  await t.test("alvo menor que o peso atual não projeta", () => {
    assert.equal(projetarDespesca({ pesoAtualG: 14, pesoAlvoG: 12 }).diasEstimados, 0);
  });
});
