import React, { useEffect, useRef, useState } from 'react';
import { collection, getDocs, query, where, orderBy, limit, startAfter } from 'firebase/firestore';
import { firestore } from '../services/firebase.js';
import { useAccount } from './AccountProvider.jsx';
import { EVENT_LABELS, periodBounds, summarizeEvents } from '../services/purchaseMetrics.js';
import { isAdmin } from '../services/purchaseMetrics.js';

const localDay = millis => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Fortaleza', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(millis));
const button = 'min-h-11 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-emerald-700';
const field = 'block mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm';
const number = value => value.toLocaleString('pt-BR');
function exportCsv(rows) {
  const cell = value => `"${String(value).replace(/^[=+@\-\t\r]/, "'$&").replaceAll('"', '""')}"`;
  const lines = [['Ação', 'Destino', 'Categoria', 'Cliques', 'Contas distintas'], ...rows.map(row => [EVENT_LABELS[row.kind], row.name, row.category, row.clicks, row.users])];
  const url = URL.createObjectURL(new Blob(['\uFEFF' + lines.map(line => line.map(cell).join(';')).join('\r\n')], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = 'interesse-compras.csv'; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function AdminPurchasesView({ readPage = getDocs }) {
  const { user, access } = useAccount();
  const [from, setFrom] = useState(localDay(Date.now() - 29 * 86400000));
  const [to, setTo] = useState(localDay(Date.now()));
  const [range, setRange] = useState({ from, to });
  const [refresh, setRefresh] = useState(0);
  const [events, setEvents] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [more, setMore] = useState(false);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('Todas');
  const [kind, setKind] = useState('Todos');
  const generation = useRef(0);
  const allowed = isAdmin(user, access);
  async function fetchPage(append, token) {
    setBusy(true); setError('');
    try {
      const { start, end } = periodBounds(range.from, range.to);
      const constraints = [where('occurredAt', '>=', start), where('occurredAt', '<=', end), orderBy('occurredAt', 'desc')];
      if (append && cursor) constraints.push(startAfter(cursor));
      const result = await readPage(query(collection(firestore, 'purchaseEvents'), ...constraints, limit(1000)));
      if (generation.current !== token) return;
      const data = result.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setEvents(old => append ? [...old, ...data] : data);
      setCursor(result.docs.at(-1) || null); setMore(result.size === 1000);
    } catch (err) {
      if (generation.current === token) setError(err.code === 'permission-denied' ? 'Acesso não autorizado às métricas. Confira a conta e as regras do Firebase.' : 'Não foi possível carregar as métricas. Confira sua conexão e tente atualizar.');
    } finally { if (generation.current === token) setBusy(false); }
  }
  useEffect(() => {
    const token = ++generation.current;
    setEvents([]); setMore(false); setCursor(null);
    if (allowed) void fetchPage(false, token);
    return () => { generation.current++; };
  }, [range, refresh, allowed]);
  if (!allowed) return <p role="alert" className="p-6 text-rose-800">Área restrita à administração.</p>;
  const filtered = events.filter(e => (category === 'Todas' || e.category === category) && (kind === 'Todos' || e.kind === kind));
  const stats = summarizeEvents(filtered);
  const max = Math.max(1, ...stats.days.map(day => day.views + day.interests));
  return <section className="py-5 pb-16 space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-4"><div className="max-w-2xl space-y-2"><h2 className="text-2xl font-bold text-slate-900">Interesse em compras</h2><p className="text-sm text-slate-600">Acessos, marcas consultadas e contatos com vendedores. Cliques indicam interesse, não compras confirmadas.</p></div><button className={button} disabled={busy} onClick={() => setRefresh(n => n + 1)}>Atualizar dados</button></div>
    <form className="flex flex-wrap gap-3 items-end" onSubmit={event => { event.preventDefault(); if (from && to && from <= to) setRange({ from, to }); }}>
      <label className="text-sm font-semibold text-slate-700">De<input type="date" required value={from} max={to} className={field} onChange={e => setFrom(e.target.value)} /></label>
      <label className="text-sm font-semibold text-slate-700">Até<input type="date" required value={to} min={from} className={field} onChange={e => setTo(e.target.value)} /></label>
      <button className={`${button} bg-emerald-700 text-white border-emerald-700 hover:bg-emerald-800`} disabled={busy}>Aplicar período</button>
    </form>
    <p className="text-xs text-slate-600">Período: {range.from.split('-').reverse().join('/')} a {range.to.split('-').reverse().join('/')} · horário de Fortaleza. A contagem começa com esta atualização do site.</p>
    {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</p>}
    {more && <div role="status" className="p-4 rounded-xl border border-amber-300 bg-amber-50 text-sm text-amber-950">Relatório parcial: há mais registros neste período. Os totais abaixo consideram somente os {number(events.length)} registros carregados. <button className={`${button} mt-2 block bg-white`} disabled={busy} onClick={() => void fetchPage(true, generation.current)}>Carregar mais registros</button></div>}
    {busy && <p role="status" className="text-sm text-slate-600">Carregando métricas…</p>}
    <div className="flex flex-wrap gap-3">
      <label className="text-sm font-semibold text-slate-700">Categoria<select value={category} className={field} onChange={e => setCategory(e.target.value)}><option>Todas</option>{[...new Set(events.map(e => e.category))].sort().map(c => <option key={c}>{c}</option>)}</select></label>
      <label className="text-sm font-semibold text-slate-700">Ação<select value={kind} className={field} onChange={e => setKind(e.target.value)}><option value="Todos">Todas as ações</option>{Object.entries(EVENT_LABELS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
    </div>
    <dl className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-5 border-y border-slate-200 py-5">
      {[["Acessos à aba", stats.views, `${number(stats.visitors)} contas distintas`], ["Cliques de interesse", stats.interests, `${number(stats.interested)} contas distintas`], ["Cliques para contato", stats.contacts, `${number(stats.contacting)} contas distintas`], ["Contas interessadas", stats.interested, 'Uma vez por conta no período']].map(([label, value, detail]) => <div key={label}><dt className="text-xs font-semibold text-slate-600">{label}</dt><dd className="mt-1 text-3xl font-bold tabular-nums text-slate-900">{number(value)}</dd><dd className="mt-1 text-xs text-slate-600">{detail}</dd></div>)}
    </dl>
    {!busy && !error && filtered.length === 0 && <div className="py-8 space-y-2"><h3 className="text-lg font-bold">Nenhum registro neste filtro</h3><p className="text-sm text-slate-600">Os números aparecerão quando usuários abrirem Compras ou clicarem nas marcas e contatos. Não há histórico anterior à implementação.</p></div>}
    {stats.days.length > 0 && <div className="space-y-3"><h3 className="font-bold text-lg">Evolução por dia</h3><p className="text-xs text-slate-600">Verde: acessos à aba · azul: cliques de interesse</p><div className="overflow-x-auto rounded-xl border border-slate-200 bg-white p-3" tabIndex={0} role="region" aria-label="Gráfico diário de acessos e interesse"><svg role="img" aria-label="Acessos e cliques por dia" viewBox={`0 0 ${Math.max(600, stats.days.length * 45)} 180`} className="h-48 min-w-[600px] w-full"><title>Acessos e interesse por dia</title>{stats.days.map((day, i) => { const x = i * (Math.max(600, stats.days.length * 45) / stats.days.length); return <g key={day.day}><title>{day.day}: {day.views} acessos e {day.interests} cliques</title><rect x={x + 5} y={140 - day.views / max * 120} width={12} height={day.views / max * 120} fill="#047857" /><rect x={x + 19} y={140 - day.interests / max * 120} width={12} height={day.interests / max * 120} fill="#0369a1" /><text x={x + 5} y={163} fontSize={10} fill="#475569">{day.day.slice(5).split('-').reverse().join('/')}</text></g>; })}</svg></div><details className="text-sm"><summary className="cursor-pointer min-h-11 py-2 font-semibold text-emerald-800">Ver valores por dia</summary><ul className="space-y-1">{stats.days.map(day => <li key={day.day}>{day.day.split('-').reverse().join('/')}: {day.views} acessos · {day.interests} cliques</li>)}</ul></details></div>}
    <div className="space-y-3"><div className="flex flex-wrap justify-between items-center gap-3"><h3 className="text-lg font-bold">Destinos de interesse</h3><button className={button} disabled={!stats.rows.length || busy} onClick={() => exportCsv(stats.rows)}>Exportar CSV</button></div><p className="md:hidden text-xs text-slate-600">Deslize a tabela para ver os totais.</p><div role="region" aria-label="Interesse por marca, produto e vendedor" tabIndex={0} className="overflow-x-auto rounded-xl border border-slate-200 bg-white"><table className="w-full min-w-[620px] text-sm text-left"><thead className="bg-slate-100 text-slate-700"><tr>{['Destino', 'Categoria', 'Ação', 'Cliques', 'Contas distintas'].map(label => <th scope="col" className="p-3 font-semibold" key={label}>{label}</th>)}</tr></thead><tbody>{stats.rows.map(row => <tr key={row.key} className="border-t border-slate-100"><th scope="row" className="p-3 font-semibold">{row.name}</th><td className="p-3">{row.category}</td><td className="p-3">{EVENT_LABELS[row.kind]}</td><td className="p-3 tabular-nums">{number(row.clicks)}</td><td className="p-3 tabular-nums">{number(row.users)}</td></tr>)}</tbody></table></div></div>
    <p className="text-xs text-slate-600">Contas distintas não equivalem necessariamente a pessoas. Somamos cada conta uma vez por grupo e período; os grupos podem se sobrepor. O registro é enviado ao reconectar. Este painel não exibe e-mails nem dados de produção.</p>
  </section>;
}
