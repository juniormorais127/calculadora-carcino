import test from 'node:test';
import assert from 'node:assert/strict';
import { nativePhotoFiles } from '../src/services/nativePhotoFiles.js';
const file = { name: 'pond.jpg', type: 'image/jpeg', blob: new Blob(['local-only']) };
const encode = async blob => Buffer.from(await blob.arrayBuffer()).toString('base64');
test('native photo files preserve content, reject another account path, and rollback failed batches', async () => {
  const disk = new Map(); let fail = false, written = 0;
  const filesystem = {
    async writeFile({ path, data }) { if (fail && ++written === 2) throw new Error('disk full'); disk.set(path, data); },
    async readFile({ path }) { return { data: disk.get(path) }; },
    async deleteFile({ path }) { disk.delete(path); },
  };
  const store = nativePhotoFiles(filesystem, 'DATA', encode);
  const old = await store.write('one', [file]);
  assert.equal(await (await store.read('one', old))[0].blob.text(), 'local-only');
  await assert.rejects(() => store.read('two', old), /inválido/);
  fail = true;
  await assert.rejects(() => store.write('one', [file, file]), /disk full/);
  assert.equal(disk.size, 1); assert.ok(disk.has(old[0].path));
});
