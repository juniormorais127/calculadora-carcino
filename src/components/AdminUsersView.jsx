import React, { useEffect, useState } from 'react';
import { collection, doc, getDocs, limit, orderBy, query, serverTimestamp, startAfter, Timestamp, updateDoc } from 'firebase/firestore';
import { firestore } from '../services/firebase.js';
import { useAccount } from './AccountProvider.jsx';
import { isAdmin } from '../services/purchaseMetrics.js';
import { expirationMillis, premiumStatus } from '../services/accountPermissions.js';

const button = 'min-h-11 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-emerald-700';
const dateText = value => value?.toDate ? value.toDate().toLocaleString('pt-BR', { timeZone: 'America/Fortaleza' }) : '—';
export async function readUsers(cursor) {
  const constraints = [orderBy('email'), limit(200)];
  if (cursor) constraints.push(startAfter(cursor));
  const result = await getDocs(query(collection(firestore, 'accountProfiles'), ...constraints));
  return { users: result.docs.map(doc => ({ ...doc.data(), uid: doc.id })), cursor: result.docs.at(-1), more: result.size === 200 };
}
export async function writePermission(uid, data, adminUid) {
  await updateDoc(doc(firestore, 'accountProfiles', uid), { premium: data.premium, expiresAt: data.premium && data.expiresAt ? Timestamp.fromMillis(data.expiresAt) : null, changedBy: adminUid, changedAt: serverTimestamp() });
}
export default function AdminUsersView({ loadUsers = readUsers, savePermission = writePermission }) {
  const { user } = useAccount();
  const allowed = isAdmin(user);
  const [users, setUsers] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [more, setMore] = useState(false);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [enabled, setEnabled] = useState(false);
  const [expiry, setExpiry] = useState('');
  const [reload, setReload] = useState(0);
  useEffect(() => {
    if (!allowed) return;
    let disposed = false;
    setBusy(true); setError('');
    loadUsers(null).then(result => { if (!disposed) { setUsers(result.users); setCursor(result.cursor); setMore(result.more); } })
      .catch(() => { if (!disposed) setError('Não foi possível consultar os usuários. Confira a conexão e atualize.'); })
      .finally(() => { if (!disposed) setBusy(false); });
    return () => { disposed = true; };
  }, [allowed, reload, loadUsers]);
  if (!allowed) return <p role="alert" className="py-5 text-rose-800">Área restrita à administração.</p>;
  async function moreUsers() {
    setBusy(true); setError('');
    try { const result = await loadUsers(cursor); setUsers(old => [...old, ...result.users]); setCursor(result.cursor); setMore(result.more); }
    catch { setError('Não foi possível carregar mais usuários. Tente novamente.'); }
    finally { setBusy(false); }
  }
  function edit(profile) {
    setSelected(profile); setEnabled(profile.premium); setError(''); setMessage('');
    setExpiry(profile.expiresAt?.toDate ? new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Fortaleza', year: 'numeric', month: '2-digit', day: '2-digit' }).format(profile.expiresAt.toDate()) : '');
  }
  async function save(event) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      const expiresAt = enabled ? expirationMillis(expiry) : null;
      if (enabled && expiresAt && expiresAt <= Date.now()) throw new Error('A validade precisa ser uma data futura.');
      await savePermission(selected.uid, { premium: enabled, expiresAt }, user.uid);
      setUsers(old => old.map(profile => profile.uid === selected.uid ? { ...profile, premium: enabled, expiresAt: expiresAt ? Timestamp.fromMillis(expiresAt) : null } : profile));
      setMessage(`Permissão de ${selected.email} atualizada: ${enabled ? 'Premium liberado' : 'acesso gratuito'}.`);
      setSelected(null);
    } catch (err) { setError(err.code ? 'Não foi possível salvar. Verifique a conexão e a conta administrativa.' : err.message); }
    finally { setBusy(false); }
  }
  const visible = users.filter(profile => profile.email.toLowerCase().includes(search.trim().toLowerCase()));
  return <section className="py-5 pb-16 space-y-5">
    <div className="flex flex-wrap justify-between items-start gap-4"><div className="space-y-2 max-w-2xl"><h2 className="text-2xl font-bold text-slate-900">Usuários e permissões</h2><p className="text-sm text-slate-600">Localize o usuário pelo e-mail e libere ou retire o acesso Premium. Isso não concede acesso administrativo.</p></div><button className={button} disabled={busy || !!selected} onClick={() => setReload(n => n + 1)}>Atualizar usuários</button></div>
    <p className="text-sm text-slate-600">Os usuários aparecem após entrar no site nesta versão. Contas antigas que ainda não entraram continuam disponíveis no Firebase, mas podem não estar nesta lista.</p>
    <label className="block max-w-lg text-sm font-semibold text-slate-700">Buscar e-mail<input type="search" autoComplete="off" value={search} onChange={e => setSearch(e.target.value)} placeholder="Digite o e-mail do usuário" className="mt-1 block w-full min-h-11 rounded-xl border border-slate-300 bg-white px-3 focus:outline-2 focus:outline-emerald-700" /></label>
    <p className="text-xs text-slate-600">{users.length} cadastros carregados · {visible.length} encontrados{more ? ' · lista parcial: carregue mais para incluir os demais na busca' : ''}</p>
    {busy && <p role="status" className="text-sm text-slate-600">Aguarde…</p>}
    {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
    {message && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-950">{message}</p>}
    {selected && <form onSubmit={save} className="rounded-2xl border border-emerald-300 bg-white p-5 space-y-4 max-w-xl">
      <h3 className="text-lg font-bold break-all">Permissões de {selected.email}</h3>
      <label className="flex items-center gap-3 min-h-11 text-sm font-semibold"><input type="checkbox" className="w-5 h-5 accent-emerald-700" checked={enabled} onChange={e => setEnabled(e.target.checked)} disabled={busy} />Liberar Premium</label>
      <label className="block text-sm font-semibold text-slate-700">Válido até (opcional)<input type="date" value={expiry} disabled={!enabled || busy} onChange={e => setExpiry(e.target.value)} className="mt-1 block min-h-11 rounded-xl border border-slate-300 px-3 disabled:opacity-50" /></label>
      <p className="text-xs text-slate-600">Sem data: acesso sem prazo. Com data: vale até o fim do dia em Fortaleza. Desmarque Premium para revogar a permissão.</p>
      <div className="flex flex-wrap gap-3"><button className={`${button} bg-emerald-700 border-emerald-700 text-white hover:bg-emerald-800`} disabled={busy}>Salvar permissões</button><button className={button} type="button" disabled={busy} onClick={() => setSelected(null)}>Cancelar edição</button></div>
    </form>}
    <p className="md:hidden text-xs text-slate-600">Deslize a tabela para ver todos os dados.</p>
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white" role="region" aria-label="Usuários cadastrados" tabIndex={0}><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-100"><tr>{['E-mail', 'Permissão', 'Validade', 'Último acesso registrado', 'Gerenciar'].map(label => <th className="p-3 font-semibold text-slate-700" scope="col" key={label}>{label}</th>)}</tr></thead><tbody>{visible.map(profile => <tr key={profile.uid} className="border-t border-slate-100"><th className="p-3 font-semibold break-all" scope="row">{profile.email}</th><td className="p-3">{premiumStatus(profile)}</td><td className="p-3">{profile.expiresAt ? dateText(profile.expiresAt) : 'Sem prazo'}</td><td className="p-3">{dateText(profile.lastSeenAt)}</td><td className="p-3"><button className={button} disabled={busy} onClick={() => edit(profile)} aria-label={`Editar permissões de ${profile.email}`}>Editar permissões</button></td></tr>)}</tbody></table></div>
    {!busy && !visible.length && <p className="text-sm text-slate-600">Nenhum usuário encontrado. Confira o e-mail ou peça que a pessoa entre no site para atualizar o cadastro.</p>}
    {more && <button className={button} disabled={busy} onClick={() => void moreUsers()}>Carregar mais usuários</button>}
    <p className="text-xs text-slate-600">Liberação manual, sem cobrança automática. A permissão Premium fica preparada para os serviços pagos que você definir; nenhuma função atual foi transformada em paga.</p>
  </section>;
}
