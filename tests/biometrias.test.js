import test from 'node:test';
import assert from 'node:assert/strict';
import 'fake-indexeddb/auto';
import { createDatabase } from '../src/services/db.js';
import { saveBiometria, deleteBiometria } from '../src/services/biometrias.js';

test('pesagens fora de ordem e exclusões recalculam a curva sem atingir outro viveiro', async () => {
  const db = createDatabase(`biometrias-${crypto.randomUUID()}`);
  try {
    const pond = { id: 1, qtdPovoada: 10000 };
    const add = (data, pesoMedioG) => saveBiometria(db, pond, { data, pesoMedioG, sobrevivenciaEstimada: 80 });
    const first = await add('2026-10-01', '2');
    const last = await add('2026-10-15', 10);
    const middle = await add('2026-10-08', 8);
    await saveBiometria(db, { ...pond, id: 2 }, { data: '2026-10-01', pesoMedioG: 3, sobrevivenciaEstimada: 90 });
    assert.equal((await db.biometrias.get(last)).ganhoSemanalG, 2);
    await deleteBiometria(db, first);
    assert.equal(await db.biometrias.get(first), undefined);
    assert.equal((await db.biometrias.get(middle)).ganhoSemanalG, 0);
    await deleteBiometria(db, middle);
    assert.equal((await db.biometrias.get(last)).ganhoSemanalG, 0);
    await deleteBiometria(db, last);
    assert.equal(await db.biometrias.where('viveiroId').equals(1).count(), 0);
    assert.equal(await db.biometrias.where('viveiroId').equals(2).count(), 1);
    await assert.rejects(() => add('2026-02-30', 2));
    await assert.rejects(() => add('2026-10-01', -1));
  } finally { db.close(); await db.delete(); }
});
