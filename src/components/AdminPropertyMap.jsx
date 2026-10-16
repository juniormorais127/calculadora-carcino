import React, { useEffect, useMemo, useState } from 'react';
import { watchFieldRecords } from '../services/technicalVisits.js';
import { buildPropertyMap } from '../services/propertyMap.js';
import { LICENSE_LABELS, VISIT_LABELS } from '../services/technicalVisitData.js';
import TechnicalVisitMap from './TechnicalVisitMap.jsx';

export default function AdminPropertyMap({ subscribe = watchFieldRecords }) {
  const [farms, setFarms] = useState([]), [visits, setVisits] = useState([]), [inspections, setInspections] = useState([]);
  const [error, setError] = useState(''), [filter, setFilter] = useState('all');
  useEffect(() => {
    const fail = () => setError('Não foi possível carregar o mapa. Confira a conexão e sua permissão administrativa.');
    const stops = [subscribe('fieldFarms', null, null, setFarms, fail), subscribe('technicalVisits', null, null, setVisits, fail), subscribe('fieldInspectionReports', null, null, setInspections, fail)];
    return () => stops.forEach(stop => stop());
  }, [subscribe]);
  const { points, withoutLocation } = useMemo(() => buildPropertyMap(farms, visits, inspections), [farms, visits, inspections]);
  const visible = filter === 'all' ? points : points.filter(point => point.licenseStatus === filter);
  return <section className="py-5 pb-16 space-y-5"><div className="space-y-2"><h2 className="text-2xl font-bold">Mapa de propriedades</h2><p className="text-sm text-slate-600 max-w-2xl">Cadastros com coordenadas sincronizadas e registros de campo. Vermelho indica área informada como não licenciada; verde, licenciada; cinza, situação ainda não informada.</p></div>
    {error && <p role="alert" className="text-sm text-rose-800">{error}</p>}
    <label className="block text-sm font-semibold">Filtrar licenciamento<select value={filter} onChange={event => setFilter(event.target.value)} className="mt-1 block min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm"><option value="all">Todas as situações</option>{Object.entries(LICENSE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    <p className="text-sm text-slate-600">{farms.length} propriedade(s) sincronizada(s) · {visible.length} ponto(s) no mapa · {withoutLocation} propriedade(s) sem coordenadas.</p>
    <TechnicalVisitMap visits={visible} />
    <p className="text-xs text-slate-600">Cada ponto representa um viveiro ou local de visita. O mapa não desenha os limites do imóvel. Cadastros antigos precisam abrir o site e sincronizar para publicar as coordenadas nesta área administrativa.</p>
    <div className="space-y-3">{visible.map(point => <article key={point.id} className="border-b border-slate-200 pb-3 space-y-1"><h3 className="font-bold">{point.farmName} · {point.pondName}</h3><p className="text-sm break-all">{point.clientEmail || 'E-mail ainda não sincronizado'}</p><p className="text-sm">{LICENSE_LABELS[point.licenseStatus]}</p><p className="text-xs text-slate-600">{point.latitude}, {point.longitude} · {VISIT_LABELS[point.status] || 'Cadastro sem avaliação técnica'} · {point.visitedOn}</p></article>)}</div>
  </section>;
}
