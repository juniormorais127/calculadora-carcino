import React, { useState } from 'react';
import { validateAccountName } from '../services/accountName.js';

export default function AccountNameEditor({ value, onSave }) {
  const [name, setName] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState('');
  if (value) return <label className="block text-sm font-semibold text-slate-800">Nome do usuário<input readOnly value={value} className="mt-1 block w-full min-h-11 rounded-xl border border-slate-300 bg-slate-50 px-3 text-sm" /><span className="block mt-1 text-xs font-normal text-slate-600">Nome definido no cadastro. Não pode ser alterado.</span></label>;
  return <form className="space-y-3" onSubmit={async event => {
    event.preventDefault(); setBusy(true); setError('');
    try { await onSave(validateAccountName(name)); } catch (err) { setError(err.code ? 'Não foi possível salvar o nome. Confira a conexão.' : err.message); } finally { setBusy(false); }
  }}><label className="block text-sm font-semibold text-slate-800">Nome completo do usuário<input required autoComplete="name" maxLength={200} value={name} onChange={event => setName(event.target.value)} disabled={busy} className="mt-1 block w-full min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm" /></label><p className="text-xs text-slate-600">Confira antes de salvar: este será o nome fixo da conta e não poderá ser alterado.</p>{error && <p role="alert" className="text-sm text-rose-800">{error}</p>}<button disabled={busy} className="min-h-11 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Salvando…' : 'Salvar nome definitivo'}</button></form>;
}
