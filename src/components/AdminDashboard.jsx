import React, { useEffect, useState } from 'react';
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

export default function AdminDashboard() {
  const { user, access } = useAccount();
  const [tab, setTab] = useState('users');
  const [directoryWarning, setDirectoryWarning] = useState('');
  useEffect(() => {
    let stopped = false;
    if (isAdmin(user, access) && access?.fullName) void syncPropertyDirectory().then(conflicts => {
      if (!stopped) setDirectoryWarning(conflicts.length ? `Revise os nomes destes cadastros antigos antes de novos vínculos: ${conflicts.join(', ')}. Pode haver nome repetido ou falha ao reservar o nome.` : '');
    }).catch(() => { if (!stopped) setDirectoryWarning('Não foi possível conferir os nomes dos cadastros antigos. Atualize a página com conexão para tentar novamente.'); });
    return () => { stopped = true; };
  }, [user?.uid, access?.role, access?.fullName]);
  if (!isAdmin(user, access)) return <p role="alert">Área restrita à administração.</p>;
  if (!access?.fullName) return <section className="max-w-lg py-5 space-y-4"><h2 className="text-xl font-bold">Complete o nome da sua conta</h2><AccountNameEditor onSave={name => saveAccountName(user, name)} /></section>;
  const tabs = isSenior(user, access) ? [['users', 'Usuários e permissões'], ['purchases', 'Interesse em compras']] : [['users', 'Usuários e permissões']];
  tabs.push(['visits', 'Visitas e licenciamento']);
  tabs.push(['assisted', 'Auditoria de cadastros']);
  tabs.push(['authorizations', 'Autorizações']);
  tabs.push(['map', 'Mapa de propriedades']);
  return <div className="pt-5">{directoryWarning && <p role="alert" className="my-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">{directoryWarning}</p>}<nav aria-label="Administração" className="flex flex-wrap gap-2 border-b border-slate-200 pb-4">{tabs.map(([id, label]) => <button key={id} aria-current={tab === id ? 'page' : undefined} className={`min-h-11 rounded-xl border px-4 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-emerald-700 ${tab === id ? 'bg-emerald-700 border-emerald-700 text-white' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'}`} onClick={() => setTab(id)}>{label}</button>)}</nav>{tab === 'authorizations' ? <TechnicalAuthorizations /> : tab === 'assisted' ? <AssistedProducers mode="admin" /> : tab === 'map' ? <AdminPropertyMap /> : tab === 'visits' ? <TechnicalVisitsView administrative /> : tab === 'purchases' && isSenior(user, access) ? <AdminPurchasesView /> : <AdminUsersView />}</div>;
}
