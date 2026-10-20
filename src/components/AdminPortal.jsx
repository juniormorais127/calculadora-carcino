import React, { useState } from 'react';
import { signInWithEmailAndPassword, setPersistence, browserSessionPersistence, sendEmailVerification } from 'firebase/auth';
import { auth } from '../services/firebase.js';
import { useAccount } from './AccountProvider.jsx';
import { isAdmin } from '../services/purchaseMetrics.js';
import { authMessage } from './AccountView.jsx';
import { ShrimpMarkIcon } from './icons/CustomAquacultureIcons.jsx';
import AdminDashboard from './AdminDashboard.jsx';

const button = 'min-h-11 rounded-xl border px-4 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:opacity-50';
export default function AdminPortal() {
  const { user, access, accessLoading, logout } = useAccount();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('');
    try { await setPersistence(auth, browserSessionPersistence); await signInWithEmailAndPassword(auth, email.trim(), password); setPassword(''); }
    catch (err) { setError(authMessage(err)); }
    finally { setBusy(false); }
  }
  async function exit() {
    setBusy(true); setError('');
    try { await logout(); }
    catch { setError('Não foi possível sair. Tente novamente.'); }
    finally { setBusy(false); }
  }
  return <div className="min-h-screen bg-slate-50 text-slate-900">
    <header className="bg-slate-900 text-white border-b border-slate-700 px-5 py-4"><div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3"><div className="h-11 w-11 flex items-center justify-center rounded-2xl bg-emerald-700"><ShrimpMarkIcon className="w-8 h-8" /></div><div><h1 className="text-xl font-bold">CarcinoGestão</h1><p className="text-sm text-emerald-200">Administração</p></div></div>
      <div className="flex flex-wrap items-center gap-3"><a href={import.meta.env.BASE_URL} className="min-h-11 inline-flex items-center text-sm font-semibold text-emerald-100 underline underline-offset-4">Site dos produtores</a>{user && <button disabled={busy} className={`${button} border-slate-500 text-white hover:bg-slate-800 focus-visible:outline-white`} onClick={exit}>Sair da conta</button>}</div>
    </div></header>
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {error && <p role="alert" className="max-w-lg mx-auto rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm p-4 mb-5">{error}</p>}
      {!user ? <section className="max-w-md mx-auto py-8 space-y-5"><div className="space-y-2"><h2 className="text-2xl font-bold">Acesso administrativo</h2><p className="text-sm text-slate-600">Entre com sua conta autorizada para gerenciar usuários, permissões e interesse em compras.</p></div>
        <form onSubmit={submit} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <label className="block text-sm font-semibold text-slate-700">E-mail administrativo<input type="email" autoComplete="username" required value={email} disabled={busy} onChange={e => setEmail(e.target.value)} className="mt-1 block w-full min-h-11 rounded-xl border border-slate-300 px-3 focus:outline-2 focus:outline-emerald-700" /></label>
          <label className="block text-sm font-semibold text-slate-700">Senha<input type="password" autoComplete="current-password" required value={password} disabled={busy} onChange={e => setPassword(e.target.value)} className="mt-1 block w-full min-h-11 rounded-xl border border-slate-300 px-3 focus:outline-2 focus:outline-emerald-700" /></label>
          <button disabled={busy} className={`${button} w-full bg-emerald-700 border-emerald-700 text-white hover:bg-emerald-800`}>{busy ? 'Entrando…' : 'Entrar no painel'}</button>
          <a className="min-h-11 inline-flex items-center text-sm font-semibold text-emerald-800 underline underline-offset-4" href={`${import.meta.env.BASE_URL}?recuperar=1`}>Esqueci minha senha</a>
        </form>
        <p className="text-xs text-slate-600">O cadastro de uma conta comum não concede acesso a este painel.</p>
      </section> : !user.emailVerified ? <section className="max-w-lg space-y-4 py-8"><h2 className="text-2xl font-bold">Confirme o e-mail administrativo</h2><p className="text-sm text-slate-700">O acesso administrativo exige e-mail confirmado. Abra o link recebido e depois atualize a confirmação aqui.</p><div className="flex flex-wrap gap-3"><button className={`${button} border-slate-300`} disabled={busy} onClick={async()=>{setBusy(true);try{await sendEmailVerification(user);}catch{setError('Não foi possível enviar. Aguarde e tente novamente.');}finally{setBusy(false);}}}>Enviar verificação</button><button className={`${button} border-slate-300`} onClick={async()=>{await user.reload();await user.getIdToken(true);window.location.reload();}}>Já confirmei</button></div></section> : accessLoading ? <p role="status" className="py-8 text-sm text-slate-600">Consultando seu perfil de acesso...</p> : isAdmin(user, access) ? <><p className="text-xs text-slate-600 break-all">Conectado como {user.email}</p><AdminDashboard /></> : <section className="max-w-lg mx-auto py-10 space-y-4"><h2 className="text-2xl font-bold">Acesso restrito</h2><p role="alert" className="text-sm text-slate-700">A conta {user.email} não possui permissão administrativa. Saia e entre com sua conta autorizada.</p><button disabled={busy} className={`${button} border-slate-300 hover:bg-slate-100`} onClick={exit}>Entrar com outra conta</button></section>}
    </main>
  </div>;
}
