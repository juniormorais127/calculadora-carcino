import test from "node:test";
import assert from "node:assert/strict";

import {
  avaliarParametro,
  avaliarQualidadeAgua,
  limiaresNitritoPorSalinidade,
  rotuloDoNivel,
  NIVEIS
} from "../src/services/qualidadeAguaService.js";

test("limiares de nitrito acompanham a salinidade", async (t) => {
  await t.test("água doce tem o limite mais apertado", () => {
    const l = limiaresNitritoPorSalinidade(0.5);
    assert.equal(l.otimoMax, 0.3);
    assert.equal(l.alertaMax, 0.6);
    assert.equal(l.criticoMax, 1.0);
  });

  await t.test("o limite cresce com a salinidade", () => {
    assert.equal(limiaresNitritoPorSalinidade(2).otimoMax, 0.5);
    assert.equal(limiaresNitritoPorSalinidade(17).otimoMax, 5.0);
    assert.equal(limiaresNitritoPorSalinidade(35).otimoMax, 10.0);
    assert.equal(limiaresNitritoPorSalinidade(35).criticoMax, 32.0);
  });

  await t.test("sem salinidade não há limiar", () => {
    assert.equal(limiaresNitritoPorSalinidade(undefined), null);
    assert.equal(limiaresNitritoPorSalinidade(null), null);
    assert.equal(limiaresNitritoPorSalinidade(""), null);
    assert.equal(limiaresNitritoPorSalinidade("abc"), null);
  });

  await t.test("acima da tabela usa a última faixa", () => {
    assert.equal(limiaresNitritoPorSalinidade(80).otimoMax, 10.0);
  });
});

test("nitrito é julgado pela salinidade da medição", async (t) => {
  await t.test("0,8 mg/L é crítico em água doce e ótimo no mar", () => {
    const doce = avaliarParametro("nitrito", 0.8, { salinidadePpt: 0.5 });
    assert.equal(doce.nivel, NIVEIS.CRITICO);

    const marinho = avaliarParametro("nitrito", 0.8, { salinidadePpt: 30 });
    assert.equal(marinho.nivel, NIVEIS.OTIMO);
  });

  await t.test("2,5 mg/L em 2 ppt é emergencial", () => {
    const r = avaliarParametro("nitrito", 2.5, { salinidadePpt: 2 });
    assert.equal(r.nivel, NIVEIS.EMERGENCIAL);
    assert.equal(r.limiteAplicado.criticoMax, 2.0);
  });

  await t.test("sem salinidade devolve sem dados com orientação", () => {
    const r = avaliarParametro("nitrito", 0.8, {});
    assert.equal(r.nivel, NIVEIS.SEM_DADOS);
    assert.match(r.aviso, /salinidade/i);
  });
});

test("parâmetros com faixa fixa seguem a tabela de referência", async (t) => {
  await t.test("oxigênio usa os limites da tabela (4,5 / 3,0 / 2,0)", () => {
    assert.equal(avaliarParametro("oxigenio", 5.0).nivel, NIVEIS.OTIMO);
    assert.equal(avaliarParametro("oxigenio", 4.0).nivel, NIVEIS.ATENCAO);
    assert.equal(avaliarParametro("oxigenio", 2.5).nivel, NIVEIS.CRITICO);
    assert.equal(avaliarParametro("oxigenio", 1.5).nivel, NIVEIS.EMERGENCIAL);
  });

  await t.test("supersaturação de oxigênio não vira alerta", () => {
    // A tabela não define limite superior de risco para oxigênio
    assert.equal(avaliarParametro("oxigenio", 9.5).nivel, NIVEIS.OTIMO);
  });

  await t.test("amônia total tem teto, sem piso", () => {
    assert.equal(avaliarParametro("amoniaTotal", 0).nivel, NIVEIS.OTIMO);
    assert.equal(avaliarParametro("amoniaTotal", 1.0).nivel, NIVEIS.ATENCAO);
    assert.equal(avaliarParametro("amoniaTotal", 2.0).nivel, NIVEIS.CRITICO);
    assert.equal(avaliarParametro("amoniaTotal", 5.0).nivel, NIVEIS.EMERGENCIAL);
  });

  await t.test("pH e temperatura nos dois lados", () => {
    assert.equal(avaliarParametro("ph", 8.0).nivel, NIVEIS.OTIMO);
    assert.equal(avaliarParametro("ph", 9.0).nivel, NIVEIS.CRITICO);
    assert.equal(avaliarParametro("ph", 6.0).nivel, NIVEIS.EMERGENCIAL);
    assert.equal(avaliarParametro("temperatura", 35).nivel, NIVEIS.CRITICO);
    assert.equal(avaliarParametro("temperatura", 29).nivel, NIVEIS.OTIMO);
  });

  await t.test("salinidade fora da faixa crítica é emergencial", () => {
    assert.equal(avaliarParametro("salinidade", 50).nivel, NIVEIS.EMERGENCIAL);
    assert.equal(avaliarParametro("salinidade", 20).nivel, NIVEIS.OTIMO);
  });

  await t.test("transparência sem limites críticos para no crítico", () => {
    assert.equal(avaliarParametro("transparencia", 35).nivel, NIVEIS.OTIMO);
    assert.equal(avaliarParametro("transparencia", 25).nivel, NIVEIS.ATENCAO);
    assert.equal(avaliarParametro("transparencia", 15).nivel, NIVEIS.CRITICO);
    assert.equal(avaliarParametro("transparencia", 70).nivel, NIVEIS.CRITICO);
  });

  await t.test("alcalinidade alta não gera alerta", () => {
    assert.equal(avaliarParametro("alcalinidade", 140).nivel, NIVEIS.OTIMO);
    assert.equal(avaliarParametro("alcalinidade", 200).nivel, NIVEIS.OTIMO);
    assert.equal(avaliarParametro("alcalinidade", 70).nivel, NIVEIS.CRITICO);
  });

  await t.test("parâmetro ou valor ausente não quebra", () => {
    assert.equal(avaliarParametro("inexistente", 5).nivel, NIVEIS.SEM_DADOS);
    assert.equal(avaliarParametro("ph", null).nivel, NIVEIS.SEM_DADOS);
    assert.equal(avaliarParametro("ph", undefined).nivel, NIVEIS.SEM_DADOS);
    assert.equal(avaliarParametro("ph", "").nivel, NIVEIS.SEM_DADOS);
    assert.equal(avaliarParametro("oxigenio", "abc").nivel, NIVEIS.SEM_DADOS);
  });

  await t.test("valor zero é dado, não ausência", () => {
    // Amônia 0 é ótima; não pode ser confundida com campo vazio
    const r = avaliarParametro("amoniaTotal", 0);
    assert.equal(r.nivel, NIVEIS.OTIMO);
    assert.equal(r.valor, 0);
  });
});

