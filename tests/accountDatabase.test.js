import 'fake-indexeddb/auto';
import test from 'node:test';
import assert from 'node:assert/strict';
import { db, getAccountDatabase, initializeDatabase, exportLocalDatabase, importLocalDatabase, clearLocalDatabase } from '../src/services/db.js';

test('duas contas e o modo local mantêm bancos independentes, inclusive após limpeza', async () => {
  const a = getAccountDatabase('test-user-a'); const b = getAccountDatabase('test-user-b');
  await Promise.all([initializeDatabase(a), initializeDatabase(b)]);
  await a.viveiros.add({ nome: 'Viveiro privado A' });
  await b.viveiros.add({ nome: 'Viveiro privado B' });
  await db.viveiros.add({ nome: 'Registro antigo do navegador' });
  assert.equal((await a.viveiros.toArray())[0].nome, 'Viveiro privado A');
  assert.equal((await b.viveiros.toArray())[0].nome, 'Viveiro privado B');
  const backup = await exportLocalDatabase(a);
  await clearLocalDatabase(a);
  assert.equal(await a.viveiros.count(), 0);
  assert.equal(await b.viveiros.count(), 1); assert.equal(await db.viveiros.count(), 1);
  await importLocalDatabase(backup, a);
  assert.equal((await a.viveiros.toArray())[0].nome, 'Viveiro privado A');
  a.close(); b.close(); db.close();
});
