import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";

import { calcularManejoProbioticoSolo } from "../src/services/probioticoService.js";
import { FABRICANTES_RACAO, VENDEDORES_POR_ESTADO, ANUNCIOS_PATROCINADORES } from "../src/data/fabricantesRacao.js";
import { DADOS_PROBIOTICOS_SOLO } from "../src/data/probioticosSolo.js";
import { DOENCAS_CAMARAO } from "../src/data/carcinoData.js";

test("serviço de probióticos de solo", async (t) => {
  await t.test("calcula dose de manutenção preventiva semanal para 1 hectare", () => {
    const res = calcularManejoProbioticoSolo({
      areaM2: 10000,
      finalidade: "manutencao",
      nivelLodo: "moderado",
      modoAtivado: true,
      temCheiroH2S: false
    });

    assert.equal(res.areaHa, 1.0);
    assert.equal(res.doseDiariaKg, 1.0);
    assert.equal(res.diasAplicacao, 1);
    assert.equal(res.doseTotalCicloTratamentoKg, 1.0);
    assert.equal(res.melacoKg, 1.2);
    assert.equal(res.aguaAtivacaoL, 30);
    assert.equal(res.tempoAeracaoHoras, 18);
  });

  await t.test("tratamento de choque com presença de H2S aciona 3 dias de aplicação e alerta crítico", () => {
    const res = calcularManejoProbioticoSolo({
      areaM2: 20000,
      finalidade: "choque",
      nivelLodo: "severo",
      modoAtivado: true,
      temCheiroH2S: true
    });

    assert.equal(res.areaHa, 2.0);
    assert.equal(res.doseBaseKgHa, 2.5);
    assert.equal(res.doseDiariaKg, 5.0);
    assert.equal(res.diasAplicacao, 3);
    assert.equal(res.doseTotalCicloTratamentoKg, 15.0);
    assert.ok(res.avisos.some(a => a.tipo === "critico"));
  });

  await t.test("preparo de viveiro entre ciclos calcula dose na primeira lâmina", () => {
    const res = calcularManejoProbioticoSolo({
      areaM2: 15000,
      finalidade: "preparo",
      nivelLodo: "leve",
      modoAtivado: false,
      temCheiroH2S: false
    });

    assert.equal(res.areaHa, 1.5);
    assert.equal(res.doseBaseKgHa, 4.0);
    assert.equal(res.doseDiariaKg, 6.0);
    assert.equal(res.melacoKg, 0);
  });
});

test("catálogo de fabricantes de ração e vendedores", async (t) => {
  await t.test("possui os 3 fabricantes solicitados (ADM, Guabi, AquaNutri) com fases juvenil e engorda", () => {
    assert.equal(FABRICANTES_RACAO.length, 3);
    const ids = FABRICANTES_RACAO.map(f => f.id);
    assert.ok(ids.includes("adm"));
    assert.ok(ids.includes("guabi"));
    assert.ok(ids.includes("aquanutri"));

    for (const fab of FABRICANTES_RACAO) {
      assert.ok(fab.fases.juvenil, `Fabricante ${fab.id} deve ter fase juvenil`);
      assert.ok(fab.fases.engorda, `Fabricante ${fab.id} deve ter fase engorda`);
      assert.ok(fab.fases.juvenil.pbPercent >= 35, `Fase juvenil deve ter PB alta`);
      assert.ok(fab.fases.engorda.pbPercent >= 30, `Fase engorda deve ter PB adequada`);
      assert.ok(fab.fases.juvenil.ajudaTecnica, `Fase juvenil deve ter ajuda técnica`);
      assert.ok(fab.fases.engorda.ajudaTecnica, `Fase engorda deve ter ajuda técnica`);
    }
  });

  await t.test("banco de vendedores locais cobre os principais estados carcinicultores", () => {
    assert.ok(VENDEDORES_POR_ESTADO.length >= 10);
    const estados = new Set(VENDEDORES_POR_ESTADO.map(v => v.estado));
    assert.ok(estados.has("RN"), "Deve ter RN");
    assert.ok(estados.has("CE"), "Deve ter CE");
    assert.ok(estados.has("BA"), "Deve ter BA");
    assert.ok(estados.has("PI"), "Deve ter PI");
    assert.ok(estados.has("PB"), "Deve ter PB");
    assert.ok(estados.has("PE"), "Deve ter PE");
    assert.ok(estados.has("SC"), "Deve ter SC");

    for (const v of VENDEDORES_POR_ESTADO) {
      assert.ok(v.whatsapp, `Vendedor ${v.id} deve ter whatsapp`);
      assert.ok(v.telefone, `Vendedor ${v.id} deve ter telefone`);
      assert.ok(v.marcas.length > 0, `Vendedor ${v.id} deve ter marcas associadas`);
    }
  });

  await t.test("banco de patrocinadores e anúncios possui chamadas e contatos", () => {
    assert.ok(ANUNCIOS_PATROCINADORES.length >= 2);
    for (const ad of ANUNCIOS_PATROCINADORES) {
      assert.ok(ad.nomeEmpresa);
      assert.ok(ad.chamada);
      assert.ok(ad.badge);
    }
  });
});

test("catálogo de doenças de camarão com fotos clínicas e fontes ABCC", async (t) => {
  await t.test("todas as doenças possuem imagem, legenda clínica e fonte citada da ABCC/entidades", () => {
    assert.equal(DOENCAS_CAMARAO.length, 6);
    for (const doenca of DOENCAS_CAMARAO) {
      assert.ok(doenca.imagem, `Doença ${doenca.id} deve ter caminho de imagem`);
      assert.ok(doenca.legendaImagem, `Doença ${doenca.id} deve ter legenda clínica`);
      assert.ok(doenca.fonteImagem, `Doença ${doenca.id} deve ter fonte citada`);
      assert.ok(doenca.fonteImagem.includes("ABCC"), `Doença ${doenca.id} deve citar a ABCC`);
    }
  });

  await t.test("todas as imagens de doenças existem fisicamente na pasta public", () => {
    for (const doenca of DOENCAS_CAMARAO) {
      const fullPath = resolve("public", doenca.imagem);
      assert.ok(existsSync(fullPath), `Arquivo ${fullPath} deve existir no disco`);
      const stat = statSync(fullPath);
      assert.ok(stat.size > 10000, `Arquivo ${fullPath} deve ter conteúdo real (>10KB)`);
    }
  });
});