test("salinidade baixa é contexto, não falha", async (t) => {
  await t.test("1 a 4 ppt fica em atenção contextual com orientação de íons", () => {
    const r = avaliarParametro("salinidade", 2, {});
    assert.equal(r.nivel, NIVEIS.ATENCAO);
    assert.equal(r.contextual, true);
    assert.match(r.observacaoManejo, /balanço iônico/i);
  });

  await t.test("dentro da faixa ideal não é contextual", () => {
    const r = avaliarParametro("salinidade", 20, {});
    assert.equal(r.nivel, NIVEIS.OTIMO);
    assert.equal(r.contextual, false);
  });

  await t.test("abaixo de 1 ppt continua emergencial", () => {
    const r = avaliarParametro("salinidade", 0.3, {});
    assert.equal(r.nivel, NIVEIS.EMERGENCIAL);
  });
});

test("avaliação da medição completa", async (t) => {
  const medicaoBoa = {
    oxigenio: 5.0,
    temperatura: 29,
    ph: 8.0,
    salinidade: 20,
    alcalinidade: 140,
    amoniaTotal: 0.2,
    nitrito: 0.5,
    transparencia: 35
  };

  await t.test("medição equilibrada fica ótima e sem alertas", () => {
    const r = avaliarQualidadeAgua(medicaoBoa);
    assert.equal(r.nivelGeral, NIVEIS.OTIMO);
    assert.deepEqual(r.alertas, []);
    assert.equal(r.resultados.length, 8);
  });

  await t.test("o pior parâmetro define o nível geral", () => {
    const r = avaliarQualidadeAgua({ ...medicaoBoa, oxigenio: 2.4 });
    assert.equal(r.nivelGeral, NIVEIS.CRITICO);
    assert.equal(r.alertas.length, 1);
    assert.equal(r.alertas[0].chave, "oxigenio");
    assert.equal(rotuloDoNivel(r.nivelGeral), "Crítico");
  });

  await t.test("cenário de água de poço dispara nitrito e alcalinidade", () => {
    const r = avaliarQualidadeAgua({
      oxigenio: 4.6,
      temperatura: 29,
      ph: 8.0,
      salinidade: 1,
      alcalinidade: 60,
      amoniaTotal: 0.4,
      nitrito: 1.2,
      transparencia: 40
    });
    const chaves = r.alertas.map(a => a.chave).sort();
    assert.deepEqual(chaves, ["alcalinidade", "nitrito"]);
    assert.equal(r.alertas.find(a => a.chave === "nitrito").nivel, NIVEIS.EMERGENCIAL);
  });

  await t.test("nitrito fica pendente se a medição não traz salinidade", () => {
    const { salinidade, ...semSalinidade } = medicaoBoa;
    const r = avaliarQualidadeAgua(semSalinidade);
    const nitrito = r.resultados.find(x => x.chave === "nitrito");
    assert.equal(nitrito.nivel, NIVEIS.SEM_DADOS);
    assert.match(nitrito.aviso, /informe a salinidade/i);
    // A própria salinidade sai da avaliação, mas o nitrito permanece visível
    assert.equal(r.resultados.length, 7);
  });

  await t.test("salinidade de 2 ppt não vira alerta vermelho", () => {
    const r = avaliarQualidadeAgua({ ...medicaoBoa, salinidade: 2 });
    const salinidade = r.resultados.find(x => x.chave === "salinidade");
    assert.equal(salinidade.contextual, true);
    assert.equal(r.alertas.some(a => a.chave === "salinidade"), false);
  });

  await t.test("medição vazia não inventa resultado", () => {
    const r = avaliarQualidadeAgua({});
    assert.equal(r.resultados.length, 0);
    assert.equal(r.nivelGeral, NIVEIS.SEM_DADOS);
  });
});
