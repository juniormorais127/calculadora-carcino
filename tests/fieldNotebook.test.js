import 'fake-indexeddb/auto';
import test from 'node:test';
import assert from 'node:assert/strict';
import { listLocalReports, saveLocalReport } from '../src/services/fieldNotebook.js';
test('local field reports survive reopening and remain isolated by account', async () => {
  await saveLocalReport('notebook-test', { id: 'visit', farmName: 'Property', summary: 'Local report', latitude: -10, longitude: -37 });
  assert.equal((await listLocalReports('notebook-test'))[0].summary, 'Local report');
  assert.deepEqual(await listLocalReports('other-notebook'), []);
  await saveLocalReport('notebook-test', { id: 'visit', summary: 'Updated' });
  assert.equal((await listLocalReports('notebook-test')).length, 1);
  assert.equal((await listLocalReports('notebook-test'))[0].summary, 'Updated');
});
