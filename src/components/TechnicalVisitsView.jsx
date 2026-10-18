import React, { useEffect, useRef, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { firestore } from '../services/firebase.js';
import { useAccount } from './AccountProvider.jsx';
import { accountRole, canAuditTechnicalSupport } from '../services/accountPermissions.js';
import * as fieldApi from '../services/technicalVisits.js';
import { LICENSE_LABELS, VISIT_LABELS } from '../services/technicalVisitData.js';
import PondLocationFields from './PondLocationFields.jsx';
import TechnicalVisitMap from './TechnicalVisitMap.jsx';
import TechnicianVisitMap from './TechnicianVisitMap.jsx';
import TechnicianIdentityEditor from './TechnicianIdentityEditor.jsx';
import TechnicianIdentityCard from './TechnicianIdentityCard.jsx';
import { hasTechnicianIdentity } from '../services/technicianIdentity.js';
import PropertyLookup from './PropertyLookup.jsx';
import AssistedProducers from './AssistedProducers.jsx';
import TechnicalAuthorizations from './TechnicalAuthorizations.jsx';
import LocalVisitPhotos, { VisitGuide } from './LocalVisitPhotos.jsx';
import { bindLocalVisitPhotos } from '../services/localVisitPhotos.js';
import FieldNotebook from './FieldNotebook.jsx';

const button = 'min-h-11 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-emerald-700';
const input = 'mt-1 block w-full min-h-11 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-2 focus-visible:outline-emerald-700';
export default function TechnicalVisitsView({ administrative = false, onReload, api = fieldApi }) {
  const { user, access, database, technicianIdentity, identityLoading, identityError } = useAccount();
  const identified = hasTechnicianIdentity(technicianIdentity) && technicianIdentity.fullName === access?.fullName;
  const technician = !administrative && accountRole(access, user.uid) === 'field_technician';
  const [tab, setTab] = useState(administrative ? 'admin' : technician ? 'technician' : 'client');
  const [grants, setGrants] = useState([]), [visits, setVisits] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [directInspections, setDirectInspections] = useState([]);
  const [clientEmail, setClientEmail] = useState(''), [propertyName, setPropertyName] = useState('');
  const [recipientUid, setRecipientUid] = useState(null);
  const [authorizedFarms, setAuthorizedFarms] = useState([]), [farmsLoading, setFarmsLoading] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState('');
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState('');
  const [techCode, setTechCode] = useState(''), [ownerEmail, setOwnerEmail] = useState('');
  const [farm, setFarm] = useState(null), [pondId, setPondId] = useState('');
  const independent = !!farm?.independent;
  const [location, setLocation] = useState({ latitude: '', longitude: '' });
  const [summary, setSummary] = useState(''), [privateNotes, setPrivateNotes] = useState('');
  const [visitedOn, setVisitedOn] = useState(new Date().toLocaleDateString('en-CA'));
  const [correctLocation, setCorrectLocation] = useState(false), [licenseStatus, setLicenseStatus] = useState('unknown');
  const [licenseNumber, setLicenseNumber] = useState(''), [licenseRegisteredOn, setLicenseRegisteredOn] = useState(''), [licenseExpiresOn, setLicenseExpiresOn] = useState('');
  const [privateView, setPrivateView] = useState(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [historyRequest, setHistoryRequest] = useState(0);
  const technicianMapRef = useRef(null);
  const photoDraft = `draft:${independent ? 'independent' : `${farm?.ownerUid || ''}:${pondId}`}`;
  const formRef = useRef(null), feedbackRef = useRef(null);
  function focusForm() {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    formRef.current?.querySelector('input:not([readonly]), select, textarea')?.focus({ preventScroll: true });
  }
  useEffect(() => {
    if (!farm) return;
    const frame = requestAnimationFrame(focusForm);
    return () => cancelAnimationFrame(frame);
  }, [farm]);
  useEffect(() => {
    if (error || message) {
      feedbackRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      feedbackRef.current?.focus({ preventScroll: true });
    }
  }, [error, message]);
  useEffect(() => {
    setFarm(null); setPrivateView(null); setError(''); setVisits([]); setGrants([]); setInspections([]); setDirectInspections([]);
    const field = administrative ? null : tab === 'technician' ? 'technicianUid' : 'ownerUid';
    const fail = () => setError('Não foi possível carregar as visitas. Confira a conexão e suas permissões.');
    const stops = [api.watchFieldRecords('fieldAuthorizations', field, user.uid, setGrants, fail), api.watchFieldRecords('technicalVisits', field, user.uid, setVisits, fail),
      api.watchFieldRecords('fieldInspectionReports', administrative ? null : tab === 'technician' ? 'technicianUid' : 'clientEmail', tab === 'technician' ? user.uid : user.email.toLowerCase(), setInspections, fail)];
    if (!administrative && tab !== 'technician') stops.push(api.watchFieldRecords('fieldInspectionReports', 'recipientUid', user.uid, setDirectInspections, fail));
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
      await api.authorizeTechnician(ownerUid, techCode, user.uid); setTechCode(''); setMessage('Pedido enviado. A assistência técnica está pendente de auditoria na aba Autorizações. Preencher o relatório não libera o atendimento automaticamente.');
    });
  }
  async function submit(event) {
    event.preventDefault();
    await run(async () => {
      if (!identified) throw new Error('Complete nome, CREA e foto na identificação profissional antes de enviar a visita.');
      if (independent) {
        const id = await api.submitIndependentVisit(user, { clientEmail, recipientUid, propertyName, visitedOn, summary, privateNotes, ...location, licenseStatus, licenseNumber, licenseRegisteredOn, licenseExpiresOn });
        if (id) await bindLocalVisitPhotos(user.uid, photoDraft, `inspection:${id}`).catch(() => { setError('O relatório foi salvo, mas não foi possível vincular as fotos locais. Abra a guia do registro abaixo para anexá-las novamente.'); });
        setFarm(null); setMessage(recipientUid || clientEmail ? 'Registro de campo enviado ao cliente para ciência e aceite. O cadastro do produtor não foi alterado.' : 'Registro de campo salvo para você e a administração. Sem cadastro vinculado ou e-mail, nenhum cliente recebeu notificação.');
        return;
      }
      const pond = farm.ponds.find(item => String(item.id) === pondId);
      if (!pond) throw new Error('Selecione o viveiro visitado.');
      const id = await api.submitTechnicalVisit(user, farm, pond, { visitedOn, summary, privateNotes, correctLocation, ...location, licenseStatus, licenseNumber, licenseRegisteredOn, licenseExpiresOn });
      if (id) await bindLocalVisitPhotos(user.uid, photoDraft, `visit:${id}`).catch(() => { setError('O relatório foi salvo, mas as fotos não foram vinculadas. Abra a guia do registro abaixo para anexá-las novamente.'); });
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
  const mergedInspections = [...new Map([...inspections, ...directInspections].map(item => [item.id, item])).values()];
  const allVisits = [...visits, ...mergedInspections.map(item => ({ ...item, independent: true, farmName: item.propertyName, pondName: 'Registro de campo', pondId: null }))];
  const ordered = [...allVisits].sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
  if (tab === 'authorizations') return <section className="py-5 pb-20 space-y-6"><button className={button} onClick={() => setTab(technician ? 'technician' : 'client')}>Voltar para visitas</button><TechnicalAuthorizations /><AssistedProducers mode="admin" /></section>;
  return <section className="py-5 pb-20 space-y-6">
    <div className="space-y-2"><h2 className="text-2xl font-bold">{administrative ? 'Visitas e licenciamento' : 'Visitas técnicas'}</h2><p className="text-sm text-slate-600 max-w-2xl">O técnico propõe ajustes. O cliente revisa e aceita ou recusa o relatório. A localização só muda após o aceite.</p></div>
    {canAuditTechnicalSupport(user, access) && <button className={button} onClick={() => setTab('authorizations')}>Autorizações e auditoria</button>}
    {technician && <nav aria-label="Área de visitas" className="flex flex-wrap gap-2"><button className={button} aria-pressed={tab === 'client'} onClick={() => setTab('client')}>Minha propriedade</button><button className={button} aria-pressed={tab === 'technician'} onClick={() => setTab('technician')}>Meus atendimentos</button></nav>}
    {tab === 'technician' && <button className={`${button} border-emerald-700 text-emerald-800`} onClick={() => { setHistoryRequest(value => value + 1); technicianMapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); technicianMapRef.current?.focus({ preventScroll: true }); }}>Mapa e imagens históricas</button>}
    {error && <p ref={feedbackRef} tabIndex={-1} role="alert" className="text-sm text-rose-800 bg-rose-50 border border-rose-200 rounded-xl p-4">{error}</p>}
    {message && <p ref={feedbackRef} tabIndex={-1} role="status" className="text-sm text-emerald-900 bg-emerald-50 border border-emerald-200 rounded-xl p-4">{message}</p>}
    {tab === 'technician' && <TechnicianIdentityEditor accountName={access?.fullName} value={technicianIdentity} loading={identityLoading} loadError={identityError} onSave={value => api.saveTechnicianIdentity(user, value)} />}
    {tab === 'technician' && !identified && <p className="text-sm font-semibold text-amber-900">Salve sua foto e o tipo de atendimento acima para liberar o envio de visitas e notificações. O CREA é opcional.</p>}
    {!administrative && <AssistedProducers key={`assisted:${tab}`} mode={tab === 'technician' ? 'technician' : 'client'} identified={identified} authorizedOwners={grants.filter(item => item.active).map(item => item.ownerUid)} />}
    {!administrative && <TechnicalAuthorizations mode={tab === 'technician' ? 'technician' : 'client'} />}
    {tab === 'technician' && <FieldNotebook key={user.uid} user={user} technicianName={access?.fullName} />}
    {tab === 'technician' && <div className="space-y-3"><button className={`${button} bg-emerald-700 text-white border-emerald-700 hover:bg-emerald-800`} disabled={busy || !identified} onClick={() => {
      if (independent) { focusForm(); return; }
      setPropertyName(''); setRecipientUid(null); setClientEmail(''); setSummary(''); setPrivateNotes(''); setLicenseStatus('unknown'); setLicenseNumber(''); setLicenseRegisteredOn(''); setLicenseExpiresOn(''); setPondId('');
      setFarm({ independent: true, ponds: [] }); setError(''); setMessage('');
    }}>Registrar visita e notificar produtor</button><p className="text-sm text-slate-600">Registre uma constatação de campo, como ausência de licenciamento, sem precisar de acesso ao cadastro do cliente. Ele será avisado no site pelo e-mail informado.</p></div>}
    {tab === 'technician' && <div className="space-y-4 max-w-2xl rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="text-lg font-bold">Nova visita</h3>
      <p className="text-sm text-slate-600">Selecione a propriedade autorizada para preencher data, localização, licenciamento e o relatório da visita.</p>
      {farmsLoading ? <p role="status" className="text-sm text-slate-600">Carregando propriedades autorizadas…</p> : authorizedFarms.some(item => item.farm) ? <>
        <label className="block text-sm font-semibold">Propriedade que vou visitar<select value={selectedOwner} onChange={event => setSelectedOwner(event.target.value)} className={input}><option value="">Selecione a propriedade</option>{authorizedFarms.filter(item => item.farm).map(item => <option key={item.grant.ownerUid} value={item.grant.ownerUid}>{item.farm.name}</option>)}</select></label>
        <button className={`${button} bg-emerald-700 text-white border-emerald-700 hover:bg-emerald-800`} disabled={busy || !selectedOwner || !identified} onClick={() => openFarm(selectedOwner)}>Preencher visita</button>
      </> : <p className="text-sm text-slate-700">Nenhuma propriedade disponível para visita. Envie seu código abaixo ao cliente ou à administração para autorizar o atendimento. Depois, o cliente deve abrir o site e sincronizar os viveiros.</p>}
    </div>}
    {tab !== 'technician' && <form onSubmit={grant} className="max-w-xl space-y-4 rounded-2xl border border-slate-200 bg-white p-5"><h3 className="text-lg font-bold">Autorizar uma visita técnica</h3>
      {administrative && <label className="block text-sm font-semibold">E-mail do cliente<input type="email" required value={ownerEmail} onChange={event => setOwnerEmail(event.target.value)} className={input} /></label>}
      <label className="block text-sm font-semibold">Código do técnico<input required value={techCode} onChange={event => setTechCode(event.target.value)} maxLength={128} className={input} /></label>
      <p className="text-xs text-slate-600">Peça ao técnico o código exibido em “Meus atendimentos”. Ele poderá ver o nome da propriedade e a localização dos viveiros enquanto estiver autorizado. O relato de cada visita e os ajustes precisam do aceite do cliente.</p>
      <button disabled={busy} className={button}>Enviar pedido para auditoria</button>
    </form>}
    {tab === 'technician' && <div className="space-y-3"><h3 className="font-bold">Seu código para autorizar visitas</h3><p className="break-all font-semibold text-sm select-all">{user.uid}</p><p className="text-xs text-slate-600">Compartilhe esse código com o cliente ou a administração. Ele identifica sua conta, sem conceder acesso sozinho.</p></div>}
    <div className="space-y-3"><h3 className="text-lg font-bold">{tab === 'technician' ? 'Clientes que autorizaram atendimento' : 'Autorizações de atendimento'}</h3>
      {!grants.length && <p className="text-sm text-slate-600">Nenhuma autorização registrada.</p>}
      {grants.map(item => <div key={item.id} className="border-b border-slate-200 pb-3 space-y-2"><p className="text-sm break-all">{tab === 'technician' ? authorizedFarms.find(value => value.grant.ownerUid === item.ownerUid)?.farm?.name || (item.active ? 'Propriedade aguardando sincronização do cliente' : 'Atendimento revogado') : `Cliente: ${item.ownerUid} · Técnico: ${item.technicianUid}`} · <strong>{item.active ? 'Autorizado' : item.status === 'pending' ? 'Pendente de auditoria' : item.status === 'changes_requested' ? 'Ajustes solicitados' : 'Sem autoriza\u00e7\u00e3o ativa'}</strong></p>
        {tab !== 'technician' && <TechnicianIdentityCard uid={item.technicianUid} load={api.readTechnicianIdentity} />}
        {tab === 'technician' ? item.active && <button className={button} disabled={busy} onClick={() => openFarm(item.ownerUid)}>Abrir propriedade</button> : item.active && <button className={button} disabled={busy} onClick={() => run(() => api.authorizeTechnician(item.ownerUid, item.technicianUid, user.uid, false))}>Revogar autorização</button>}
      </div>)}
    </div>
    {farm && tab === 'technician' && <form ref={formRef} onSubmit={submit} aria-busy={busy} className="scroll-mt-24 space-y-4 rounded-2xl border border-slate-200 bg-white p-5 max-w-2xl">
      <h3 className="text-lg font-bold">{independent ? 'Registro de campo e notificação ao produtor' : `Registrar visita: ${farm.name}`}</h3>
      {independent ? <><PropertyLookup value={propertyName} recipientUid={recipientUid} search={api.searchRegisteredProperties} className={input} onChange={text => { setPropertyName(text); setRecipientUid(null); }} onSelect={item => { setPropertyName(item.name); setRecipientUid(item.ownerUid); setClientEmail(''); }} /><label className="block text-sm font-semibold">E-mail do produtor (opcional)<input type="email" disabled={!!recipientUid} maxLength={320} value={clientEmail} onChange={event => setClientEmail(event.target.value)} className={input} /></label></> : <><label className="block text-sm font-semibold">Nome da propriedade<input readOnly value={farm.name} className={`${input} bg-slate-50`} /></label><p className="text-xs text-slate-600">O nome vem do cadastro autorizado pelo cliente. O relatório será enviado para essa conta.</p><label className="block text-sm font-semibold">Viveiro<select required value={pondId} onChange={event => setPondId(event.target.value)} className={input}><option value="">Selecione</option>{farm.ponds.map(pond => <option key={pond.id} value={pond.id}>{pond.name}</option>)}</select></label></>}
      <label className="block text-sm font-semibold">Data da visita<input type="date" required value={visitedOn} onChange={event => setVisitedOn(event.target.value)} className={input} /></label>
      <PondLocationFields value={location} onChange={value => { setLocation(value); setCorrectLocation(true); }} />
      {!independent && <label className="flex gap-3 items-center min-h-11 text-sm font-semibold"><input type="checkbox" checked={correctLocation} onChange={event => setCorrectLocation(event.target.checked)} />Informar localização errada e propor correção</label>}
      <label className="block text-sm font-semibold">Situação do licenciamento<select value={licenseStatus} onChange={event => setLicenseStatus(event.target.value)} className={input}>{Object.entries(LICENSE_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      {licenseStatus === 'licensed' && <><label className="block text-sm font-semibold">Número do licenciamento<input required maxLength={120} value={licenseNumber} onChange={event => setLicenseNumber(event.target.value)} className={input} /></label><label className="block text-sm font-semibold">Data de cadastro do licenciamento<input type="date" required value={licenseRegisteredOn} onChange={event => setLicenseRegisteredOn(event.target.value)} className={input} /></label><label className="block text-sm font-semibold">Vencimento do licenciamento<input type="date" required value={licenseExpiresOn} onChange={event => setLicenseExpiresOn(event.target.value)} className={input} /></label></>}
      <label className="block text-sm font-semibold">Relatório para aprovação do cliente (obrigatório)<textarea required minLength={10} maxLength={10000} rows={4} value={summary} onChange={event => setSummary(event.target.value)} className={input} /></label>
      <label className="block text-sm font-semibold">Anotações privadas do técnico (opcional)<textarea maxLength={10000} rows={3} value={privateNotes} onChange={event => setPrivateNotes(event.target.value)} className={input} /></label>
      <LocalVisitPhotos uid={user.uid} storageKey={photoDraft} onBusyChange={setPhotoBusy} />
      <p className="text-xs text-slate-600">Só você acessa as anotações privadas. O relatório acima, as coordenadas e o licenciamento serão enviados ao cliente para revisão. Administradores e Sênior podem consultar o relatório e o mapa.</p>
      {busy && <p role="status" className="text-sm text-slate-700">Enviando o registro da visita. Aguarde a confirmação.</p>}
      <div className="flex flex-wrap gap-3"><button disabled={busy || photoBusy} className={button}>{busy ? 'Enviando visita…' : 'Registrar visita e enviar para aceite'}</button><button type="button" disabled={busy} onClick={() => setFarm(null)} className={button}>Cancelar visita</button></div>
    </form>}
    {administrative && <TechnicalVisitMap visits={allVisits} />}
    {tab === 'technician' && <div ref={technicianMapRef} tabIndex={-1} className="scroll-mt-24"><TechnicianVisitMap uid={user.uid} visits={allVisits} historyRequest={historyRequest} /></div>}
    <div className="space-y-5"><h3 className="text-lg font-bold">{administrative ? 'Histórico de visitas' : tab === 'technician' ? 'Propriedades visitadas e alterações propostas' : 'Relatórios recebidos e notificações'}</h3>
      {!ordered.length && <p className="text-sm text-slate-600">Nenhuma visita registrada.</p>}
      {ordered.map(visit => <article key={visit.id} className="space-y-3 border-b border-slate-300 pb-5">
        <h4 className="font-bold">{visit.farmName} · {visit.pondName}</h4><p className="text-sm text-slate-600">Visita: {visit.visitedOn} · Técnico: {visit.technicianEmail}</p><p className="text-sm font-semibold text-emerald-900">{VISIT_LABELS[visit.status]}</p>
        <TechnicianIdentityCard uid={visit.technicianUid} load={api.readTechnicianIdentity} />
        {visit.technicianUid === user.uid && <VisitGuide user={user} storageKey={`${visit.independent ? 'inspection' : 'visit'}:${visit.id}`} visit={{ ...visit, technicianName: technicianIdentity?.fullName, creaNumber: technicianIdentity?.creaNumber }} />}
        <p className="text-sm whitespace-pre-wrap break-words">{visit.summary}</p>
        {visit.correctLocation && <p className="text-sm">Correção de localização: {visit.previousLatitude ?? 'sem latitude'}, {visit.previousLongitude ?? 'sem longitude'} → <strong>{visit.latitude}, {visit.longitude}</strong></p>}
        <p className="text-sm">{LICENSE_LABELS[visit.licenseStatus]}{visit.licenseStatus === 'licensed' ? ` · Nº ${visit.licenseNumber} · Cadastro: ${visit.licenseRegisteredOn} · Vencimento: ${visit.licenseExpiresOn}` : ''}</p>
        {visit.independent && visit.status === 'pending' && (visit.recipientUid === user.uid || visit.clientEmail === user.email.toLowerCase()) && <div className="space-y-2"><p className="text-xs text-slate-600">Este registro documenta a constatação do técnico. Aceitar confirma sua ciência e concordância; não altera as coordenadas nem libera acesso ao seu cadastro.</p><div className="flex flex-wrap gap-3"><button disabled={busy} className={button} onClick={() => run(async () => { await api.decideIndependentVisit(user, visit.id, true); setMessage('Registro aceito. Sua decisão foi enviada ao técnico.'); })}>Aceitar registro de campo</button><button disabled={busy} className={button} onClick={() => run(async () => { await api.decideIndependentVisit(user, visit.id, false); setMessage('Registro contestado. O técnico verá sua decisão.'); })}>Contestar registro de campo</button></div></div>}
        {!visit.independent && visit.status === 'pending' && visit.ownerUid === user.uid && <div className="space-y-2"><p className="text-xs text-slate-600">Ao aceitar, você aprova o relatório e os ajustes descritos. Se houver erro, recuse e peça uma nova visita ao técnico.</p><div className="flex flex-wrap gap-3"><button disabled={busy} className={button} onClick={() => run(async () => { await api.checkVisitApproval(database, visit); await api.decideVisit(visit.id, true); await api.applyAcceptedVisit(database, { ...visit, status: 'accepted' }); await onReload?.(); setMessage('Visita aceita. Ajustes aplicados ao cadastro e aguardando a sincronização da conta.'); })}>Aceitar relatório e ajustes</button><button disabled={busy} className={button} onClick={() => run(async () => { await api.decideVisit(visit.id, false); setMessage('Visita recusada. O cadastro não foi alterado.'); })}>Recusar relatório</button></div></div>}
        {visit.technicianUid === user.uid && <button className={button} disabled={busy} onClick={() => run(async () => setPrivateView({ id: visit.id, notes: await api.readPrivateVisit(user.uid, visit.id, visit.independent) }))}>Ver minhas anotações privadas</button>}
        {privateView?.id === visit.id && <p className="text-sm whitespace-pre-wrap break-words border border-slate-200 rounded-xl p-4">{privateView.notes}</p>}
      </article>)}
    </div>
  </section>;
}
