import React, { useState } from 'react';
import { House, Waves, Activity, Droplets, Calculator, ShieldAlert, Store, Settings, ClipboardList, PlusCircle, X, UserRound } from 'lucide-react';

export default function Navigation({ activeTab, setActiveTab, professional = false }) {
  const [expanded, setExpanded] = useState(false);
  const producerTabs = [
    { id:'dashboard', label:'Painel', icon:House }, { id:'viveiros', label:'Viveiros', icon:Waves },
    { id:'biometria', label:'Biometria', icon:Activity }, { id:'agua', label:'Água', icon:Droplets },
    { id:'calculadoras', label:'Cálculos', icon:Calculator }, { id:'sanidade', label:'Sanidade & BPM', icon:ShieldAlert },
    { id:'mercado', label:'Onde Comprar', icon:Store }, { id:'backup', label:'Ajustes', icon:Settings },
  ];
  const tabs = professional ? [{ id:'visitas', label:'Área técnica', icon:ClipboardList }, { id:'dashboard', label:'Minha produção', icon:Waves }, ...producerTabs.slice(4)] : producerTabs;
  function navigate(id) { setExpanded(false); setActiveTab(id); }
  const primary = professional
    ? [{ id:'visitas', label:'Início', icon:House }, { id:'dashboard', label:'Produção', icon:Waves }, { id:'menu', label:'Mais', icon:PlusCircle }, { id:'conta', label:'Conta', icon:UserRound }]
    : [{ id:'dashboard', label:'Início', icon:House }, { id:'viveiros', label:'Viveiros', icon:Waves }, { id:'menu', label:'Registros', icon:PlusCircle }, { id:'conta', label:'Conta', icon:UserRound }];
  return <>
    <nav aria-label="Navegação principal" className="desktop-navigation hidden md:flex flex-wrap gap-1 border-b border-slate-200 bg-white py-3 mb-6">
      {tabs.map(({id,label,icon:Icon}) => <button key={id} onClick={()=>navigate(id)} aria-current={activeTab===id?'page':undefined} className={`flex min-h-11 items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold ${activeTab===id?'bg-emerald-800 text-white':'text-slate-600 hover:bg-emerald-50 hover:text-emerald-950'}`}><Icon className="size-5" aria-hidden="true"/>{label}</button>)}
    </nav>
    <nav aria-label="Navegação principal" className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-slate-200 bg-white pb-safe">
      {expanded && <div className="max-h-[65dvh] overflow-y-auto border-b border-slate-200 p-4 shadow-lg" aria-label="Todos os serviços">
        <div className="flex items-center justify-between mb-2"><h2 className="text-lg font-bold text-emerald-950">{professional?'Serviços e produção':'O que deseja registrar?'}</h2><button aria-label="Fechar menu" onClick={()=>setExpanded(false)} className="p-3"><X className="size-5"/></button></div>
        <div className="grid grid-cols-2 gap-2">{tabs.map(({id,label,icon:Icon})=><button key={id} onClick={()=>navigate(id)} className="flex min-h-14 items-center gap-2 rounded-xl border border-slate-200 px-3 text-left text-sm font-semibold text-emerald-950 hover:bg-emerald-50"><Icon className="size-5 shrink-0" aria-hidden="true"/>{label}</button>)}</div>
      </div>}
      <div className="flex">{primary.map(({id,label,icon:Icon})=><button key={id} onClick={()=>id==='menu'?setExpanded(!expanded):navigate(id)} aria-expanded={id==='menu'?expanded:undefined} aria-current={activeTab===id?'page':undefined} className={`flex flex-1 flex-col items-center justify-center gap-1 min-h-16 py-2 text-xs ${activeTab===id || (id==='menu'&&expanded)?'text-emerald-800 font-bold':'text-slate-600'}`}><Icon className="size-6" aria-hidden="true"/>{label}</button>)}</div>
    </nav>
  </>;
}
