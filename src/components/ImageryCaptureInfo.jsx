import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';

export default function ImageryCaptureInfo({ map, release, layerRef }) {
  const [state, setState] = useState(null), [busy, setBusy] = useState(false);
  const request = useRef(0);
  useEffect(() => { request.current++; setState(null); setBusy(false); return () => { request.current++; }; }, [release.releaseNum]);
  useEffect(() => {
    if (!state?.point) return;
    const marker = L.circleMarker(state.point, { radius: 7, color: '#92400e', fillColor: '#fef3c7', fillOpacity: 1, weight: 3, interactive: false }).addTo(map).bindTooltip('Local da consulta da imagem', { permanent: true, direction: 'top' });
    return () => marker.remove();
  }, [map, state?.point]);
  async function check() {
    const ticket = ++request.current;
    const point = map.getCenter().wrap(), zoom = layerRef.current?.sourceZoomAt?.(point);
    if (!Number.isFinite(zoom)) { setState({ error: 'Aguarde a imagem carregar no centro do mapa e tente novamente.' }); return; }
    setBusy(true); setState(null);
    let timer;
    try {
      const { getMetadata } = await import('@esri/wayback-core');
      const data = await Promise.race([getMetadata({ latitude: point.lat, longitude: point.lng }, zoom, release.releaseNum), new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('timeout')), 12000); })]);
      if (ticket !== request.current) return;
      const date = Number(data?.date), published = Date.parse(release.releaseDateLabel);
      const validDate = Number.isFinite(date) && date > 0 && date <= published + 86400000;
      setState({ point, zoom, data, captureDate: validDate ? new Date(date).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : null });
    } catch { if (ticket === request.current) setState({ point, error: 'O provedor não retornou os dados da captura. A data da publicação não será usada como substituta. Tente novamente.' }); }
    finally { clearTimeout(timer); if (ticket === request.current) setBusy(false); }
  }
  return <section className="space-y-3 rounded-xl border border-slate-300 bg-slate-50 p-4" aria-label="Conferir data da imagem">
    <h3 className="font-bold text-slate-900">Quando esta imagem foi capturada?</h3>
    <p className="text-sm text-slate-700">Versão exibida: publicada em {release.releaseDateLabel}. Centralize o local desejado no mapa e consulte. A data pode mudar entre locais e níveis de detalhe.</p>
    <button type="button" disabled={busy} onClick={() => void check()} className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-emerald-700 disabled:opacity-50">{busy ? 'Consultando captura…' : 'Consultar captura no centro do mapa'}</button>
    {state && <div role="status" className="space-y-2 text-sm text-slate-800">
      {state.point && <p>Local consultado: {state.point.lat.toFixed(6)}, {state.point.lng.toFixed(6)} · nível da imagem: {state.zoom ?? 'não informado'}.</p>}
      {state.error ? <p>{state.error}</p> : <><p className="font-semibold">Data de captura informada pelo provedor: {state.captureDate || 'não disponível para este ponto'}</p><p>Fonte: {state.data?.provider || 'não informada'} · sensor: {state.data?.source || 'não informado'}.</p><p>Resolução: {Number.isFinite(state.data?.resolution) && state.data.resolution > 0 ? `${state.data.resolution.toLocaleString('pt-BR')} m/pixel` : 'não informada'}.</p></>}
    </div>}
    <p className="text-xs text-slate-600">O arquivo Wayback começa em 2014, mas pode conter fotos anteriores. Não há uma foto nova para cada ano. A consulta descreve o ponto marcado, não toda a área visível. Nomes e vias são referências atuais, mesmo sobre fotos antigas.</p>
  </section>;
}
