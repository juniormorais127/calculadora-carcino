import test from 'node:test';
import assert from 'node:assert/strict';
import 'fake-indexeddb/auto';
import { createDatabase } from '../src/services/db.js';
import { readLocalProduction, withLocalDeadline } from '../src/services/localProduction.js';

test('abertura lê snapshot sem gravar marcador nem esperar alimentação/fotos/nuvem', async () => {
  const db = createDatabase(`local-start-${crypto.randomUUID()}`);
  try {
    await db.viveiros.add({ id: 1, nome: 'Viveiro local' });
    await db.biometrias.bulkAdd(Array.from({ length: 3000 }, (_, index) => ({ id: index + 1, viveiroId: 1, pesoMedioG: 5, data: '2026-10-01' })));
    db.registrosAlimentacao.toArray = () => { throw new Error('Não deve ler alimentação na abertura'); };
    const result = await readLocalProduction(db);
    assert.equal(result.viveiros[0].nome, 'Viveiro local');
    assert.equal(result.biometrias.length, 3000);
    assert.equal(result.farmProfile, null);
    assert.equal(await db.configuracoes.count(), 0);
  } finally { db.close(); await db.delete(); }
});

test('armazenamento sem resposta encerra espera, sem apagar ou cancelar leitura tardia', async () => {
  let finish;
  const operation = new Promise(resolve => { finish = resolve; });
  await assert.rejects(withLocalDeadline(operation, 15), error => error.code === 'local/timeout');
  finish('registro preservado');
  assert.equal(await operation, 'registro preservado');
});
