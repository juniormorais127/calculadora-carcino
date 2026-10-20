import ScreenBoundary from './ScreenBoundary.jsx';
import React, { useEffect, useState } from 'react';
import { LayoutDashboard, UsersRound, ClipboardCheck, ShieldCheck, MapPinned, FileCheck2, FlaskConical, Activity, ShoppingBag, KeyRound, ClipboardList } from 'lucide-react';
import AdminUsersView from './AdminUsersView.jsx';
import AdminPurchasesView from './AdminPurchasesView.jsx';
import { useAccount } from './AccountProvider.jsx';
import { isAdmin } from '../services/purchaseMetrics.js';
import { isSenior } from '../services/accountPermissions.js';
import TechnicalVisitsView from './TechnicalVisitsView.jsx';
import AdminPropertyMap from './AdminPropertyMap.jsx';
import AccountNameEditor from './AccountNameEditor.jsx';
import { saveAccountName } from '../services/accountProfiles.js';
import { syncPropertyDirectory } from '../services/technicalVisits.js';
import AssistedProducers from './AssistedProducers.jsx';
import TechnicalAuthorizations from './TechnicalAuthorizations.jsx';
import LicensingWorkspace from './LicensingWorkspace.jsx';
import EnvironmentalMonitoring from './EnvironmentalMonitoring.jsx';
import AdminOverview, { AdminActivity } from './AdminOverview.jsx';
import AdminAccesses from './AdminAccesses.jsx';
export default function AdminDashboard() {
  const { user, access }=useAccount();
  const [tab,setTab]=useState('overview'),[dirty,setDirty]=useState(false),[directoryWarning,setDirectoryWarning]=useState('');
  useEffect(()=>{let stopped=false;if(isAdmin(user,access)&&access?.fullName)void syncPropertyDirectory().then(conflicts=>{if(!stopped)setDirectoryWarning(conflicts.length?`Revise os nomes destes cadastros antigos: ${conflicts.join(', ')}.`:'');}).catch(()=>{if(!stopped)setDirectoryWarning('Não foi possível conferir os nomes dos cadastros antigos. Tente novamente com conexão.');});return()=>{stopped=true;};},[user?.uid,access?.role,access?.fullName]);
  if(!isAdmin(user,access))return <p role="alert">Área restrita à administração.</p>;
  if(!access?.fullName)return <section className="max-w-lg space-y-4 py-5"><h2 className="text-xl font-bold">Complete o nome da sua conta</h2><AccountNameEditor onSave={name=>saveAccountName(user,name)}/></section>;
  const topics=[['overview','Visão geral',LayoutDashboard],['users','Usuários e permissões',UsersRound],['authorizations','Autorizações',ShieldCheck],['assisted','Auditoria de cadastros',ClipboardCheck],['visits','Visitas e licenciamento',ClipboardList],['licensing','Processos Adema',FileCheck2],['environment','Monitoramento ambiental',FlaskConical],['map','Mapa de propriedades',MapPinned],['purchases','Interesse em compras',ShoppingBag],['activity','Atividade registrada',Activity],...(isSenior(user,access)?[['accesses','Acessos administrativos',KeyRound]]:[])];
  function navigate(next){if(dirty&&!confirm('Há alterações não salvas neste formulário. Descartar e mudar de seção?'))return;setDirty(false);setTab(next);}
  return <div className="grid items-start gap-7 pt-5 lg:grid-cols-[230px_minmax(0,1fr)]"><aside className="lg:sticky lg:top-5"><label className="block text-sm font-semibold lg:hidden">Seção da central<select value={tab} onChange={event=>navigate(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3">{topics.map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label><nav aria-label="Administração" className="hidden space-y-1 border-r border-slate-200 pr-3 lg:block">{topics.map(([id,label,Icon])=><button key={id} type="button" aria-current={tab===id?'page':undefined} onClick={()=>navigate(id)} className={`flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold focus-visible:outline-2 focus-visible:outline-emerald-700 ${tab===id?'bg-slate-900 text-white':'text-slate-700 hover:bg-slate-100'}`}><Icon className="size-5 shrink-0" aria-hidden="true"/>{label}</button>)}</nav></aside>
    <div className="min-w-0 pb-16"><ScreenBoundary key={tab}>{directoryWarning&&<p role="alert" className="mb-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">{directoryWarning}</p>}{tab==='overview'?<AdminOverview onOpen={navigate}/>:tab==='authorizations'?<TechnicalAuthorizations/>:tab==='assisted'?<AssistedProducers mode="admin"/>:tab==='map'?<AdminPropertyMap/>:tab==='visits'?<TechnicalVisitsView administrative/>:tab==='licensing'?<LicensingWorkspace administrative onDirtyChange={setDirty}/>:tab==='environment'?<EnvironmentalMonitoring administrative onDirtyChange={setDirty}/>:tab==='purchases'?<AdminPurchasesView/>:tab==='activity'?<AdminActivity/>:tab==='accesses'?<AdminAccesses/>:<AdminUsersView/>}</ScreenBoundary></div></div>;
}
