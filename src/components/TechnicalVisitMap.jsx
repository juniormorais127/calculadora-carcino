import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LICENSE_LABELS, VISIT_LABELS } from '../services/technicalVisitData.js';
import { satelliteLayer } from '../services/satelliteLayer.js';

const satelliteUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}?blankTile=false';
const satelliteCredit = 'Tiles &copy; Esri &mdash; Esri, Maxar, Earthstar Geographics, and the GIS User Community';
let archivePromise;
function loadArchive() {
  if (!archivePromise) archivePromise = import('@esri/wayback-core').then(module => module.getWaybackItems()).then(items => {
    const valid = items.filter(item => /^\d{4}-\d{2}-\d{2}$/.test(item.releaseDateLabel) && item.itemURL.startsWith('https://wayback.maptiles.arcgis.com/')).sort((a, b) => a.releaseDateLabel.localeCompare(b.releaseDateLabel));
    if (!valid.length) throw new Error('Sem versões disponíveis');
    return valid;
  }).catch(error => { archivePromise = null; throw error; });
  return archivePromise;
}
export default function TechnicalVisitMap({ visits }) {
  const host = useRef(null), mapRef = useRef(null), layerRef = useRef(null), markersRef = useRef(null);
  const [error, setError] = useState(false), [basemap, setBasemap] = useState('satellite');
  const [resolutionFallback, setResolutionFallback] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false), [archive, setArchive] = useState([]), [historyIndex, setHistoryIndex] = useState(0), [historyError, setHistoryError] = useState(''), [historyLoading, setHistoryLoading] = useState(false);
  const hasPoints = visits.some(visit => Number.isFinite(visit.latitude) && Number.isFinite(visit.longitude));
  const release = basemap === 'history' ? archive[historyIndex] : null;
  useEffect(() => {
    if (!hasPoints) return;
    const map = L.map(host.current, { scrollWheelZoom: false }).setView([-10.9, -37.1], 6);
    mapRef.current = map; markersRef.current = L.layerGroup().addTo(map);
    const observer = new ResizeObserver(() => map.invalidateSize()); observer.observe(host.current);
    return () => { observer.disconnect(); map.remove(); mapRef.current = null; layerRef.current = null; markersRef.current = null; };
  }, [hasPoints]);
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    setError(false);
    setResolutionFallback(false);
    if (layerRef.current) map.removeLayer(layerRef.current);
    const url = release ? `${release.itemURL.replace('{level}', '{z}').replace('{row}', '{y}').replace('{col}', '{x}')}?blankTile=false` : basemap === 'streets' ? 'https://tile.openstreetmap.org/{z}/{x}/{y}.png' : satelliteUrl;
    const layer = basemap === 'streets' ? L.tileLayer(url, { maxZoom: 22, maxNativeZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }) : satelliteLayer(url, { attribution: satelliteCredit }).on('resolutionfallback', () => setResolutionFallback(true));
    layerRef.current = layer.on('tileerror', () => setError(true)).addTo(map);
    layerRef.current.bringToBack();
  }, [hasPoints, basemap, release]);
  useEffect(() => {
    if (!hasPoints || !mapRef.current) return;
    markersRef.current.clearLayers();
    const points = [], seen = new Set();
    [...visits].sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)).forEach(visit => {
      const key = `${visit.recipientUid || visit.ownerUid || visit.clientEmail}/${visit.independent ? visit.farmName : visit.pondId}/${visit.technicianUid}`;
      if (seen.has(key)) return;
      seen.add(key);
      if (!Number.isFinite(visit.latitude) || !Number.isFinite(visit.longitude)) return;
      const point = [visit.latitude, visit.longitude]; points.push(point);
      const color = visit.licenseStatus === 'licensed' ? '#047857' : visit.licenseStatus === 'unlicensed' ? '#be123c' : '#475569';
      const popup = document.createElement('div');
      popup.textContent = `${visit.farmName} · ${visit.pondName} — ${LICENSE_LABELS[visit.licenseStatus]} — ${VISIT_LABELS[visit.status] || 'Cadastro da propriedade'} — Visita: ${visit.visitedOn}`;
      L.circleMarker(point, { radius: 9, color, weight: 3, fillColor: color, fillOpacity: 0.85 }).addTo(markersRef.current).bindPopup(popup);
    });
    if (points.length) mapRef.current.fitBounds(points, { padding: [30, 30], maxZoom: 16 });
  }, [visits, hasPoints]);
  useEffect(() => {
    if (!historyOpen || archive.length) return;
    let disposed = false; setHistoryLoading(true); setHistoryError('');
    loadArchive().then(items => { if (!disposed) { setArchive(items); setHistoryIndex(items.length - 1); setBasemap('history'); } }).catch(() => { if (!disposed) setHistoryError('O histórico de imagens está indisponível. Você pode continuar usando o satélite atual ou o mapa de ruas.'); }).finally(() => { if (!disposed) setHistoryLoading(false); });
    return () => { disposed = true; };
  }, [historyOpen, archive.length]);
  const button = 'min-h-11 rounded-xl border px-3 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-emerald-700';
  return <div className="space-y-3">{hasPoints ? <>
    <div role="group" aria-label="Tipo de imagem do mapa" className="flex flex-wrap gap-2">{[['satellite', 'Satélite atual'], ['streets', 'Mapa de ruas']].map(([id, label]) => <button key={id} type="button" aria-pressed={basemap === id} className={`${button} ${basemap === id ? 'bg-emerald-700 border-emerald-700 text-white' : 'border-slate-300 bg-white text-slate-800'}`} onClick={() => setBasemap(id)}>{label}</button>)}<button type="button" className={`${button} border-slate-300 bg-white text-slate-800`} aria-expanded={historyOpen} onClick={() => { setHistoryOpen(value => !value); if (archive.length) setBasemap('history'); }}>Comparar imagens históricas</button></div>
    {historyOpen && <div className="space-y-2 rounded-xl border border-slate-300 bg-slate-50 p-4">{historyLoading ? <p role="status" className="text-sm">Consultando versões históricas do satélite…</p> : historyError ? <p role="status" className="text-sm text-amber-900">{historyError}</p> : archive.length > 0 && <><label className="block text-sm font-semibold">Versão histórica do mapa: {archive[historyIndex].releaseDateLabel}<input aria-label="Data da versão histórica do mapa" type="range" min={0} max={archive.length - 1} value={historyIndex} className="block w-full min-h-11 accent-emerald-700" onChange={event => { setHistoryIndex(Number(event.target.value)); setBasemap('history'); }} /></label><div className="flex justify-between text-xs text-slate-600"><span>{archive[0].releaseDateLabel}</span><span>{archive[archive.length - 1].releaseDateLabel}</span></div><p className="text-xs text-slate-600">Arraste a barra e alterne com “Satélite atual” para comparar o mesmo local. A data identifica a publicação da versão, não o dia da captura. Algumas versões podem mostrar a mesma imagem nesta região.</p></>}</div>}
    <div ref={host} aria-label="Mapa das visitas e do licenciamento" className="relative z-0 h-96 w-full rounded-xl border border-slate-300" />
    {resolutionFallback && <p role="status" className="text-xs text-slate-600">Ampliando a melhor imagem disponível neste local. O provedor não oferece mais detalhe em parte desta área, mas você pode continuar aproximando.</p>}
    <p className="text-xs text-slate-600">{basemap === 'history' && release ? `Esri Wayback · Versão publicada em ${release.releaseDateLabel}.` : basemap === 'satellite' ? 'Satélite: Esri World Imagery. Imagens não são em tempo real; cobertura e resolução variam por região.' : 'Mapa de ruas: OpenStreetMap.'} A imagem ajuda na conferência visual e não comprova, sozinha, propriedade ou licenciamento.</p>
  </> : <p className="text-sm text-slate-600">O mapa mostrará as visitas que tiverem coordenadas cadastradas.</p>}{error && <p role="status" className="text-xs text-amber-900">Algumas imagens do mapa não carregaram. Confira a conexão ou alterne para outro tipo de mapa; as coordenadas e os relatórios continuam disponíveis.</p>}<p className="text-xs text-slate-600">Verde: licenciada · Vermelho: não licenciada · Cinza: não verificado. Informação declarada pelo técnico, sem validação pelo órgão licenciador. Pontos indicam as coordenadas registradas na visita; propostas podem aguardar aceite.</p></div>;
}
