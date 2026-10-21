import InfoDisclosure from './InfoDisclosure.jsx';
import React, { useEffect, useRef, useState } from 'react';
import { listLocalReports, saveLocalReport } from '../services/fieldNotebook.js';
import LocalVisitPhotos, { VisitGuide } from './LocalVisitPhotos.jsx';
import PondLocationFields from './PondLocationFields.jsx';
const button = 'min-h-12 rounded-xl border border-emerald-700 px-4 py-2 text-sm font-semibold text-emerald-900 disabled:opacity-50';
const input = 'mt-1 block w-full min-h-12 rounded-xl border border-slate-300 p-3 text-sm';
export default function FieldNotebook({ user, technicianName }) {
  const [reports, setReports] = useState([]), [report, setReport] = useState(null), [message, setMessage] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false), [dirty, setDirty] = useState(false), [photoBusy, setPhotoBusy] = useState(false);
  const latest = useRef(null); latest.current = { report, dirty };
  useEffect(() => () => { const value = latest.current; if (value?.dirty && value.report) void saveLocalReport(user.uid, value.report).catch(() => {}); }, [user.uid]);
  useEffect(() => {
    if (!dirty || !report) return;
    let active = true;
    const timer = setTimeout(async () => {
      try {
        await saveLocalReport(user.uid, report);
        const rows = await listLocalReports(user.uid);
        if (active) { setReports(rows); setDirty(false); setMessage('Relatório salvo neste aparelho.'); setError(''); }
      } catch { if (active) setError('O salvamento automático falhou. Use Salvar relatório e confira o espaço no aparelho.'); }
    }, 500);
    return () => { active = false; clearTimeout(timer); };
  }, [dirty, report, user.uid]);
  useEffect(() => { let alive = true; listLocalReports(user.uid).then(rows => { if (alive) setReports(rows); }).catch(() => { if (alive) setError('Não foi possível abrir os relatórios deste aparelho.'); }); return () => { alive = false; }; }, [user.uid]);
  async function persist(value) {
    setBusy(true); setError(''); setMessage('');
    try { const saved = await saveLocalReport(user.uid, value); setReport(saved); setReports(await listLocalReports(user.uid)); setDirty(false); setMessage('Relatório salvo neste aparelho.'); }
    catch { setError('Não foi possível salvar. Confira o espaço disponível e tente novamente.'); }
    finally { setBusy(false); }
  }
  function edit(field, value) { setReport(previous => ({ ...previous, [field]: value })); setDirty(true); setMessage('Alterações ainda não salvas. Use Salvar relatório neste aparelho.'); }
  return <section className="space-y-4 rounded-2xl border border-slate-300 bg-white p-5 max-w-2xl"><h3 className="text-lg font-bold">Relatórios locais de campo</h3><InfoDisclosure label="Relatórios locais">Prepare a visita sem internet, anexe fotos e gere uma guia em PDF. Estes relatórios ficam somente neste aparelho; não enviam notificações, não passam por auditoria e não alteram o cadastro do cliente. Para isso, use o registro de visita com conexão.</InfoDisclosure>
    <button type="button" className={button} disabled={busy || !!report} onClick={() => void persist({ id: crypto.randomUUID(), farmName: '', visitedOn: new Date().toLocaleDateString('en-CA'), summary: '', technicianName: technicianName || user.email, licenseStatus: 'unknown', latitude: '', longitude: '', status: 'local' })}>Novo relatório local</button>
    {report ? <form className="space-y-4" onSubmit={event => { event.preventDefault(); void persist(report); }}>
      <label className="block text-sm font-semibold">Nome da propriedade<input required maxLength={200} className={input} value={report.farmName} onChange={event => edit('farmName', event.target.value)} /></label>
      <label className="block text-sm font-semibold">Data da visita<input required type="date" className={input} value={report.visitedOn} onChange={event => edit('visitedOn', event.target.value)} /></label>
      <label className="block text-sm font-semibold">Endereço<input maxLength={500} className={input} value={report.address || ''} onChange={event => edit('address', event.target.value)} /></label>
      <label className="block text-sm font-semibold">Relatório e testes realizados<textarea required maxLength={20000} rows={7} className={input} value={report.summary} onChange={event => edit('summary', event.target.value)} /></label>
      <PondLocationFields value={report} onChange={location => { setReport(previous => ({ ...previous, ...location })); setDirty(true); setMessage('Coordenadas alteradas. Salve o relatório.'); }} />
      <LocalVisitPhotos uid={user.uid} storageKey={`notebook:${report.id}`} onBusyChange={setPhotoBusy} />
      <div className="flex flex-wrap gap-3"><button type="submit" className={button} disabled={busy}>{busy ? 'Salvando…' : 'Salvar relatório neste aparelho'}</button><button type="button" className={button} disabled={busy} onClick={() => { if (dirty && !window.confirm('Sair sem salvar as alterações do texto?')) return; setReport(null); setMessage(''); }}>Fechar relatório</button></div>
      <VisitGuide user={user} photoEditor={false} externalPhotoBusy={photoBusy} storageKey={`notebook:${report.id}`} visit={{ ...report, latitude: report.latitude === '' ? undefined : Number(String(report.latitude).replace(',', '.')), longitude: report.longitude === '' ? undefined : Number(String(report.longitude).replace(',', '.')) }} />
    </form> : <ul className="space-y-2">{reports.map(item => <li key={item.id}><button type="button" className={`${button} w-full text-left`} onClick={() => { setReport(item); setDirty(false); setMessage(''); }}>{item.farmName || 'Relatório sem nome'} · {item.visitedOn}</button></li>)}</ul>}
    {message && <p role="status" className="text-sm text-slate-700">{message}</p>}{error && <p role="alert" className="text-sm text-rose-900">{error}</p>}
  </section>;
}
