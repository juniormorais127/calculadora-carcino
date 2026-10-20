import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LICENSE_LABELS, VISIT_LABELS } from '../services/technicalVisitData.js';
import { satelliteLayer } from '../services/satelliteLayer.js';
import MapMeasurements from './MapMeasurements.jsx';
import ImageryCaptureInfo from './ImageryCaptureInfo.jsx';

const satelliteUrl = 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}?blankTile=false';
const clarityUrl = 'https://clarity.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}?blankTile=false';
const satelliteCredit = 'Tiles &copy; Esri &mdash; Esri, Vantor, CNES/Airbus, Earthstar Geographics, IGN, and the GIS User Community';
let archivePromise;
function loadArchive() {
  if (!archivePromise) archivePromise = import('@esri/wayback-core').then(module => module.getWaybackItems()).then(items => {
    const valid = items.filter(item => /^\d{4}-\d{2}-\d{2}$/.test(item.releaseDateLabel) && item.itemURL.startsWith('https://wayback.maptiles.arcgis.com/')).sort((a, b) => a.releaseDateLabel.localeCompare(b.releaseDateLabel));
    if (!valid.length) throw new Error('Sem versões disponíveis');
    return valid;
  }).catch(error => { archivePromise = null; throw error; });
  return archivePromise;
}
export default function TechnicalVisitMap({ visits, historyRequest = 0 }) {
  const host = useRef(null), mapRef = useRef(null), layerRef = useRef(null), markersRef = useRef(null);
  const lastBounds = useRef('');
  const [mapInstance, setMapInstance] = useState(null);
  const [error, setError] = useState(false), [basemap, setBasemap] = useState('satellite');
  const [resolutionFallback, setResolutionFallback] = useState(false);
  const [referenceVisible, setReferenceVisible] = useState(false), [clarityUnavailable, setClarityUnavailable] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false), [archive, setArchive] = useState([]), [historyIndex, setHistoryIndex] = useState(0), [historyError, setHistoryError] = useState(''), [historyLoading, setHistoryLoading] = useState(false);
  const hasPoints = visits.some(visit => Number.isFinite(visit.latitude) && Number.isFinite(visit.longitude));
  const selectedRelease = archive[historyIndex] || null;
  const [settledRelease, setSettledRelease] = useState(null);
  const [historyDate, setHistoryDate] = useState(''), [dateError, setDateError] = useState('');
  useEffect(() => { const timer = setTimeout(() => setSettledRelease(selectedRelease), 180); return () => clearTimeout(timer); }, [selectedRelease]);
  const release = basemap === 'history' ? settledRelease : null;
  useEffect(() => {
    if (!historyRequest || !hasPoints) return;
    setHistoryOpen(true);
    setBasemap('history');
  }, [historyRequest, hasPoints, archive.length]);
  useEffect(() => {
    if (!hasPoints) return;
    const initialPoints = visits.filter(visit => Number.isFinite(visit.latitude) && Number.isFinite(visit.longitude)).map(visit => [visit.latitude, visit.longitude]);
    const map = L.map(host.current, { scrollWheelZoom: false }).fitBounds(initialPoints, { padding: [30, 30], maxZoom: 16 });
    map.createPane('mapReference'); map.getPane('mapReference').style.zIndex = '350'; map.getPane('mapReference').style.pointerEvents = 'none';
    mapRef.current = map; markersRef.current = L.layerGroup().addTo(map);
    setMapInstance(map);
    const observer = new ResizeObserver(() => map.invalidateSize()); observer.observe(host.current);
    return () => { observer.disconnect(); map.remove(); setMapInstance(null); mapRef.current = null; layerRef.current = null; markersRef.current = null; lastBounds.current = ''; };
  }, [hasPoints]);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || (basemap === 'history' && !release)) return;
    setError(false);
    setResolutionFallback(false);
    if (layerRef.current) map.removeLayer(layerRef.current);
    const url = release ? `${release.itemURL.replace('{level}', '{z}').replace('{row}', '{y}').replace('{col}', '{x}')}?blankTile=false` : basemap === 'streets' ? 'https://tile.openstreetmap.org/{z}/{x}/{y}.png' : basemap === 'clarity' ? clarityUrl : satelliteUrl;
    const layer = basemap === 'streets' ? L.tileLayer(url, { maxZoom: 22, maxNativeZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }) : satelliteLayer(url, { attribution: satelliteCredit }).on('resolutionfallback', () => setResolutionFallback(true));
    layerRef.current = layer.on('tileerror', () => { if (basemap === 'clarity') { setClarityUnavailable(true); setBasemap('satellite'); } else setError(true); }).addTo(map);
    layerRef.current.bringToBack();
  }, [hasPoints, basemap, release]);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !referenceVisible || basemap === 'streets') return;
    const layers = ['World_Boundaries_and_Places', 'World_Transportation'].map(name => L.tileLayer(`https://services.arcgisonline.com/ArcGIS/rest/services/Reference/${name}/MapServer/tile/{z}/{y}/{x}`, { pane: 'mapReference', maxZoom: 22, maxNativeZoom: 19, attribution: 'Reference &copy; Esri', updateWhenIdle: true, keepBuffer: 1 }));
    layers.forEach(layer => layer.addTo(map));
    return () => layers.forEach(layer => layer.remove());
  }, [hasPoints, referenceVisible, basemap]);
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
    const boundsKey = points.map(point => point.join(',')).sort().join(';');
    if (points.length && boundsKey !== lastBounds.current) { lastBounds.current = boundsKey; mapRef.current.fitBounds(points, { padding: [30, 30], maxZoom: 16 }); }
  }, [visits, hasPoints]);
  useEffect(() => {
    if (!historyOpen || archive.length) return;
    let disposed = false; setHistoryLoading(true); setHistoryError('');
    loadArchive().then(items => { if (!disposed) { setArchive(items); setHistoryIndex(items.length - 1); setHistoryDate(items[items.length - 1].releaseDateLabel); } }).catch(() => { if (!disposed) setHistoryError('O histórico de imagens está indisponível. Você pode continuar usando o satélite atual ou o mapa de ruas.'); }).finally(() => { if (!disposed) setHistoryLoading(false); });
    return () => { disposed = true; };
  }, [historyOpen, archive.length]);
  const button = 'min-h-11 rounded-xl border px-3 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-emerald-700';
  return <div className="space-y-3">{hasPoints ? <>
    <div role="group" aria-label="Tipo de imagem do mapa" className="flex flex-wrap gap-2">{[['satellite', 'Satélite atual'], ['clarity', 'Satélite nítido'], ['streets', 'Mapa de ruas']].map(([id, label]) => <button key={id} type="button" aria-pressed={basemap === id} className={`${button} ${basemap === id ? 'bg-emerald-700 border-emerald-700 text-white' : 'border-slate-300 bg-white text-slate-800'}`} onClick={() => setBasemap(id)}>{label}</button>)}<button type="button" className={`${button} border-slate-300 bg-white text-slate-800`} aria-expanded={historyOpen} onClick={() => { setHistoryOpen(value => !value); setBasemap(historyOpen ? 'satellite' : 'history'); }}>Comparar imagens históricas</button></div>
    <label className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-slate-800"><input type="checkbox" checked={referenceVisible} onChange={event => setReferenceVisible(event.target.checked)} className="size-5 accent-emerald-700" />Mostrar nomes e vias</label>
    {basemap === 'clarity' && <p className="text-xs text-slate-600">Esri Clarity prioriza nitidez e menos nuvens. As imagens podem ser antigas e a qualidade varia por local; compare com Satélite atual. Não há garantia de ausência total de nuvens.</p>}
    {clarityUnavailable && <p role="status" className="text-sm text-amber-900">O satélite nítido não carregou. Exibindo o satélite atual; seus pontos e medições foram preservados.</p>}
    {historyOpen && <div className="space-y-2 rounded-xl border border-slate-300 bg-slate-50 p-4">{historyLoading ? <p role="status" className="text-sm">Consultando versões históricas do satélite…</p> : historyError ? <p role="status" className="text-sm text-amber-900">{historyError}</p> : archive.length > 0 && <><div className="flex flex-wrap items-end gap-3"><label className="block text-sm font-semibold text-slate-900">Consultar mapa até a data<input type="date" value={historyDate} max={new Date().toISOString().slice(0, 10)} onChange={event => { setHistoryDate(event.target.value); setDateError(''); }} className="mt-1 block min-h-11 max-w-full rounded-xl border border-slate-300 bg-white px-3 py-2" /></label><button type="button" className={`${button} border-slate-300 bg-white text-slate-800`} disabled={!historyDate} onClick={() => {
      if (historyDate > new Date().toISOString().slice(0, 10)) { setDateError('Escolha uma data de hoje ou anterior.'); return; }
      const candidates = archive.map((item, index) => ({ ...item, index })).filter(item => item.releaseDateLabel <= historyDate);
      if (!candidates.length) { setDateError(`Não há versão do mapa até essa data. O arquivo disponível começa em ${archive[0].releaseDateLabel}.`); return; }
      setDateError(''); setHistoryIndex(candidates[candidates.length - 1].index); setBasemap('history');
    }}>Carregar data</button></div>{dateError && <p role="status" className="text-sm text-amber-900">{dateError}</p>}<p className="text-xs text-slate-600">Carrega a publicação disponível mais próxima, sem ultrapassar a data escolhida. Consulte abaixo a captura da foto no ponto desejado.</p><label className="block text-sm font-semibold">Publicação do mapa: {archive[historyIndex].releaseDateLabel}<input aria-label="Data da versão histórica do mapa" type="range" min={0} max={archive.length - 1} value={historyIndex} className="block w-full min-h-11 accent-emerald-700" onChange={event => { const index = Number(event.target.value); setHistoryIndex(index); setHistoryDate(archive[index].releaseDateLabel); setDateError(''); setBasemap('history'); }} /></label><div className="flex justify-between text-xs text-slate-600"><span>{archive[0].releaseDateLabel}</span><span>{archive[archive.length - 1].releaseDateLabel}</span></div><p className="text-xs text-slate-600">Arraste a barra e alterne com “Satélite atual” para comparar o mesmo local. A data identifica a publicação da versão, não o dia da captura. Algumas versões podem mostrar a mesma imagem nesta região.</p></>}</div>}
    {mapInstance && <MapMeasurements map={mapInstance} />}
    <div ref={host} aria-label="Mapa das visitas e do licenciamento" className="relative z-0 h-96 w-full rounded-xl border border-slate-300" />
    {mapInstance && basemap === 'history' && release && <ImageryCaptureInfo map={mapInstance} release={release} layerRef={layerRef} />}
    {resolutionFallback && <p role="status" className="text-xs text-slate-600">Ampliando a melhor imagem disponível neste local. O provedor não oferece mais detalhe em parte desta área, mas você pode continuar aproximando.</p>}
    <p className="text-xs text-slate-600">{basemap === 'history' && release ? `Esri Wayback · Versão publicada em ${release.releaseDateLabel}.` : basemap === 'clarity' ? 'Satélite: Esri World Imagery Clarity. Imagens de arquivo, sem garantia de atualidade.' : basemap === 'satellite' ? 'Satélite: Esri World Imagery. Imagens não são em tempo real; cobertura e resolução variam por região.' : 'Mapa de ruas: OpenStreetMap.'} A imagem ajuda na conferência visual e não comprova, sozinha, propriedade ou licenciamento.</p>
  </> : <p className="text-sm text-slate-600">O mapa mostrará as visitas que tiverem coordenadas cadastradas.</p>}{error && <p role="status" className="text-xs text-amber-900">Algumas imagens do mapa não carregaram. Confira a conexão ou alterne para outro tipo de mapa; as coordenadas e os relatórios continuam disponíveis.</p>}<p className="text-xs text-slate-600">Verde: licenciada · Vermelho: não licenciada · Cinza: não verificado. Informação declarada pelo técnico, sem validação pelo órgão licenciador. Pontos indicam as coordenadas registradas na visita; propostas podem aguardar aceite.</p></div>;
}
