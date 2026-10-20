import test from 'node:test';
import assert from 'node:assert/strict';
import 'fake-indexeddb/auto';
import { createDatabase } from '../src/services/db.js';
import { loadChecklist, saveChecklist } from '../src/services/checklistService.js';

test('checklist pertence à conta e entra no backup do produtor correto', async () => {
  const a = createDatabase(`checklist-a-${crypto.randomUUID()}`), b = createDatabase(`checklist-b-${crypto.randomUUID()}`);
  try {
    await saveChecklist({ biosseguranca: true }, a);
    assert.deepEqual(await loadChecklist(a), { biosseguranca: true });
    assert.deepEqual(await loadChecklist(b), {});
    assert.equal((await a.configuracoes.toArray())[0].chave, 'checklistBPM');
    await saveChecklist({ biosseguranca: false }, b);
    assert.deepEqual(await loadChecklist(a), { biosseguranca: true });
  } finally { a.close(); b.close(); await a.delete(); await b.delete(); }
});
