import ScreenBoundary from './ScreenBoundary.jsx';
import React, { useEffect, useState } from 'react';
import { ClipboardList, FlaskConical, FileCheck2, MapPinned, FileText, UserRound } from 'lucide-react';
import { useAccount } from './AccountProvider.jsx';
import TechnicalVisitsView from './TechnicalVisitsView.jsx';
import LicensingWorkspace from './LicensingWorkspace.jsx';
import EnvironmentalMonitoring from './EnvironmentalMonitoring.jsx';
import TechnicianVisitMap from './TechnicianVisitMap.jsx';
import TechnicianIdentityEditor from './TechnicianIdentityEditor.jsx';
import FieldNotebook from './FieldNotebook.jsx';
import * as fieldApi from '../services/technicalVisits.js';
import { hasTechnicianIdentity } from '../services/technicianIdentity.js';

const topics = [['visits','Atendimentos',ClipboardList],['environment','Monitoramento ambiental',FlaskConical],['licensing','Licenciamento Adema',FileCheck2],['map','Mapa e histórico',MapPinned],['reports','Relatórios locais',FileText],['profile','Perfil profissional',UserRound]];
export default function TechnicianWorkspace({ onReload, onDirtyChange, professionalApi }) {
  const { user,access,technicianIdentity,identityLoading,identityError }=useAccount();
  const [topic,setTopic]=useState('visits'),[dirty,setDirty]=useState(false),[visits,setVisits]=useState([]),[mapError,setMapError]=useState('');
  useEffect(()=>{onDirtyChange?.(dirty);return()=>onDirtyChange?.(false);},[dirty,onDirtyChange]);
  useEffect(()=>{if(topic!=='map')return;let regular=[],independent=[];setMapError('');const update=()=>setVisits([...regular,...independent.map(item=>({...item,independent:true,farmName:item.propertyName,pondName:'Registro de campo'}))]);const fail=()=>setMapError('Não foi possível consultar algumas visitas para o mapa.');const stops=[fieldApi.watchFieldRecords('technicalVisits','technicianUid',user.uid,value=>{regular=value;update();},fail),fieldApi.watchFieldRecords('fieldInspectionReports','technicianUid',user.uid,value=>{independent=value;update();},fail)];return()=>stops.forEach(stop=>stop());},[topic,user.uid]);
  function navigate(next){if(dirty&&!confirm('Há alterações não salvas. Sair deste tópico e descartá-las?'))return;setDirty(false);setTopic(next);}
  return <div className="pb-20"><div className="mb-5 border-b border-slate-200 pb-4"><h1 className="text-2xl font-bold text-slate-900">Área técnica</h1><p className="mt-1 text-sm text-slate-600">{access.fullName} · cada etapa do trabalho no seu lugar.</p></div><div className="grid items-start gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
    <aside className="lg:sticky lg:top-24"><label className="block text-sm font-semibold lg:hidden">Abrir tópico<select className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-900" value={topic} onChange={event=>navigate(event.target.value)}>{topics.map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label><nav aria-label="Tópicos da área técnica" className="hidden space-y-1 rounded-2xl border border-slate-200 bg-white p-2 lg:block">{topics.map(([id,label,Icon])=><button type="button" key={id} onClick={()=>navigate(id)} aria-current={topic===id?'page':undefined} className={`flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold focus-visible:outline-2 focus-visible:outline-emerald-700 ${topic===id?'bg-emerald-800 text-white':'text-slate-700 hover:bg-slate-100'}`}><Icon className="size-5 shrink-0" aria-hidden="true"/>{label}</button>)}</nav></aside>
    <div className="min-w-0"><ScreenBoundary key={topic}>{topic==='visits'&&!hasTechnicianIdentity(technicianIdentity)&&<div className="mb-5 space-y-2 rounded-xl border border-amber-300 bg-amber-50 p-4"><p className="text-sm text-amber-950">Complete o perfil profissional para registrar visitas e se identificar para o cliente.</p><button type="button" className="min-h-11 font-semibold text-amber-950 underline" onClick={()=>navigate('profile')}>Completar perfil profissional</button></div>}{topic==='visits'?<TechnicalVisitsView onReload={onReload} focused />:topic==='environment'?<EnvironmentalMonitoring api={professionalApi} onDirtyChange={setDirty}/>:topic==='licensing'?<LicensingWorkspace api={professionalApi} onDirtyChange={setDirty}/>:topic==='map'?<div className="space-y-4">{mapError&&<p role="alert" className="text-sm text-rose-900">{mapError}</p>}<TechnicianVisitMap uid={user.uid} visits={visits}/></div>:topic==='reports'?<FieldNotebook user={user} technicianName={access.fullName}/>:<section className="space-y-4"><h2 className="text-2xl font-bold">Perfil profissional</h2><TechnicianIdentityEditor accountName={access.fullName} value={technicianIdentity} loading={identityLoading} loadError={identityError} onSave={value=>fieldApi.saveTechnicianIdentity(user,value)}/></section>}</ScreenBoundary></div>
  </div></div>;
}
