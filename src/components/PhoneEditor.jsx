import React, { useEffect, useState } from 'react';
import { normalizePhone } from '../services/accountPhone.js';

export default function PhoneEditor({ phone, onSave, disabled = false }) {
  const [value, setValue] = useState(phone || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  useEffect(() => { setValue(phone || ''); }, [phone]);
  async function submit(event) {
    event.preventDefault(); setError(''); setMessage('');
    let normalized;
    try { normalized = normalizePhone(value); } catch (err) { setError(err.message); return; }
    setBusy(true);
    try { await onSave(normalized); setValue(normalized); setMessage('Celular atualizado.'); }
    catch { setError('Não foi possível salvar o celular. Confira sua conexão e sua permissão de acesso.'); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="space-y-3">
    <label className="block text-sm font-semibold text-slate-800">Celular com DDD
      <input type="tel" autoComplete="tel" inputMode="tel" required maxLength={24} value={value} onChange={event => setValue(event.target.value)} disabled={busy || disabled} placeholder="(79) 99999-9999" className="mt-1 block w-full min-h-11 rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus-visible:outline-2 focus-visible:outline-emerald-700" />
    </label>
    <p className="text-xs text-slate-600">Número ainda não confirmado por SMS. Confira o DDD e o número antes de salvar. Para outro país, inclua + e o código do país.</p>
    {error && <p role="alert" className="text-sm text-rose-800">{error}</p>}
    {message && <p role="status" className="text-sm text-emerald-900">{message}</p>}
    <button disabled={busy || disabled} className="min-h-11 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700">{busy ? 'Salvando…' : 'Salvar celular'}</button>
  </form>;
}
