import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { firestore } from '../services/firebase.js';
import { useAccount } from './AccountProvider.jsx';
import { accountRole } from '../services/accountPermissions.js';
import * as fieldApi from '../services/technicalVisits.js';
import { LICENSE_LABELS, VISIT_LABELS } from '../services/technicalVisitData.js';
import PondLocationFields from './PondLocationFields.jsx';
import TechnicalVisitMap from './TechnicalVisitMap.jsx';

const button = 'min-h-11 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-emerald-700';
const input = 'mt-1 block w-full min-h-11 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-2 focus-visible:outline-emerald-700';
export default function TechnicalVisitsView({ administrative = false, onReload, api = fieldApi }) {
  const { user, access, database } = useAccount();
  const technician = !administrative && accountRole(access, user.uid) === 'field_technician';
  const [tab, setTab] = useState(administrative ? 'admin' : technician ? 'technician' : 'client');
  const [grants, setGrants] = useState([]), [visits, setVisits] = useState([]);
  const [authorizedFarms, setAuthorizedFarms] = useState([]), [farmsLoading, setFarmsLoading] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState('');
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState('');
  const [techCode, setTechCode] = useState(''), [ownerEmail, setOwnerEmail] = useState('');
  const [farm, setFarm] = useState(null), [pondId, setPondId] = useState('');
  const [location, setLocation] = useState({ latitude: '', longitude: '' });
  const [summary, setSummary] = useState(''), [privateNotes, setPrivateNotes] = useState('');
  const [visitedOn, setVisitedOn] = useState(new Date().toLocaleDateString('en-CA'));
  const [correctLocation, setCorrectLocation] = useState(false), [licenseStatus, setLicenseStatus] = useState('unknown');
  const [licenseNumber, setLicenseNumber] = useState(''), [licenseRegisteredOn, setLicenseRegisteredOn] = useState(''), [licenseExpiresOn, setLicenseExpiresOn] = useState('');
  const [privateView, setPrivateView] = useState(null);
  useEffect(() => {
    setFarm(null); setPrivateView(null); setError(''); setVisits([]); setGrants([]);
    const field = administrative ? null : tab === 'technician' ? 'technicianUid' : 'ownerUid';
    const fail = () => setError('Não foi possível carregar as visitas. Confira a conexão e suas permissões.');
    const stops = [api.watchFieldRecords('fieldAuthorizations', field, user.uid, setGrants, fail), api.watchFieldRecords('technicalVisits', field, user.uid, setVisits, fail)];
    return () => stops.forEach(stop => stop());
  }, [user.uid, tab, administrative, api]);
  useEffect(() => {
    if (tab !== 'technician') return;
    let disposed = false;
    setFarmsLoading(true); setAuthorizedFarms([]); setSelectedOwner('');
    void Promise.allSettled(grants.filter(item => item.active).map(async item => ({ grant: item, farm: await api.readSharedFarm(item.ownerUid) }))).then(results => {
      if (disposed) return;
      const values = results.filter(item => item.status === 'fulfilled').map(item => item.value);
      setAuthorizedFarms(values); setFarmsLoading(false);
      if (results.some(item => item.status === 'rejected')) setError('Não foi possível consultar algumas propriedades. Confira a conexão e se a autorização continua ativa.');
    });
    return () => { disposed = true; };
  }, [grants, tab, api]);
  useEffect(() => {
    const pond = farm?.ponds.find(item => String(item.id) === pondId);
    setLocation({ latitude: String(pond?.latitude ?? ''), longitude: String(pond?.longitude ?? '') }); setCorrectLocation(false);
  }, [farm, pondId]);
  async function run(action) {
    setBusy(true); setError(''); setMessage('');
    try { await action(); } catch (err) { setError(err.code ? 'A operação não foi autorizada ou não pôde ser concluída. Confira a conexão, o código do técnico e a autorização.' : err.message); }
    finally { setBusy(false); }
  }
  async function grant(event) {
    event.preventDefault();
    await run(async () => {
      let ownerUid = user.uid;
      if (administrative) {
        const profiles = await getDocs(query(collection(firestore, 'accountProfiles'), where('email', '==', ownerEmail.trim())));
        if (profiles.size !== 1) throw new Error('Cliente não localizado. Confira o e-mail cadastrado.');
        ownerUid = profiles.docs[0].id;
      }
      await api.authorizeTechnician(ownerUid, techCode, user.uid); setTechCode(''); setMessage('Técnico autorizado. O cliente precisará aprovar o relatório e os ajustes após cada visita.');
    });
  }
  async function submit(event) {
    event.preventDefault();
    await run(async () => {
      const pond = farm.ponds.find(item => String(item.id) === pondId);
      if (!pond) throw new Error('Selecione o viveiro visitado.');
      await api.submitTechnicalVisit(user, farm, pond, { visitedOn, summary, privateNotes, correctLocation, ...location, licenseStatus, licenseNumber, licenseRegisteredOn, licenseExpiresOn });
      setFarm(null); setSummary(''); setPrivateNotes(''); setLicenseStatus('unknown'); setLicenseNumber(''); setLicenseRegisteredOn(''); setLicenseExpiresOn('');
      setMessage('Visita registrada. O cliente foi avisado no site e precisa aceitar os ajustes. Suas anotações privadas não foram enviadas.');
    });
  }
  async function openFarm(ownerUid) {
    await run(async () => {
      const value = await api.readSharedFarm(ownerUid);
      if (!value) throw new Error('O cliente precisa abrir o site e sincronizar os viveiros antes da visita.');
      if (!value.ponds.length) throw new Error('A propriedade ainda não tem viveiros cadastrados. Peça ao cliente para cadastrar e sincronizar o viveiro que será visitado.');
      setFarm(value); setSelectedOwner(ownerUid); setPondId(String(value.ponds[0].id)); setSummary(''); setPrivateNotes(''); setLicenseStatus('unknown');
      setLicenseNumber(''); setLicenseRegisteredOn(''); setLicenseExpiresOn('');
    });
  }
  const ordered = [...visits].sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
  return <section className="py-5 pb-20 space-y-6">
    <div className="space-y-2"><h2 className="text-2xl font-bold">{administrative ? 'Visitas e licenciamento' : 'Visitas técnicas'}</h2><p className="text-sm text-slate-600 max-w-2xl">O técnico propõe ajustes. O cliente revisa e aceita ou recusa o relatório. A localização só muda após o aceite.</p></div>
    {technician && <nav aria-label="Área de visitas" className="flex flex-wrap gap-2"><button className={button} aria-pressed={tab === 'client'} onClick={() => setTab('client')}>Minha propriedade</button><button className={button} aria-pressed={tab === 'technician'} onClick={() => setTab('technician')}>Meus atendimentos</button></nav>}
    {error && <p role="alert" className="text-sm text-rose-800 bg-rose-50 border border-rose-200 rounded-xl p-4">{error}</p>}
    {message && <p role="status" className="text-sm text-emerald-900 bg-emerald-50 border border-emerald-200 rounded-xl p-4">{message}</p>}
    {tab === 'technician' && <div className="space-y-4 max-w-2xl rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="text-lg font-bold">Nova visita</h3>
      <p className="text-sm text-slate-600">Selecione a propriedade autorizada para preencher data, localização, licenciamento e o relatório da visita.</p>
      {farmsLoading ? <p role="status" className="text-sm text-slate-600">Carregando propriedades autorizadas…</p> : authorizedFarms.some(item => item.farm) ? <>
        <label className="block text-sm font-semibold">Propriedade que vou visitar<select value={selectedOwner} onChange={event => setSelectedOwner(event.target.value)} className={input}><option value="">Selecione a propriedade</option>{authorizedFarms.filter(item => item.farm).map(item => <option key={item.grant.ownerUid} value={item.grant.ownerUid}>{item.farm.name}</option>)}</select></label>
        <button className={`${button} bg-emerald-700 text-white border-emerald-700 hover:bg-emerald-800`} disabled={busy || !selectedOwner} onClick={() => openFarm(selectedOwner)}>Preencher visita</button>
      </> : <p className="text-sm text-slate-700">Nenhuma propriedade disponível para visita. Envie seu código abaixo ao cliente ou à administração para autorizar o atendimento. Depois, o cliente deve abrir o site e sincronizar os viveiros.</p>}
    </div>}
    {tab !== 'technician' && <form onSubmit={grant} className="max-w-xl space-y-4 rounded-2xl border border-slate-200 bg-white p-5"><h3 className="text-lg font-bold">Autorizar uma visita técnica</h3>
      {administrative && <label className="block text-sm font-semibold">E-mail do cliente<input type="email" required value={ownerEmail} onChange={event => setOwnerEmail(event.target.value)} className={input} /></label>}
      <label className="block text-sm font-semibold">Código do técnico<input required value={techCode} onChange={event => setTechCode(event.target.value)} maxLength={128} className={input} /></label>
      <p className="text-xs text-slate-600">Peça ao técnico o código exibido em “Meus atendimentos”. Ele poderá ver o nome da propriedade e a localização dos viveiros enquanto estiver autorizado. O relato de cada visita e os ajustes precisam do aceite do cliente.</p>
      <button disabled={busy} className={button}>Autorizar técnico</button>
    </form>}
    {tab === 'technician' && <div className="space-y-3"><h3 className="font-bold">Seu código para autorizar visitas</h3><p className="break-all font-semibold text-sm select-all">{user.uid}</p><p className="text-xs text-slate-600">Compartilhe esse código com o cliente ou a administração. Ele identifica sua conta, sem conceder acesso sozinho.</p></div>}
    <div className="space-y-3"><h3 className="text-lg font-bold">{tab === 'technician' ? 'Clientes que autorizaram atendimento' : 'Autorizações de atendimento'}</h3>
      {!grants.length && <p className="text-sm text-slate-600">Nenhuma autorização registrada.</p>}
      {grants.map(item => <div key={item.id} className="border-b border-slate-200 pb-3 space-y-2"><p className="text-sm break-all">{tab === 'technician' ? authorizedFarms.find(value => value.grant.ownerUid === item.ownerUid)?.farm?.name || (item.active ? 'Propriedade aguardando sincronização do cliente' : 'Atendimento revogado') : `Cliente: ${item.ownerUid} · Técnico: ${item.technicianUid}`} · <strong>{item.active ? 'Autorizado' : 'Revogado'}</strong></p>
        {tab === 'technician' ? item.active && <button className={button} disabled={busy} onClick={() => openFarm(item.ownerUid)}>Abrir propriedade</button> : item.active && <button className={button} disabled={busy} onClick={() => run(() => api.authorizeTechnician(item.ownerUid, item.technicianUid, user.uid, false))}>Revogar autorização</button>}
      </div>)}
    </div>
    {farm && tab === 'technician' && <form onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 max-w-2xl">
      <h3 className="text-lg font-bold">Registrar visita: {farm.name}</h3>
      <label className="block text-sm font-semibold">Nome da propriedade<input readOnly value={farm.name} className={`${input} bg-slate-50`} /></label>
      <p className="text-xs text-slate-600">O nome vem do cadastro autorizado pelo cliente. O relatório será enviado para essa conta.</p>
      <label className="block text-sm font-semibold">Viveiro<select required value={pondId} onChange={event => setPondId(event.target.value)} className={input}><option value="">Selecione</option>{farm.ponds.map(pond => <option key={pond.id} value={pond.id}>{pond.name}</option>)}</select></label>
      <label className="block text-sm font-semibold">Data da visita<input type="date" required value={visitedOn} onChange={event => setVisitedOn(event.target.value)} className={input} /></label>
      <PondLocationFields value={location} onChange={value => { setLocation(value); setCorrectLocation(true); }} />
      <label className="flex gap-3 items-center min-h-11 text-sm font-semibold"><input type="checkbox" checked={correctLocation} onChange={event => setCorrectLocation(event.target.checked)} />Informar localização errada e propor correção</label>
      <label className="block text-sm font-semibold">Situação do licenciamento<select value={licenseStatus} onChange={event => setLicenseStatus(event.target.value)} className={input}>{Object.entries(LICENSE_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      {licenseStatus === 'licensed' && <><label className="block text-sm font-semibold">Número do licenciamento<input required maxLength={120} value={licenseNumber} onChange={event => setLicenseNumber(event.target.value)} className={input} /></label><label className="block text-sm font-semibold">Data de cadastro do licenciamento<input type="date" required value={licenseRegisteredOn} onChange={event => setLicenseRegisteredOn(event.target.value)} className={input} /></label><label className="block text-sm font-semibold">Vencimento do licenciamento<input type="date" required value={licenseExpiresOn} onChange={event => setLicenseExpiresOn(event.target.value)} className={input} /></label></>}
      <label className="block text-sm font-semibold">Relatório para aprovação do cliente (obrigatório)<textarea required minLength={10} maxLength={10000} rows={4} value={summary} onChange={event => setSummary(event.target.value)} className={input} /></label>
      <label className="block text-sm font-semibold">Anotações privadas do técnico (opcional)<textarea maxLength={10000} rows={3} value={privateNotes} onChange={event => setPrivateNotes(event.target.value)} className={input} /></label>
      <p className="text-xs text-slate-600">Só você acessa as anotações privadas. O relatório acima, as coordenadas e o licenciamento serão enviados ao cliente para revisão. Administradores e Sênior podem consultar o relatório e o mapa.</p>
      <div className="flex flex-wrap gap-3"><button disabled={busy} className={button}>Registrar visita e enviar para aceite</button><button type="button" disabled={busy} onClick={() => setFarm(null)} className={button}>Cancelar visita</button></div>
    </form>}
    {(administrative || tab === 'technician') && <TechnicalVisitMap visits={visits} />}
    <div className="space-y-5"><h3 className="text-lg font-bold">{administrative ? 'Histórico de visitas' : tab === 'technician' ? 'Propriedades visitadas e alterações propostas' : 'Relatórios recebidos e notificações'}</h3>
      {!ordered.length && <p className="text-sm text-slate-600">Nenhuma visita registrada.</p>}
      {ordered.map(visit => <article key={visit.id} className="space-y-3 border-b border-slate-300 pb-5">
        <h4 className="font-bold">{visit.farmName} · {visit.pondName}</h4><p className="text-sm text-slate-600">Visita: {visit.visitedOn} · Técnico: {visit.technicianEmail}</p><p className="text-sm font-semibold text-emerald-900">{VISIT_LABELS[visit.status]}</p>
        <p className="text-sm whitespace-pre-wrap break-words">{visit.summary}</p>
        {visit.correctLocation && <p className="text-sm">Correção de localização: {visit.previousLatitude ?? 'sem latitude'}, {visit.previousLongitude ?? 'sem longitude'} → <strong>{visit.latitude}, {visit.longitude}</strong></p>}
        <p className="text-sm">{LICENSE_LABELS[visit.licenseStatus]}{visit.licenseStatus === 'licensed' ? ` · Nº ${visit.licenseNumber} · Cadastro: ${visit.licenseRegisteredOn} · Vencimento: ${visit.licenseExpiresOn}` : ''}</p>
        {visit.status === 'pending' && visit.ownerUid === user.uid && <div className="space-y-2"><p className="text-xs text-slate-600">Ao aceitar, você aprova o relatório e os ajustes descritos. Se houver erro, recuse e peça uma nova visita ao técnico.</p><div className="flex flex-wrap gap-3"><button disabled={busy} className={button} onClick={() => run(async () => { await api.checkVisitApproval(database, visit); await api.decideVisit(visit.id, true); await api.applyAcceptedVisit(database, { ...visit, status: 'accepted' }); await onReload?.(); setMessage('Visita aceita. Ajustes aplicados ao cadastro e aguardando a sincronização da conta.'); })}>Aceitar relatório e ajustes</button><button disabled={busy} className={button} onClick={() => run(async () => { await api.decideVisit(visit.id, false); setMessage('Visita recusada. O cadastro não foi alterado.'); })}>Recusar relatório</button></div></div>}
        {visit.technicianUid === user.uid && <button className={button} disabled={busy} onClick={() => run(async () => setPrivateView({ id: visit.id, notes: await api.readPrivateVisit(user.uid, visit.id) }))}>Ver minhas anotações privadas</button>}
        {privateView?.id === visit.id && <p className="text-sm whitespace-pre-wrap break-words border border-slate-200 rounded-xl p-4">{privateView.notes}</p>}
      </article>)}
    </div>
  </section>;
}
