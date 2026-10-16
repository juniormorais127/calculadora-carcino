import React, { useEffect, useRef, useState } from 'react';
import { liveQuery } from 'dexie';
import { useAccount } from './AccountProvider.jsx';
import { applyAcceptedVisit, publishSharedFarm, watchFieldRecords } from '../services/technicalVisits.js';

export default function TechnicalVisitBridge({ onOpen, onReload }) {
  const { user, database, syncStatus } = useAccount();
  const [visits, setVisits] = useState([]), [error, setError] = useState('');
  const [inspections, setInspections] = useState([]);
  const lastProjection = useRef('');
  const callbacks = useRef({ onReload }); callbacks.current = { onReload };
  const synced = syncStatus.state === 'synced';
  useEffect(() => watchFieldRecords('technicalVisits', 'ownerUid', user.uid, setVisits, () => setError('Não foi possível consultar os avisos de visitas técnicas.')), [user.uid]);
  useEffect(() => watchFieldRecords('fieldInspectionReports', 'clientEmail', user.email.toLowerCase(), setInspections, () => setError('Não foi possível consultar as notificações de campo.')), [user.email]);
  useEffect(() => {
    if (!synced) return;
    let stopped = false, timer;
    const subscription = liveQuery(async () => ({ farm: await database.configuracoes.where('chave').equals('perfilFazenda').first(), ponds: await database.viveiros.toArray() })).subscribe({
      next: value => {
        clearTimeout(timer);
        const signature = JSON.stringify({ name: value.farm?.nomeFazenda, ponds: value.ponds.map(item => [item.id, item.nome, item.latitude, item.longitude]) });
        if (signature === lastProjection.current) return;
        timer = setTimeout(async () => {
          try { await publishSharedFarm(user, value.farm, value.ponds); if (!stopped) lastProjection.current = signature; }
          catch { if (!stopped) setError('Não foi possível atualizar os dados compartilhados com os técnicos. Tente sincronizar novamente.'); }
        }, 600);
      }, error: () => setError('Não foi possível consultar os viveiros para as visitas técnicas.'),
    });
    return () => { stopped = true; clearTimeout(timer); subscription.unsubscribe(); };
  }, [database, user.uid, synced]);
  useEffect(() => {
    if (!synced) return;
    let stopped = false;
    void (async () => {
      let changed = false;
      try {
        for (const visit of [...visits].sort((a, b) => (a.decidedAt?.toMillis?.() || 0) - (b.decidedAt?.toMillis?.() || 0))) {
          if (stopped) break;
          changed = await applyAcceptedVisit(database, visit) || changed;
        }
        if (changed && !stopped) await callbacks.current.onReload?.();
      } catch (err) { if (!stopped) setError(err.message); }
    })();
    return () => { stopped = true; };
  }, [database, visits, synced]);
  const pending = [...visits, ...inspections].filter(visit => visit.status === 'pending').length;
  return <>{pending > 0 && <div role="status" className="my-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-950"><span>{pending} visita(s) técnica(s) aguardando seu aceite. Confira o relatório e os ajustes propostos.</span><button className="min-h-11 font-semibold underline underline-offset-4" onClick={onOpen}>Revisar visitas</button></div>}{error && <p role="alert" className="my-3 text-sm text-rose-800">{error}</p>}</>;
}
