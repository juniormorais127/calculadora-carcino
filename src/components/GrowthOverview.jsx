import React, { useState } from 'react';
import { TrendingUp } from 'lucide-react';

export default function GrowthOverview({ viveiros, biometrias }) {
  const [selected, setSelected] = useState('');
  const pond = viveiros.find(item=>String(item.id)===selected) || viveiros[0];
  const rows = biometrias.filter(item=>item.viveiroId===pond?.id && Number(item.pesoMedioG)>0 && /^\d{4}-\d{2}-\d{2}$/.test(item.data)).sort((a,b)=>a.data.localeCompare(b.data) || Number(a.id)-Number(b.id)).slice(-12);
  const maximum = Math.max(1,...rows.map(item=>Number(item.pesoMedioG)))*1.15;
  const point = (row,index) => [40 + (rows.length>1?index/(rows.length-1):0.5)*520,170-Number(row.pesoMedioG)/maximum*140];
  if (!pond) return null;
  return <section className="rounded-2xl border border-blue-200 bg-white p-4 sm:p-6" aria-label="Evolução do peso">
    <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="flex items-center gap-2 text-lg font-bold text-blue-900"><TrendingUp className="size-5"/>Evolução do peso</h3><label className="text-sm text-slate-600">Viveiro do gráfico<select value={String(pond.id)} onChange={event=>setSelected(event.target.value)} className="ml-2 rounded-lg border border-slate-300 bg-white p-2 text-slate-900">{viveiros.map(item=><option key={item.id} value={item.id}>{item.nome}</option>)}</select></label></div>
    {rows.length ? <>
      <svg viewBox="0 0 600 210" role="img" aria-label={`Peso médio em gramas de ${pond.nome}: ${rows.length} medições registradas`} className="mt-4 w-full max-h-64">
        {[0,1,2].map(index=><g key={index}><line x1="40" x2="560" y1={170-index*70} y2={170-index*70} stroke="#dbeafe"/><text x="2" y={174-index*70} fill="#485e56" fontSize="12">{(maximum*index/2).toFixed(0)} g</text></g>)}
        <polyline points={rows.map((row,index)=>point(row,index).join(',')).join(' ')} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinejoin="round"/>
        {rows.map((row,index)=><circle key={row.id} cx={point(row,index)[0]} cy={point(row,index)[1]} r="4" fill="white" stroke="#2563eb" strokeWidth="2"><title>{row.data}: {row.pesoMedioG} g</title></circle>)}
        <text x="40" y="200" fill="#485e56" fontSize="12">{rows[0].data.split('-').reverse().join('/')}</text><text x="560" y="200" textAnchor="end" fill="#485e56" fontSize="12">{rows.length>1?rows.at(-1).data.split('-').reverse().join('/'):''}</text>
      </svg>
      <p className="text-sm text-slate-600">Último peso registrado: <strong className="text-blue-900">{Number(rows.at(-1).pesoMedioG).toLocaleString('pt-BR')} g</strong>. {rows.length===1?'Registre outra biometria para acompanhar a evolução.':'Até 12 medições, na ordem de registro por data.'}</p>
    </> : <p className="mt-4 text-sm text-slate-600">Registre uma biometria para acompanhar o crescimento deste viveiro.</p>}
  </section>;
}
