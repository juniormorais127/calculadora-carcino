import React from 'react';
import { Waves, Activity, Droplets, Calculator, ClipboardList, Store, ShieldCheck, Settings, ChevronRight } from 'lucide-react';
import { FeedPelletsIcon } from './icons/CustomAquacultureIcons.jsx';

const tasks = [
  ['viveiros','Viveiros','Cadastro, localização e ciclos',Waves],
  ['biometria','Biometria','Peso, sobrevivência e crescimento',Activity],
  ['calculadoras','Alimentação','Calcular a previsão de ração',FeedPelletsIcon],
  ['agua','Qualidade da água','Medições e acompanhamento',Droplets],
  ['visitas','Assistência técnica','Solicitações, visitas e aprovações',ClipboardList],
  ['calculadoras','Cálculos','Água, solo, povoamento e metas',Calculator],
  ['sanidade','Sanidade e boas práticas','Checklist e guia de doenças',ShieldCheck],
  ['mercado','Onde comprar','Ração, fornecedores e produtos',Store],
  ['backup','Ajustes','Propriedade, backups e aplicativo',Settings],
];
export default function ProductionTasks({onNavigate}) {
  const renderTask = ([id,label,description,Icon]) => <button key={label} onClick={()=>onNavigate(id)} className="task-link group flex min-h-20 items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left hover:border-emerald-400 hover:bg-emerald-50/40">
      <Icon className="size-7 shrink-0 text-emerald-800" aria-hidden="true"/><span className="min-w-0 flex-1"><span className="block text-base font-bold text-slate-900">{label}</span><span className="mt-1 block text-sm text-slate-600">{description}</span></span><ChevronRight className="size-5 shrink-0 text-slate-500" aria-hidden="true"/>
    </button>;
  return <section aria-label="Serviços da produção" className="production-tasks space-y-3">
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{tasks.slice(0,5).map(renderTask)}</div>
    <details className="rounded-2xl border border-slate-200 bg-white p-4"><summary className="min-h-11 cursor-pointer content-center text-sm font-semibold text-emerald-900">Mais serviços: cálculos, sanidade, compras e ajustes</summary><div className="mt-3 grid gap-3 md:grid-cols-2">{tasks.slice(5).map(renderTask)}</div></details>
  </section>;
}
