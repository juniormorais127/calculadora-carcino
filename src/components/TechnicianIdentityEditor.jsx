import InfoDisclosure from './InfoDisclosure.jsx';
import React, { useEffect, useRef, useState } from 'react';
import { prepareTechnicianPhoto, validateTechnicianIdentity, hasTechnicianIdentity } from '../services/technicianIdentity.js';

export default function TechnicianIdentityEditor({ value, accountName, onSave, loading, loadError }) {
  const [fullName, setFullName] = useState(''), [creaNumber, setCreaNumber] = useState(''), [photoDataUrl, setPhotoDataUrl] = useState('');
  const [employmentType, setEmploymentType] = useState(''), [organizationName, setOrganizationName] = useState('');
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState('');
  const [editing, setEditing] = useState(false);
  const photoInput = useRef(null);
  useEffect(() => { setFullName(accountName || value?.fullName || ''); setCreaNumber(value?.creaNumber || ''); setPhotoDataUrl(value?.photoDataUrl || ''); setEmploymentType(value?.employmentType || ''); setOrganizationName(value?.organizationName || ''); }, [value, accountName]);
  const complete = hasTechnicianIdentity(value) && value.fullName === accountName;
  async function photo(event) {
    const file = event.target.files?.[0]; if (!file) return;
    setBusy(true); setError(''); setMessage('');
    try { setPhotoDataUrl(await prepareTechnicianPhoto(file)); setEditing(true); setMessage('Foto selecionada. Salve a identificação profissional para confirmar.'); } catch (err) { setError(err.message || 'Não foi possível abrir a foto. Escolha outro arquivo.'); }
    finally { setBusy(false); event.target.value = ''; }
  }
  async function submit(event) {
    event.preventDefault(); setError(''); setMessage(''); setBusy(true);
    try { const data = validateTechnicianIdentity({ fullName, creaNumber, photoDataUrl, employmentType, organizationName }); await onSave(data); setMessage('Identificação profissional salva.'); setEditing(false); }
    catch (err) { setError(err.code ? 'Não foi possível salvar sua identificação. Confira a conexão e sua permissão de técnico.' : err.message); }
    finally { setBusy(false); }
  }
  const input = 'mt-1 block w-full min-h-11 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-2 focus-visible:outline-emerald-700';
  return <section className="max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 space-y-4"><h3 className="text-lg font-bold">Identificação do técnico</h3>
    {loading ? <p role="status" className="text-sm text-slate-600">Consultando identificação…</p> : <>
      {loadError && <p role="alert" className="text-sm text-rose-800">{loadError}</p>}
      <InfoDisclosure label="Identificação profissional">A identificação usa o nome fixo da conta, sua foto e o tipo de atendimento. O CREA é opcional. O cliente verá esses dados para identificar o profissional.</InfoDisclosure>
      <input ref={photoInput} type="file" aria-label="Foto do técnico (obrigatória)" accept="image/jpeg,image/png,image/webp" onChange={photo} disabled={busy} className="hidden" />
      <button type="button" disabled={busy} onClick={() => photoInput.current?.click()} className="min-h-11 rounded-xl border border-emerald-700 px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50 disabled:opacity-50">{photoDataUrl ? 'Trocar foto do técnico' : 'Anexar foto do técnico'}</button>
      {complete && !editing ? <div className="space-y-3"><div className="flex items-center gap-3"><img src={value.photoDataUrl} alt={`Foto de ${value.fullName}`} className="h-20 w-20 rounded-xl object-cover" /><div><p className="font-semibold">{value.fullName}</p><p className="text-sm">{value.creaNumber ? `CREA: ${value.creaNumber}` : 'N\u00e3o tem CREA cadastrado'}</p><p className="text-sm">{value.employmentType === 'organization' ? value.organizationName : 'Atendimento particular'}</p></div></div><button type="button" className="min-h-11 text-sm font-semibold text-emerald-800 underline underline-offset-4" onClick={() => setEditing(true)}>Editar identificação profissional</button></div> : <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm font-semibold">Nome completo do técnico<input readOnly value={fullName} className={`${input} bg-slate-50`} /></label>
        <p className="text-xs text-slate-600">Nome definido na conta. Não pode ser alterado.</p>
        <label className="block text-sm font-semibold">Número do CREA e UF (opcional)<input placeholder="Ex.: CREA-SE 123456" maxLength={80} value={creaNumber} onChange={event => setCreaNumber(event.target.value)} disabled={busy} className={input} /></label>
        {!creaNumber && <p className="text-sm text-slate-700">Não tem CREA cadastrado.</p>}
        <label className="block text-sm font-semibold">Tipo de atendimento<select required value={employmentType} onChange={event => setEmploymentType(event.target.value)} disabled={busy} className={input}><option value="">Selecione</option><option value="private">Atendimento particular</option><option value="organization">Vinculado a órgão ou empresa</option></select></label>
        {employmentType === 'organization' && <label className="block text-sm font-semibold">Nome do órgão ou empresa<input required list="technical-organizations" maxLength={200} value={organizationName} onChange={event => setOrganizationName(event.target.value)} disabled={busy} className={input} placeholder="Ex.: Senar, Prefeitura, Sebrae ou empresa" /><datalist id="technical-organizations"><option value="Senar" /><option value="Sebrae" /><option value="Prefeitura" /><option value="Emater" /></datalist></label>}
        {photoDataUrl && <img src={photoDataUrl} alt="Prévia da foto do técnico" className="h-24 w-24 rounded-xl object-cover" />}
        <p className="text-xs text-slate-600">JPG, PNG ou WebP, até 5 MB. A imagem será reduzida antes de salvar.</p>
        <button disabled={busy} className="min-h-11 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50">{busy ? 'Salvando…' : 'Salvar identificação profissional'}</button>
      </form>}
      <p className="text-xs text-slate-600">CREA informado pelo profissional. O sistema ainda não consulta o conselho para confirmar o registro.</p>
      {error && <p role="alert" className="text-sm text-rose-800">{error}</p>}{message && <p role="status" className="text-sm text-emerald-900">{message}</p>}
    </>}
  </section>;
}
