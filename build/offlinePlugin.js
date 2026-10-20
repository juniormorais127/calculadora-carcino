import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

export default function offlinePlugin() {
  let base;
  return {
    name: 'carcino-offline',
    apply: 'build',
    configResolved(config) { base = config.base; },
    generateBundle(_options, bundle) {
      const diseaseImages = [
        'images/doencas/wssv.jpg',
        'images/doencas/imnv.png',
        'images/doencas/ahpnd.jpg',
        'images/doencas/nhp.jpg',
        'images/doencas/ehp.jpg',
        'images/doencas/vibriose.png'
      ];
      const files = ['index.html', 'admin/index.html', 'icon.svg', 'manifest.webmanifest', ...diseaseImages, ...Object.keys(bundle).filter(name => name !== 'index.html' && name !== 'admin/index.html')];
      const version = createHash('sha256').update(JSON.stringify(files)).update(readFileSync(new URL('../public/icon.svg', import.meta.url))).digest('hex').slice(0, 16);
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: `
const CACHE = 'carcino-${version}';
const BASE = ${JSON.stringify(base)};
const FILES = ${JSON.stringify(files)};
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES.map(file => BASE + file))));
});
self.addEventListener('activate', event => {
  // Keep the preceding release for tabs still running its hashed modules.
  event.waitUntil(caches.keys().then(keys => {
    const previous = keys.filter(key => key.startsWith('carcino-') && key !== CACHE);
    return Promise.all(previous.slice(0, -1).map(key => caches.delete(key)));
  }).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || !url.pathname.startsWith(BASE)) return;
  if (request.mode === 'navigate') {
    const fallback = url.pathname.startsWith(BASE + 'central-operacional/') ? 'central-operacional/index.html' : url.pathname.startsWith(BASE + 'admin/') ? 'admin/index.html' : 'index.html';
    event.respondWith((async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      try {
        const response = await fetch(request, { signal: controller.signal });
        if (!response.ok) throw new Error('Navigation unavailable');
        return response;
      } catch {
        return (await (await caches.open(CACHE)).match(BASE + fallback)) || Response.error();
      } finally { clearTimeout(timer); }
    })());
  } else if (FILES.some(file => url.pathname === BASE + file)) {
    event.respondWith(caches.open(CACHE).then(async cache => (await cache.match(url.pathname, { ignoreVary: true })) || fetch(request)));
  } else if (url.pathname.startsWith(BASE + 'assets/')) {
    event.respondWith(caches.match(request, { ignoreVary: true }).then(cached => cached || fetch(request)));
  }
});
` });
    },
  };
}
