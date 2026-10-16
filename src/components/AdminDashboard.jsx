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

export default function AdminDashboard() {
  const { user, access } = useAccount();
  const [tab, setTab] = useState('users');
  useEffect(() => { if (isAdmin(user, access) && access?.fullName) void syncPropertyDirectory().catch(() => {}); }, [user?.uid, access?.role, access?.fullName]);
  if (!isAdmin(user, access)) return <p role="alert">Área restrita à administração.</p>;
  if (!access?.fullName) return <section className="max-w-lg py-5 space-y-4"><h2 className="text-xl font-bold">Complete o nome da sua conta</h2><AccountNameEditor onSave={name => saveAccountName(user, name)} /></section>;
  const tabs = isSenior(user, access) ? [['users', 'Usuários e permissões'], ['purchases', 'Interesse em compras']] : [['users', 'Usuários e permissões']];
  tabs.push(['visits', 'Visitas e licenciamento']);
  tabs.push(['map', 'Mapa de propriedades']);
  return <div className="pt-5"><nav aria-label="Administração" className="flex flex-wrap gap-2 border-b border-slate-200 pb-4">{tabs.map(([id, label]) => <button key={id} aria-current={tab === id ? 'page' : undefined} className={`min-h-11 rounded-xl border px-4 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-emerald-700 ${tab === id ? 'bg-emerald-700 border-emerald-700 text-white' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'}`} onClick={() => setTab(id)}>{label}</button>)}</nav>{tab === 'map' ? <AdminPropertyMap /> : tab === 'visits' ? <TechnicalVisitsView administrative /> : tab === 'purchases' && isSenior(user, access) ? <AdminPurchasesView /> : <AdminUsersView />}</div>;
}
