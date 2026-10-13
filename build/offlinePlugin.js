import { createHash } from 'node:crypto';

export default function offlinePlugin() {
  let base;
  return {
    name: 'carcino-offline',
    apply: 'build',
    configResolved(config) { base = config.base; },
    generateBundle(_options, bundle) {
      const files = ['index.html', 'icon.svg', 'manifest.webmanifest', ...Object.keys(bundle).filter(name => name !== 'index.html')];
      const version = createHash('sha256').update(JSON.stringify(files)).digest('hex').slice(0, 16);
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: `
const CACHE = 'carcino-${version}';
const BASE = ${JSON.stringify(base)};
const FILES = ${JSON.stringify(files)};
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES.map(file => BASE + file))));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('carcino-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || !url.pathname.startsWith(BASE)) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.open(CACHE).then(cache => cache.match(BASE + 'index.html'))));
  } else if (FILES.some(file => url.pathname === BASE + file)) {
    event.respondWith(caches.open(CACHE).then(async cache => (await cache.match(url.pathname, { ignoreVary: true })) || fetch(request)));
  }
});
` });
    },
  };
}
