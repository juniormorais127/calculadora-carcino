import test from 'node:test';
import assert from 'node:assert/strict';
import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { createDatabase, exportLocalDatabase, importLocalDatabase, clearLocalDatabase } from '../src/services/db.js';
import { readSyncMetadata, saveSyncMetadata } from '../src/services/localSyncMetadata.js';

test('baseline local não entra em backup/nuvem e sobrevive a restauração e exclusão explícita', async () => {
  const db = createDatabase(`sync-meta-${crypto.randomUUID()}`);
  try {
    await saveSyncMetadata(db, { revision: 2, baseline: 'shared', recovery: { privateCopy: true } });
    const exported = await exportLocalDatabase(db);
    assert.equal(exported.includes('privateCopy'), false);
    assert.equal(exported.includes('__cloudSyncMetadata'), false);
    await importLocalDatabase(exported, db);
    assert.equal((await readSyncMetadata(db)).baseline, 'shared');
    await clearLocalDatabase(db);
    assert.equal((await readSyncMetadata(db)).revision, 2);
    await assert.rejects(db.transaction('rw', db.tables, async () => {
      await db.viveiros.add({ id: 1, nome: 'Não confirmar' });
      await saveSyncMetadata(db, { revision: 3 });
      throw new Error('interrupção');
    }));
    assert.equal(await db.viveiros.count(), 0);
    assert.equal((await readSyncMetadata(db)).revision, 2);
  } finally { db.close(); await db.delete(); }
});

test('atualização do banco versão 1 preserva registros e adiciona metadados privados separados', async () => {
  const name = `sync-upgrade-${crypto.randomUUID()}`;
  const old = new Dexie(name);
  old.version(1).stores({ viveiros: '++id, nome, status, dataPovoamento, createdAt', biometrias: '++id, viveiroId, data, createdAt', qualidadeAgua: '++id, viveiroId, data, horario, createdAt', registrosAlimentacao: '++id, viveiroId, data, createdAt', configuracoes: '++id, chave' });
  await old.viveiros.add({ id: 1, nome: 'Viveiro existente' });
  await old.biometrias.add({ id: 1, viveiroId: 1, pesoMedioG: 5 });
  old.close();
  const upgraded = createDatabase(name);
  try {
    assert.equal((await upgraded.viveiros.get(1)).nome, 'Viveiro existente');
    assert.equal(await upgraded.biometrias.count(), 1);
    await saveSyncMetadata(upgraded, { revision: 3, baseline: 'oficial' });
    assert.equal((await readSyncMetadata(upgraded)).revision, 3);
    assert.equal((await upgraded.configuracoes.toArray()).length, 0);
    assert.equal((await upgraded.syncMetadata.count()), 1);
  } finally { upgraded.close(); await upgraded.delete(); }
});
