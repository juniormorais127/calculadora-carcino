import React, { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';

export default function PondLocationFields({ value, onChange }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const request = useRef(0);
  useEffect(() => () => { request.current++; }, []);
  function locate() {
    setError('');
    if (!navigator.geolocation) { setError('GPS indisponível neste navegador. Informe as coordenadas manualmente.'); return; }
    const id = ++request.current;
    setBusy(true);
    navigator.geolocation.getCurrentPosition(position => {
      if (id !== request.current) return;
      setBusy(false);
      onChange({ latitude: String(position.coords.latitude), longitude: String(position.coords.longitude), locationAccuracyM: position.coords.accuracy, locationCapturedAt: new Date(position.timestamp).toISOString() });
    }, err => {
      if (id !== request.current) return;
      setBusy(false);
      setError(err.code === 1 ? 'Permita o acesso à localização nas configurações do navegador ou preencha manualmente.' : err.code === 3 ? 'O GPS demorou para responder. Tente novamente em local aberto ou preencha manualmente.' : 'Não foi possível obter sua posição. Ative a localização do aparelho ou preencha manualmente.');
    }, { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 });
  }
  function edit(field, text) {
    request.current++; setBusy(false); setError('');
    onChange({ ...value, [field]: text, locationAccuracyM: null, locationCapturedAt: null });
  }
  return <fieldset className="space-y-3 border-t border-slate-200 pt-4">
    <legend className="text-sm font-semibold text-slate-800">Localização do viveiro</legend>
    <p className="text-xs text-slate-600">No viveiro, use a posição do celular ou digite as coordenadas em graus decimais. A precisão do GPS varia; confira o ponto antes de salvar.</p>
    <button type="button" onClick={locate} disabled={busy} className="min-h-11 flex items-center gap-2 rounded-xl border border-emerald-700 px-3 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-emerald-700"><MapPin className="w-4 h-4" />{busy ? 'Obtendo localização…' : 'Usar GPS do celular'}</button>
    {busy && <p role="status" className="text-xs text-slate-600">Autorize o acesso à localização quando o navegador solicitar.</p>}
    {error && <p role="alert" className="text-sm text-rose-800">{error}</p>}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <label className="block text-xs font-semibold text-slate-700">Latitude<input type="text" inputMode="decimal" value={value.latitude} onChange={event => edit('latitude', event.target.value)} placeholder="Ex.: -10,9472" className="mt-1 w-full min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 focus-visible:outline-2 focus-visible:outline-emerald-700" /></label>
      <label className="block text-xs font-semibold text-slate-700">Longitude<input type="text" inputMode="decimal" value={value.longitude} onChange={event => edit('longitude', event.target.value)} placeholder="Ex.: -37,0731" className="mt-1 w-full min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 focus-visible:outline-2 focus-visible:outline-emerald-700" /></label>
    </div>
    {Number.isFinite(value.locationAccuracyM) && <p role="status" className="text-xs text-slate-700">Precisão informada pelo GPS: aproximadamente {Math.round(value.locationAccuracyM)} m.</p>}
    <p className="text-xs text-slate-600">Opcional. Para remover a localização, apague as duas coordenadas.</p>
  </fieldset>;
}
