import "fake-indexeddb/auto";
import test from "node:test";
import assert from "node:assert/strict";
import { db, seedInitialDataIfEmpty, exportLocalDatabase, importLocalDatabase, clearLocalDatabase, deleteViveiro } from "../src/services/db.js";

const snapshot = async () => JSON.parse(await exportLocalDatabase());

test("armazenamento local: inicializa??o, restaura??o e exclus?o", async (t) => {
  await t.test("inicializa??o concorrente n?o duplica os exemplos", async () => {
    await Promise.all([seedInitialDataIfEmpty(), seedInitialDataIfEmpty()]);
    assert.equal(await db.viveiros.count(), 2);
    assert.equal(await db.biometrias.count(), 4);
  });
  const original = await snapshot();
  await t.test("backup inv?lido n?o altera os dados", async () => {
    await assert.rejects(importLocalDatabase('{"versao":1}'));
    const duplicate = structuredClone(original);
    duplicate.viveiros.push(duplicate.viveiros[0]);
    await assert.rejects(importLocalDatabase(JSON.stringify(duplicate)));
    const orphan = structuredClone(original);
    orphan.biometrias[0].viveiroId = 999;
    await assert.rejects(importLocalDatabase(JSON.stringify(orphan)));
    assert.deepEqual((await snapshot()).viveiros, original.viveiros);
  });
  await t.test("tabelas vazias no backup removem os registros antigos", async () => {
    await importLocalDatabase(JSON.stringify({ ...original, biometrias: [], qualidadeAgua: [] }));
    assert.equal(await db.biometrias.count(), 0);
    assert.equal(await db.qualidadeAgua.count(), 0);
    await importLocalDatabase(JSON.stringify(original));
    assert.deepEqual((await snapshot()).biometrias, original.biometrias);
  });
  await t.test("excluir viveiro remove tamb?m a alimenta??o vinculada", async () => {
    const id = original.viveiros[0].id;
    await db.registrosAlimentacao.add({ viveiroId: id, data: "2026-10-12" });
    await deleteViveiro(id);
    for (const table of [db.biometrias, db.qualidadeAgua, db.registrosAlimentacao]) {
      assert.equal(await table.where("viveiroId").equals(id).count(), 0);
    }
    assert.equal(await db.viveiros.count(), 1);
  });
  await t.test("limpar mant?m a base vazia ap?s recarregar", async () => {
    await clearLocalDatabase();
    await seedInitialDataIfEmpty();
    assert.equal(await db.viveiros.count(), 0);
    assert.equal(await db.configuracoes.where("chave").equals("perfilFazenda").count(), 0);
  });
  await t.test("restaurar backup vazio mant?m a base vazia", async () => {
    await seedInitialDataIfEmpty({ force: true });
    const empty = { versao: 1 };
    for (const table of db.tables) empty[table.name] = [];
    await importLocalDatabase(JSON.stringify(empty));
    await seedInitialDataIfEmpty();
    assert.equal(await db.viveiros.count(), 0);
  });
  await t.test("exemplos podem ser carregados explicitamente sem duplica??o", async () => {
    await seedInitialDataIfEmpty({ force: true });
    await seedInitialDataIfEmpty({ force: true });
    assert.equal(await db.viveiros.count(), 2);
    assert.equal(await db.configuracoes.where("chave").equals("perfilFazenda").count(), 1);
  });
  db.close();
});
