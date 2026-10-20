import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import { Ruler, Route, Pentagon, Undo2, Trash2, Crosshair } from 'lucide-react';
import { measureMapPoints, formatDistance, formatArea } from '../services/mapMeasurements.js';

export default function MapMeasurements({ map }) {
  const [mode, setMode] = useState(null), [points, setPoints] = useState([]), [finished, setFinished] = useState(false);
  const [message, setMessage] = useState('');
  const state = useRef({ mode, finished }); state.current = { mode, finished };
  const id = useId();
  const result = useMemo(() => measureMapPoints(points, mode || 'path'), [points, mode]);
  const add = point => {
    const wrapped = map.wrapLatLng(point); point = [wrapped.lat, wrapped.lng];
    setPoints(previous => {
      if (previous.length >= 200) return previous;
      if (previous.length && map.distance(previous.at(-1), point) < 0.05) return previous;
      return [...previous, point];
    });
  };
  useEffect(() => {
    const click = event => { if (state.current.mode && !state.current.finished) add([event.latlng.lat, event.latlng.lng]); };
    map.on('click', click);
    return () => map.off('click', click);
  }, [map]);
  useEffect(() => {
    if (!mode) return;
    const container = map.getContainer(), previous = container.style.cursor;
    container.style.cursor = finished ? previous : 'crosshair';
    const doubleClick = map.doubleClickZoom.enabled();
    if (!finished) map.doubleClickZoom.disable();
    return () => { container.style.cursor = previous; if (doubleClick) map.doubleClickZoom.enable(); };
  }, [map, mode, finished]);
  useEffect(() => {
    const group = L.layerGroup().addTo(map);
    const color = result.invalid ? '#be123c' : '#0369a1';
    if (points.length >= 2) {
      const shape = mode === 'polygon' && points.length >= 3 ? L.polygon(points, { color, weight: 3, fillOpacity: 0.18, interactive: false }) : L.polyline(points, { color, weight: 3, interactive: false });
      shape.addTo(group);
    }
    points.forEach((point, index) => {
      const marker = L.marker(point, {
        draggable: true, keyboard: true, autoPan: true, title: `Ponto ${index + 1}: arraste para ajustar`,
        icon: L.divIcon({ className: '', html: `<span style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;border:2px solid #fff;border-radius:50%;background:#075985;color:white;font:bold 13px sans-serif;box-shadow:0 2px 5px #0008">${index + 1}</span>`, iconSize: [32, 32], iconAnchor: [16, 16] }),
      }).addTo(group);
      marker.on('dragend', () => { const at = map.wrapLatLng(marker.getLatLng()); setPoints(previous => previous.map((p, i) => i === index ? [at.lat, at.lng] : p)); });
      marker.on('click', event => { L.DomEvent.stopPropagation(event); });
    });
    return () => group.remove();
  }, [map, points, mode, result.invalid]);
  const minimum = mode === 'polygon' ? 3 : 2;
  const start = next => {
    if (points.length && !window.confirm('Iniciar outra medição apagará o desenho atual. Continuar?')) return;
    setMode(next); setPoints([]); setFinished(false); setMessage('');
  };
  const clear = () => {
    if (points.length && !window.confirm('Apagar esta medição?')) return;
    setPoints([]); setMode(null); setFinished(false); setMessage('Medição apagada.');
  };
  const button = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:opacity-50';
  return <section aria-labelledby={id} className="space-y-3 rounded-xl border border-slate-300 bg-slate-50 p-4">
    <h3 id={id} className="flex items-center gap-2 font-bold text-slate-900"><Ruler className="size-5" aria-hidden="true" />Medir no mapa</h3>
    <div className="flex flex-wrap gap-2"><button className={`${button} aria-pressed:bg-emerald-800 aria-pressed:text-white`} type="button" aria-pressed={mode === 'path'} onClick={() => start('path')}><Route className="size-4" aria-hidden="true" />Medir</button><button className={`${button} aria-pressed:bg-emerald-800 aria-pressed:text-white`} type="button" aria-pressed={mode === 'polygon'} onClick={() => start('polygon')}><Pentagon className="size-4" aria-hidden="true" />Polígono / área</button></div>
    {!mode ? <p className="text-sm text-slate-700">Escolha Medir para medir distâncias ou Polígono para contornar uma área.</p> : <>
      <p className="text-sm text-slate-700">{finished ? 'Medição concluída. Arraste os pontos para corrigir o desenho ou retome para adicionar pontos.' : `Toque no mapa para adicionar os pontos em sequência. ${mode === 'polygon' ? 'Use ao menos 3 pontos; o contorno fecha automaticamente.' : 'Use ao menos 2 pontos.'} Arraste os pontos para ajustar.`}</p>
      <div className="flex flex-wrap gap-2">
        {!finished && <button className={button} type="button" disabled={points.length >= 200} onClick={() => { const at = map.getCenter(); add([at.lat, at.lng]); }}><Crosshair className="size-4" aria-hidden="true" />Adicionar centro do mapa</button>}
        <button className={button} type="button" disabled={!points.length} onClick={() => { setPoints(p => p.slice(0, -1)); setFinished(false); }}><Undo2 className="size-4" aria-hidden="true" />Desfazer ponto</button>
        <button className={button} type="button" disabled={!finished && (points.length < minimum || result.invalid)} onClick={() => setFinished(value => !value)}>{finished ? 'Continuar desenho' : 'Concluir medição'}</button>
        <button className={button} type="button" onClick={clear}><Trash2 className="size-4" aria-hidden="true" />Limpar medição</button>
      </div>
      <div role="status" className="space-y-1 text-sm text-slate-900"><p>{points.length} de 200 pontos{finished ? ' · concluída' : ' · em desenho'}</p>
        {points.length >= 2 && <p className="font-semibold">{mode === 'polygon' && points.length >= 3 ? `Perímetro: ${formatDistance(result.perimeter)}` : `Distância total: ${formatDistance(result.length)}`}</p>}
        {mode === 'polygon' && points.length >= 3 && !result.invalid && <p className="font-semibold">Área: {formatArea(result.area)}</p>}
        {result.invalid && <p className="text-rose-800">O contorno cruza a si mesmo, repete pontos ou não forma uma área. Arraste ou desfaça os pontos para corrigir.</p>}
        {points.length >= 200 && <p>Limite de pontos atingido. Conclua ou ajuste os pontos existentes.</p>}
      </div>
      {result.segments.length > 0 && <details><summary className="min-h-11 cursor-pointer py-2 text-sm font-semibold text-slate-800">Distância de cada trecho</summary><ol className="max-h-40 space-y-1 overflow-auto text-sm text-slate-700">{result.segments.map((length, index) => <li key={index}>Ponto {index + 1} → {index + 1 === points.length ? 1 : index + 2}: {formatDistance(length)}</li>)}</ol></details>}
      <p className="text-xs text-slate-600">Medição temporária: sai ao fechar esta tela. Não altera cadastros. Medidas aproximadas sobre a superfície, sem considerar relevo; não substituem levantamento topográfico.</p>
    </>}
    {message && <p role="status" className="text-sm text-slate-700">{message}</p>}
  </section>;
}
