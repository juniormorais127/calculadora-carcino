import L from 'leaflet';

// A missing high-resolution tile must not leave a hole in the map. Crop the
// matching part of an available ancestor, preserving its geographic position.
export function satelliteCrop(coords, sourceZoom, width = 256, height = 256) {
  const scale = 2 ** (coords.z - sourceZoom);
  return { x: (coords.x % scale) * width / scale, y: (coords.y % scale) * height / scale, width: width / scale, height: height / scale };
}
export function satelliteLayer(url, options = {}) {
  const images = new Map();
  function loadImage(source) {
    if (!images.has(source)) {
      const promise = new Promise((resolve, reject) => {
        const image = new Image(); image.onload = () => resolve(image); image.onerror = () => reject(new Error('Imagem indisponível')); image.src = source;
      }).catch(error => { images.delete(source); throw error; });
      images.set(source, promise);
      if (images.size > 128) images.delete(images.keys().next().value);
    }
    return images.get(source);
  }
  const Layer = L.GridLayer.extend({
    createTile(coords, done) {
      const canvas = document.createElement('canvas'), size = this.getTileSize();
      canvas.width = size.x; canvas.height = size.y;
      let cancelled = false;
      canvas.cancelImageLoad = () => { cancelled = true; };
      const render = async () => {
        for (let zoom = coords.z; zoom >= 0 && !cancelled; zoom--) {
          const scale = 2 ** (coords.z - zoom);
          const source = url.replace('{z}', zoom).replace('{x}', Math.floor(coords.x / scale)).replace('{y}', Math.floor(coords.y / scale));
          try {
            const image = await loadImage(source);
            if (cancelled) return;
            const crop = satelliteCrop(coords, zoom, image.naturalWidth, image.naturalHeight);
            canvas.getContext('2d').drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, size.x, size.y);
            if (zoom < coords.z) this.fire('resolutionfallback', { requestedZoom: coords.z, sourceZoom: zoom });
            done(null, canvas); return;
          } catch {
            if (zoom === 0 || navigator.onLine === false) { if (!cancelled) done(new Error('Não foi possível carregar a imagem do mapa.'), canvas); return; }
          }
        }
      };
      void render();
      return canvas;
    },
  });
  const layer = new Layer({ maxZoom: 22, maxNativeZoom: 19, ...options });
  layer.on('tileunload', event => event.tile.cancelImageLoad?.());
  layer.on('remove', () => images.clear());
  return layer;
}
