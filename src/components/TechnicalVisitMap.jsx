import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LICENSE_LABELS, VISIT_LABELS } from '../services/technicalVisitData.js';

export default function TechnicalVisitMap({ visits }) {
  const host = useRef(null);
  const [error, setError] = useState(false);
  const hasPoints = visits.some(visit => Number.isFinite(visit.latitude) && Number.isFinite(visit.longitude));
  useEffect(() => {
    if (!hasPoints) return;
    setError(false);
    const map = L.map(host.current, { scrollWheelZoom: false }).setView([-10.9, -37.1], 6);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).on('tileerror', () => setError(true)).addTo(map);
    const points = [];
    // Most recent assessment per property/pond/technician; never combines another
    // technician's private history into the current technician's map.
    const seen = new Set();
    [...visits].sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)).forEach(visit => {
      const key = `${visit.ownerUid || visit.clientEmail}/${visit.independent ? visit.farmName : visit.pondId}/${visit.technicianUid}`;
      if (seen.has(key)) return;
      seen.add(key);
      if (!Number.isFinite(visit.latitude) || !Number.isFinite(visit.longitude)) return;
      const point = [visit.latitude, visit.longitude]; points.push(point);
      const color = visit.licenseStatus === 'licensed' ? '#047857' : visit.licenseStatus === 'unlicensed' ? '#be123c' : '#475569';
      const popup = document.createElement('div');
      popup.textContent = `${visit.farmName} · ${visit.pondName} — ${LICENSE_LABELS[visit.licenseStatus]} — ${VISIT_LABELS[visit.status] || 'Cadastro da propriedade'} — Visita: ${visit.visitedOn}`;
      L.circleMarker(point, { radius: 9, color, fillColor: color, fillOpacity: 0.8 }).addTo(map).bindPopup(popup);
    });
    if (points.length) map.fitBounds(points, { padding: [30, 30], maxZoom: 16 });
    const observer = new ResizeObserver(() => map.invalidateSize()); observer.observe(host.current);
    return () => { observer.disconnect(); map.remove(); };
  }, [visits, hasPoints]);
  return <div className="space-y-2">{hasPoints ? <div ref={host} aria-label="Mapa das visitas e do licenciamento" className="relative z-0 h-80 w-full rounded-xl border border-slate-300" /> : <p className="text-sm text-slate-600">O mapa mostrará as visitas que tiverem coordenadas cadastradas.</p>}{error && <p role="status" className="text-xs text-amber-900">O fundo do mapa não carregou. Confira a conexão; as coordenadas e os relatórios continuam disponíveis abaixo.</p>}<p className="text-xs text-slate-600">Verde: licenciada · Vermelho: não licenciada · Cinza: não verificado. Informação declarada pelo técnico, sem validação pelo órgão licenciador. Pontos indicam as coordenadas registradas na visita; propostas podem aguardar aceite.</p></div>;
}
