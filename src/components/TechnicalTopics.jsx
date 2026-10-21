import React from 'react';
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
    <div className="grid gap-3 md:grid-cols-2">{topics.map(([id,label,description,Icon])=><button key={id} onClick={()=>onNavigate(id)} className="task-link flex min-h-24 items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left hover:border-emerald-400 hover:bg-emerald-50/40"><Icon className="size-8 shrink-0 text-emerald-800" aria-hidden="true"/><span className="min-w-0 flex-1"><span className="block text-base font-bold text-slate-900">{label}</span><span className="mt-1 block text-sm text-slate-600">{description}</span></span><ChevronRight className="size-5 shrink-0 text-slate-500" aria-hidden="true"/></button>)}</div>
    <p className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">Selecione uma propriedade no atendimento para aproveitar seus dados nos testes, no licenciamento e no relatório. Alterações seguem as autorizações e revisões de cada serviço.</p>
  </section>;
}
