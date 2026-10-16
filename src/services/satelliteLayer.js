import L from 'leaflet';

// Shared between map views and historical comparisons; bounded to roughly
// 24 MB of decoded 256px imagery. Do not persist or download map archives.
const images = new Map(), unavailableUntil = new Map();
function loadImage(source) {
  if ((unavailableUntil.get(source) || 0) > Date.now()) return Promise.reject(new Error('Imagem indisponível'));
  if (!images.has(source)) {
    const entry = { image: null, promise: null };
    entry.promise = new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => { entry.image = image; resolve(image); };
      image.onerror = () => reject(new Error('Imagem indisponível'));
      image.src = source;
    }).catch(error => {
      images.delete(source); unavailableUntil.set(source, Date.now() + 15000);
      if (unavailableUntil.size > 256) unavailableUntil.delete(unavailableUntil.keys().next().value);
      throw error;
    });
    images.set(source, entry);
    if (images.size > 96) images.delete(images.keys().next().value);
  }
  const entry = images.get(source);
  images.delete(source); images.set(source, entry);
  return entry.promise;
}
function tileUrl(url, coords, zoom) {
  const scale = 2 ** (coords.z - zoom);
  return url.replace('{z}', zoom).replace('{x}', Math.floor(coords.x / scale)).replace('{y}', Math.floor(coords.y / scale));
}

// A missing high-resolution tile must not leave a hole in the map. Crop the
// matching part of an available ancestor, preserving its geographic position.
export function satelliteCrop(coords, sourceZoom, width = 256, height = 256) {
  const scale = 2 ** (coords.z - sourceZoom);
  return { x: (coords.x % scale) * width / scale, y: (coords.y % scale) * height / scale, width: width / scale, height: height / scale };
}
export function satelliteLayer(url, options = {}) {
  const Layer = L.GridLayer.extend({
    createTile(coords, done) {
      const canvas = document.createElement('canvas'), size = this.getTileSize();
      canvas.width = size.x; canvas.height = size.y;
      let cancelled = false, finished = false, displayedZoom = -1;
      canvas.cancelImageLoad = () => { cancelled = true; };
      const draw = (image, zoom) => {
        if (cancelled || zoom < displayedZoom) return;
        const crop = satelliteCrop(coords, zoom, image.naturalWidth, image.naturalHeight);
        canvas.getContext('2d').drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, size.x, size.y);
        displayedZoom = zoom;
        if (!finished) { finished = true; done(null, canvas); }
      };
      // Show an already loaded ancestor immediately, then refine it. The
      // template includes the historical release, so dates are never mixed.
      for (let zoom = coords.z; zoom >= 0; zoom--) {
        const cached = images.get(tileUrl(url, coords, zoom))?.image;
        if (cached) { setTimeout(() => draw(cached, zoom), 0); break; }
      }
      if (coords.z > 17) void loadImage(tileUrl(url, coords, 17)).then(image => draw(image, 17)).catch(() => {});
      const render = async () => {
        for (let zoom = coords.z; zoom >= 0 && !cancelled; zoom--) {
          try {
            const image = await loadImage(tileUrl(url, coords, zoom));
            if (cancelled) return;
            draw(image, zoom);
            if (zoom < coords.z) this.fire('resolutionfallback', { requestedZoom: coords.z, sourceZoom: zoom });
            return;
          } catch {
            if (zoom === 0 || navigator.onLine === false) { if (!cancelled && !finished) done(new Error('Não foi possível carregar a imagem do mapa.'), canvas); return; }
          }
        }
      };
      void render();
      return canvas;
    },
  });
  const layer = new Layer({ maxZoom: 22, maxNativeZoom: 19, ...options });
  layer.on('tileunload', event => event.tile.cancelImageLoad?.());
  return layer;
}
