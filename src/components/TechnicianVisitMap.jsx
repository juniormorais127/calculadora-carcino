import React, { useEffect, useMemo, useState } from 'react';
import * as assistedApi from '../services/assistedProducers.js';
import { technicianMapVisits } from '../services/technicianMap.js';
import TechnicalVisitMap from './TechnicalVisitMap.jsx';
import MapExportButtons from './MapExportButtons.jsx';

export default function TechnicianVisitMap({ uid, visits, historyRequest = 0, api = assistedApi }) {
  const [producers, setProducers] = useState([]), [assistedVisits, setAssistedVisits] = useState({}), [loading, setLoading] = useState(true), [error, setError] = useState('');
  useEffect(() => {
    setProducers([]); setAssistedVisits({}); setLoading(true); setError('');
    return api.watchAssistedProducers('technician', uid, records => { setProducers(records); setLoading(false); }, () => { setLoading(false); setError('Não foi possível carregar os atendimentos assistidos no mapa. As outras visitas continuam disponíveis.'); });
  }, [uid, api]);
  useEffect(() => {
    setAssistedVisits({});
    const stops = producers.filter(item => item.technicianUid === uid).map(item => api.watchAssistedVisits(item.id, values => setAssistedVisits(previous => ({ ...previous, [item.id]: values })), () => setError('Alguns atendimentos assistidos não puderam ser carregados. Confira a conexão e reabra a área de visitas.')));
    return () => stops.forEach(stop => stop());
  }, [producers, uid, api]);
  const records = useMemo(() => technicianMapVisits(uid, visits, producers, assistedVisits), [uid, visits, producers, assistedVisits]);
  const located = records.filter(visit => Number.isFinite(visit.latitude) && Number.isFinite(visit.longitude));
  const exportRecords = useMemo(() => records.map(visit => {
    const producer = producers.find(item => visit.recipientUid === `assisted:${item.id}`);
    return producer ? { ...visit, clientName: producer.fullName, clientPhone: producer.phone, address: producer.address, city: producer.city, state: producer.state, clientEmail: producer.email, technicianName: producer.technicianName, auditStatus: producer.auditStatus } : visit;
  }), [records, producers]);
  return <div className="space-y-3"><h3 className="text-lg font-bold">Mapa das minhas visitas e imagens históricas</h3><p className="text-sm text-slate-600">Consulte os locais que você visitou, incluindo atendimentos assistidos. Use a barra de datas para comparar as imagens do mesmo local. Os pontos continuam representando suas visitas registradas, independentemente da data da imagem.</p>
    {loading && <p role="status" className="text-sm text-slate-600">Carregando os pontos dos seus atendimentos…</p>}
    {error && <p role="status" className="text-sm text-amber-900">{error}</p>}
    <p className="text-xs text-slate-600">{located.length} registro(s) de visita com coordenadas. Cada técnico acessa seus próprios registros.</p>
    <TechnicalVisitMap visits={records} historyRequest={historyRequest} />
    <MapExportButtons records={exportRecords} filename="minhas-visitas" loading={loading} />
    {!loading && !located.length && <p className="text-sm text-slate-600">Registre a localização em uma visita para visualizar o ponto no satélite atual e nas imagens históricas.</p>}
  </div>;
}
