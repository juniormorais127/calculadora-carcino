import 'fake-indexeddb/auto';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readLocalVisitPhotos, saveLocalVisitPhotos, bindLocalVisitPhotos } from '../src/services/localVisitPhotos.js';
import { getAccountDatabase, exportLocalDatabase } from '../src/services/db.js';
test('fotos ficam locais por conta, sobrevivem a releitura e nunca entram no backup de producao', async () => {
  const files = [{ name: 'viveiro.jpg', type: 'image/jpeg', blob: new Blob(['imagem-local-privada'], { type: 'image/jpeg' }) }];
  await saveLocalVisitPhotos('photo-test', 'draft:visit', files);
  assert.equal(await (await readLocalVisitPhotos('photo-test', 'draft:visit'))[0].blob.text(), 'imagem-local-privada');
  assert.deepEqual(await readLocalVisitPhotos('other-photo-account', 'draft:visit'), []);
  await bindLocalVisitPhotos('photo-test', 'draft:visit', 'visit:123');
  assert.deepEqual(await readLocalVisitPhotos('photo-test', 'draft:visit'), []);
  assert.equal((await readLocalVisitPhotos('photo-test', 'visit:123'))[0].name, 'viveiro.jpg');
  const backup = await exportLocalDatabase(getAccountDatabase('photo-test'));
  assert.equal(backup.includes('viveiro.jpg'), false); assert.equal(backup.includes('imagem-local-privada'), false);
});
