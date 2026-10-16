import React, { useEffect, useState } from 'react';
import { readTechnicianIdentity } from '../services/technicalVisits.js';

export default function TechnicianIdentityCard({ uid, load = readTechnicianIdentity }) {
  const [identity, setIdentity] = useState(null), [loading, setLoading] = useState(true);
  useEffect(() => { let disposed = false; setIdentity(null); setLoading(true);
    void load(uid).then(value => { if (!disposed) setIdentity(value); }).catch(() => {}).finally(() => { if (!disposed) setLoading(false); });
    return () => { disposed = true; };
  }, [uid, load]);
  if (loading) return <p className="text-xs text-slate-600">Consultando identificação do técnico…</p>;
  if (!identity) return <p className="text-xs text-slate-600">Identificação profissional ainda não disponível.</p>;
  return <div className="flex items-center gap-3"><img src={identity.photoDataUrl} alt={`Foto de ${identity.fullName}`} className="h-16 w-16 rounded-xl object-cover" /><div><p className="text-sm font-semibold">{identity.fullName}</p><p className="text-sm text-slate-700">{identity.creaNumber ? `CREA: ${identity.creaNumber}` : 'N\u00e3o tem CREA cadastrado'}</p><p className="text-sm text-slate-700">{identity.employmentType === 'organization' ? identity.organizationName : identity.employmentType === 'private' ? 'Atendimento particular' : 'Vínculo profissional ainda não informado'}</p><p className="text-xs text-slate-600">Registro e vínculo informados pelo profissional.</p></div></div>;
}
