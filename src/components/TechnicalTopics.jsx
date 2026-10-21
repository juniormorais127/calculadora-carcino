import React from 'react';
import InfoDisclosure from './InfoDisclosure.jsx';
import { ClipboardList, FlaskConical, FileCheck2, MapPinned, FileText, UserRound, ChevronRight, PlusCircle } from 'lucide-react';

const topics = [
  ['visits','Clientes e visitas','Buscar propriedades, registrar e acompanhar visitas',ClipboardList],
  ['environment','Monitoramento ambiental','Água, solo e outros testes da propriedade',FlaskConical],
  ['licensing','Licenciamento','Etapas e documentos ADEMA',FileCheck2],
  ['map','Mapa e medições','Propriedades visitadas, pontos e histórico',MapPinned],
  ['reports','Relatórios locais','Anotações e fotos somente neste aparelho',FileText],
  ['profile','Perfil profissional','Identificação, CREA e vínculo de atendimento',UserRound],
];
export default function TechnicalTopics({onNavigate}) {
  return <section aria-label="Serviços técnicos" className="space-y-5">
    <button onClick={()=>onNavigate('visits')} className="flex min-h-14 w-full items-center justify-center gap-3 rounded-xl bg-emerald-800 px-5 py-3 text-base font-bold text-white hover:bg-emerald-900"><PlusCircle className="size-6"/>Iniciar visita</button>
    <div className="grid items-start gap-3 md:grid-cols-2">{topics.map(([id,label,description,Icon])=><div key={id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center rounded-2xl border border-slate-200 bg-white pr-2">
      <button onClick={()=>onNavigate(id)} className="task-link flex min-h-20 items-center gap-3 rounded-2xl p-4 text-left hover:bg-emerald-50/40"><Icon className="size-6 shrink-0 text-emerald-800" aria-hidden="true"/><span className="min-w-0 flex-1 text-base font-semibold text-slate-900">{label}</span><ChevronRight className="size-4 shrink-0 text-slate-500" aria-hidden="true"/></button>
      <InfoDisclosure compact label={label} className="contents" panelClassName="col-span-2 m-3 mt-0">{description}.{id==='reports'&&' Estes relatórios não enviam notificações nem alteram o cadastro do cliente. Salve o PDF para compartilhar.'}</InfoDisclosure>
    </div>)}</div>
  </section>;
}
