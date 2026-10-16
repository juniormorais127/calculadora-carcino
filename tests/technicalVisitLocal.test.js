import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import test from 'node:test';
import assert from 'node:assert/strict';
import { applyAcceptedVisit, checkVisitApproval } from '../src/services/technicalVisitLocal.js';

test('aceite aplica uma vez, preserva edicoes posteriores e propostas recusadas nao alteram dados', async () => {
  const db = new Dexie(`technical-local-${crypto.randomUUID()}`);
  db.version(1).stores({ viveiros: '++id', configuracoes: '++id,chave' });
  const visit = { id: 'visit1', pondId: 1, pondName: 'Viveiro 1', previousLatitude: -10, previousLongitude: -37, latitude: -10.5, longitude: -37.5, correctLocation: true, status: 'pending' };
  try {
    await db.viveiros.add({ id: 1, nome: 'Viveiro 1', latitude: -10, longitude: -37 });
    assert.equal(await applyAcceptedVisit(db, visit), false);
    assert.equal(await applyAcceptedVisit(db, { ...visit, status: 'rejected' }), false);
    assert.equal((await db.viveiros.get(1)).latitude, -10);
    await checkVisitApproval(db, visit);
    await Promise.all([applyAcceptedVisit(db, { ...visit, status: 'accepted' }), applyAcceptedVisit(db, { ...visit, status: 'accepted' })]);
    assert.equal(await db.configuracoes.count(), 1);
    assert.equal((await db.viveiros.get(1)).latitude, -10.5);
    await db.viveiros.update(1, { latitude: -11 });
    assert.equal(await applyAcceptedVisit(db, { ...visit, status: 'accepted' }), false);
    assert.equal((await db.viveiros.get(1)).latitude, -11);
    await assert.rejects(checkVisitApproval(db, { ...visit, id: 'new' }));
    await assert.rejects(applyAcceptedVisit(db, { ...visit, id: 'new', status: 'accepted' }));
    assert.equal((await db.viveiros.get(1)).latitude, -11);
    assert.equal(await db.configuracoes.count(), 1);
  } finally { await db.delete(); }
});
