import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import offlinePlugin from '../build/offlinePlugin.js';

test('atualização preserva release anterior e serve módulo antigo de uma aba aberta', async () => {
  const plugin = offlinePlugin(); let source;
  plugin.configResolved({ base: '/app/' });
  plugin.generateBundle.call({ emitFile(asset) { source = asset.source; } }, {}, { 'assets/current.js': {} });
  const handlers = {}, deleted = [];
  const oldModule = new Response('old module');
  const fallback = new Response('<html>offline</html>');
  vm.runInNewContext(source, {
    self: { location: { origin: 'https://example.com' }, clients: { claim() {} }, addEventListener(name, handler) { handlers[name] = handler; } },
    caches: {
      keys: async () => ['carcino-obsolete', 'carcino-previous'],
      delete: async key => deleted.push(key),
      match: async () => oldModule,
      open: async () => ({ match: async () => fallback }),
    }, URL, Response, AbortController, setTimeout, clearTimeout,
    fetch: async () => { throw new Error('offline'); },
  });
  let activation;
  handlers.activate({ waitUntil(promise) { activation = promise; } }); await activation;
  assert.deepEqual(deleted, ['carcino-obsolete']);
  let result;
  handlers.fetch({ request: { url: 'https://example.com/app/assets/previous.js', method: 'GET' }, respondWith(promise) { result = promise; } });
  assert.equal(await (await result).text(), 'old module');
  handlers.fetch({ request: { url: 'https://example.com/app/', method: 'GET', mode: 'navigate' }, respondWith(promise) { result = promise; } });
  assert.equal(await (await result).text(), '<html>offline</html>');
});
