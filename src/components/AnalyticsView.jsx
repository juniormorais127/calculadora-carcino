import React, { useState } from 'react';
import { ArrowLeft, Download, RefreshCw, Trash2 } from 'lucide-react';
import { analytics, PAGINAS_ANALYTICS } from '../services/analyticsService.js';
import { VENDEDORES_POR_ESTADO } from '../data/fabricantesRacao.js';

export default function AnalyticsView({ onVoltar }) {
  const [periodo, setPeriodo] = useState(7);
  const [revision, setRevision] = useState(0);
  const [confirmar, setConfirmar] = useState(false);
  const [erro, setErro] = useState('');
  const resumo = analytics.resumo(periodo);
  const cliques = Object.values(resumo.contatos).reduce((sum, value) => sum + value, 0);
  const paginas = Object.values(resumo.paginas).reduce((sum, value) => sum + value, 0);
  const vendedores = VENDEDORES_POR_ESTADO.map(v => ({
    ...v, whatsappClicks: resumo.contatos[`${v.id}:whatsapp`] || 0,
    telefoneClicks: resumo.contatos[`${v.id}:telefone`] || 0,
  })).filter(v => v.whatsappClicks + v.telefoneClicks > 0)
    .sort((a, b) => (b.whatsappClicks + b.telefoneClicks) - (a.whatsappClicks + a.telefoneClicks));
  const atualizar = () => setRevision(revision + 1);
  const exportar = () => {
    const rows = [['Tipo', 'Nome', 'Estado', 'Quantidade'], ['Acessos', 'Aberturas do aplicativo', '', resumo.acessos],
      ...Object.entries(resumo.paginas).filter(([key]) => PAGINAS_ANALYTICS[key]).map(([key, count]) => ['Página', PAGINAS_ANALYTICS[key], '', count]),
      ...vendedores.flatMap(v => [['WhatsApp', v.empresa, v.estado, v.whatsappClicks], ['Telefone', v.empresa, v.estado, v.telefoneClicks]])];
    const csv = '\uFEFF' + rows.map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(';')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `estatisticas-locais-${periodo}-dias.csv`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <section className="space-y-5 pb-12">
    <button onClick={onVoltar} className="inline-flex min-h-11 items-center gap-2 font-semibold text-sm text-emerald-800 rounded-lg px-2 focus-visible:outline-2 focus-visible:outline-emerald-600"><ArrowLeft className="w-4 h-4" />Voltar ao Mercado</button>
    <div>
      <h2 className="text-2xl font-bold text-slate-900">Estatísticas de teste</h2>
      <p className="mt-2 text-sm text-slate-600 max-w-2xl">Dados somente deste navegador. Este painel não reúne visitas de outras pessoas ou aparelhos. Não há login nem envio de informações para servidores.</p>
    </div>
    <div className="flex flex-wrap items-end gap-3">
      <label className="text-sm font-semibold text-slate-700">Período
        <select value={periodo} onChange={e => { setPeriodo(Number(e.target.value)); setConfirmar(false); }} className="block mt-1 min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm">
          <option value={1}>Hoje</option><option value={7}>Últimos 7 dias</option><option value={30}>Últimos 30 dias</option><option value={90}>Últimos 90 dias</option>
        </select>
      </label>
      <button onClick={atualizar} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold"><RefreshCw className="w-4 h-4" />Atualizar</button>
      <button onClick={exportar} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-700 px-3 text-white text-sm font-semibold"><Download className="w-4 h-4" />Exportar CSV</button>
    </div>
    {(!resumo.disponivel || erro) && <p role="alert" className="rounded-xl bg-amber-50 border border-amber-300 p-3 text-sm text-amber-900">{erro || 'Não foi possível ler as estatísticas. Verifique se o navegador permite armazenamento local. Dados antigos podem estar indisponíveis.'}</p>}
    <dl className="grid grid-cols-3 gap-3 border-y border-slate-200 py-5">
      {[['Acessos', resumo.acessos], ['Páginas abertas', paginas], ['Cliques em contatos', cliques]].map(([label, value]) => <div key={label}><dt className="text-xs sm:text-sm text-slate-600">{label}</dt><dd className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{value}</dd></div>)}
    </dl>
    <p className="text-xs text-slate-600">Cada abertura ou recarga do aplicativo conta como um acesso, não como uma pessoa única. Um clique não confirma conversa ou venda. Histórico disponível por até 90 dias.</p>
    <div className="space-y-3">
      <h3 className="font-bold text-lg text-slate-900">Cliques por vendedor</h3>
      {vendedores.length === 0 ? <div className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-600"><p>Nenhum clique registrado neste período.</p><p className="mt-2">Para testar, volte ao Mercado e toque em WhatsApp ou telefone de um vendedor. O contato será aberto normalmente. Depois retorne a este painel.</p></div> :
        <ul className="divide-y divide-slate-200">{vendedores.map(v => <li key={v.id} className="py-3"><p className="font-semibold text-sm text-slate-900">{v.empresa} <span className="text-slate-600">· {v.estado}</span></p><p className="mt-1 text-sm text-slate-600">WhatsApp: <strong>{v.whatsappClicks}</strong> · Telefone: <strong>{v.telefoneClicks}</strong></p></li>)}</ul>}
    </div>
    <div className="space-y-3">
      <h3 className="font-bold text-lg text-slate-900">Páginas abertas</h3>
      <ul className="divide-y divide-slate-200">{Object.entries(PAGINAS_ANALYTICS).filter(([key]) => resumo.paginas[key]).map(([key, name]) => <li key={key} className="flex justify-between gap-4 py-2 text-sm"><span>{name}</span><strong className="tabular-nums">{resumo.paginas[key]}</strong></li>)}</ul>
      {paginas === 0 && <p className="text-sm text-slate-600">Nenhuma página registrada neste período.</p>}
    </div>
    <div className="border-t border-slate-200 pt-4">
      {confirmar ? <div className="space-y-3"><p className="text-sm text-slate-700">Apagar todas as estatísticas de teste deste navegador? Os registros da fazenda serão mantidos.</p><div className="flex gap-3"><button className="min-h-11 rounded-xl bg-rose-700 text-white px-4 text-sm font-semibold" onClick={() => { if (!analytics.limpar()) setErro('Não foi possível apagar as estatísticas. Verifique as permissões do navegador.'); setConfirmar(false); atualizar(); }}>Apagar estatísticas</button><button className="min-h-11 rounded-xl border border-slate-300 px-4 text-sm" onClick={() => setConfirmar(false)}>Cancelar</button></div></div> : <button onClick={() => setConfirmar(true)} className="inline-flex min-h-11 items-center gap-2 text-sm text-rose-700 font-semibold rounded-lg px-2"><Trash2 className="w-4 h-4" />Limpar estatísticas de teste</button>}
    </div>
  </section>;
}
