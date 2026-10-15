import React, { useEffect, useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { LogIn, LogOut, Cloud, Download } from 'lucide-react';
import { auth } from '../services/firebase.js';
import { useAccount } from './AccountProvider.jsx';
import { db as guestDb, exportLocalDatabase, importLocalDatabase } from '../services/db.js';
import { isEmptyData } from '../services/cloudData.js';

export function authMessage(error) {
  const messages = {
    'auth/invalid-email': 'Confira o endereço de e-mail.',
    'auth/invalid-credential': 'Não foi possível entrar. Confira seu e-mail e sua senha.',
    'auth/user-not-found': 'Não foi possível entrar. Confira seu e-mail e sua senha.',
    'auth/wrong-password': 'Não foi possível entrar. Confira seu e-mail e sua senha.',
    'auth/email-already-in-use': 'Este e-mail já tem uma conta. Use Entrar ou recupere sua senha.',
    'auth/weak-password': 'Escolha uma senha com pelo menos 8 caracteres.',
    'auth/too-many-requests': 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.',
    'auth/network-request-failed': 'Sem conexão com o serviço de login. Confira sua internet e tente novamente.',
    'auth/operation-not-allowed': 'O login não está disponível agora. Seus dados locais foram preservados.',
  };
  return messages[error.code] || 'Não foi possível concluir. Tente novamente em alguns instantes.';
}
function download(data, name) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const button = 'min-h-11 rounded-xl px-4 py-2 text-sm font-bold disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700';
export default function AccountView() {
  const account = useAccount();
  const { user, database, syncStatus, metadata } = account;
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [legacy, setLegacy] = useState(false);
  const [recovery, setRecovery] = useState(null);
  useEffect(() => {
    if (!user) return;
    let disposed = false;
    Promise.all([exportLocalDatabase(guestDb), metadata.accounts.get('__legacy__'), metadata.accounts.get(user.uid)])
      .then(([data, claim, meta]) => { if (!disposed) { setLegacy(!claim && !isEmptyData(JSON.parse(data))); setRecovery(meta?.recovery || null); } })
      .catch(() => {});
    return () => { disposed = true; };
  }, [user?.uid, syncStatus.state]);
  const submit = async event => {
    event.preventDefault(); setError(''); setMessage('');
    if (mode === 'signup' && password !== confirmation) { setError('As senhas precisam ser iguais.'); return; }
    setBusy(true);
    try {
      if (mode === 'reset') {
        await sendPasswordResetEmail(auth, email.trim());
        setMessage('Se houver uma conta para este e-mail, você receberá as instruções de recuperação. Confira também o spam.');
      } else if (mode === 'signup') {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      } else await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err) { setError(authMessage(err)); } finally { setBusy(false); }
  };
  const run = async action => {
    setBusy(true); setError('');
    try { await action(); } catch (err) { setError(err.message || 'Não foi possível concluir.'); } finally { setBusy(false); }
  };
  if (user) return <section className="max-w-2xl mx-auto py-5 space-y-5 pb-20">
    <h2 className="text-2xl font-bold text-slate-900">Minha conta</h2>
    <p className="text-sm text-slate-700 break-all">Conectado como <strong>{user.email}</strong></p>
    <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
      <h3 className="flex gap-2 items-center font-bold"><Cloud className="w-5 h-5 text-emerald-700" />Seus dados de produção</h3>
      <p className="text-sm text-slate-700">Cada login possui registros independentes. Ao entrar em outro aparelho, sua cópia da nuvem será recuperada. Sem internet, você pode continuar usando a cópia deste aparelho.</p>
      <p role="status" className="text-sm font-semibold text-slate-700">{syncStatus.message}</p>
      <button className={`${button} bg-emerald-700 text-white`} disabled={busy || syncStatus.state === 'syncing'} onClick={() => run(account.sync)}>Sincronizar agora</button>
      {syncStatus.state === 'conflict' && <div className="rounded-xl bg-amber-50 border border-amber-300 p-4 space-y-3 text-amber-950">
        <p className="text-sm">Há duas versões diferentes. Baixe o backup deste aparelho antes de recuperar a nuvem. A sincronização automática não substitui suas alterações.</p>
        <div className="flex flex-wrap gap-2">
          <button className={`${button} border border-amber-500`} onClick={() => run(async () => download(JSON.parse(await exportLocalDatabase(database)), 'backup-antes-da-recuperacao.json'))}>Baixar backup deste aparelho</button>
          <button className={`${button} border border-amber-500`} disabled={busy} onClick={() => {
            if (window.confirm('Usar a versão da nuvem no lugar dos registros deste aparelho? Uma cópia local anterior será guardada para recuperação.')) void run(account.useCloud);
          }}>Usar versão da nuvem</button>
        </div>
      </div>}
      {recovery && <button className={`${button} border border-slate-300 text-slate-700 inline-flex gap-2 items-center`} onClick={() => download(recovery, 'backup-copia-anterior.json')}><Download className="w-4 h-4" />Baixar cópia anterior à recuperação</button>}
    </div>
    {legacy && <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-5 space-y-3">
      <h3 className="font-bold text-emerald-950">Registros anteriores neste navegador</h3>
      <p className="text-sm text-emerald-950">Há dados do modo local que ainda não pertencem a uma conta. Importe somente se forem seus. A cópia original será mantida.</p>
      <button disabled={busy || syncStatus.state !== 'synced'} className={`${button} bg-emerald-700 text-white`} onClick={() => {
        if (!window.confirm(`Vincular os registros antigos deste navegador à conta ${user.email}?`)) return;
        void run(async () => {
          if (!isEmptyData(JSON.parse(await exportLocalDatabase(database)))) throw new Error('Sua conta já possui dados. Exporte o modo local e use a restauração de backup em Ajustes se quiser substituir os registros.');
          if (await metadata.accounts.get('__legacy__')) throw new Error('Esses registros já foram vinculados a uma conta.');
          await importLocalDatabase(await exportLocalDatabase(guestDb), database);
          await metadata.accounts.put({ uid: '__legacy__', owner: user.uid });
          setLegacy(false); await account.sync();
        });
      }}>Importar meus registros locais</button>
    </div>}
    {error && <p role="alert" className="text-sm text-rose-800 bg-rose-50 border border-rose-200 rounded-xl p-3">{error}</p>}
    <button disabled={busy} className={`${button} border border-slate-300 text-slate-700 inline-flex items-center gap-2`} onClick={() => {
      if (syncStatus.state !== 'synced' && !window.confirm('Há dados aguardando sincronização. Eles continuarão neste aparelho para este login. Deseja sair?')) return;
      void run(account.logout);
    }}><LogOut className="w-4 h-4" />Sair da conta</button>
  </section>;
  return <section className="max-w-md mx-auto py-6 pb-20 space-y-5">
    <div className="space-y-2"><h2 className="text-2xl font-bold text-slate-900">{mode === 'signup' ? 'Criar minha conta' : mode === 'reset' ? 'Recuperar acesso' : 'Entrar na minha conta'}</h2>
      <p className="text-sm text-slate-700">Salve seus registros de produção na nuvem e acesse em outro aparelho. Seus dados ficam separados dos outros produtores.</p></div>
    <form onSubmit={submit} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
      <label className="block text-sm font-semibold text-slate-700">E-mail<input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required disabled={busy} className="mt-1 block w-full min-h-11 rounded-xl border border-slate-300 px-3 bg-white focus:outline-2 focus:outline-emerald-700" /></label>
      {mode !== 'reset' && <label className="block text-sm font-semibold text-slate-700">Senha<input type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} minLength={mode === 'signup' ? 8 : undefined} value={password} onChange={e => setPassword(e.target.value)} required disabled={busy} className="mt-1 block w-full min-h-11 rounded-xl border border-slate-300 px-3 bg-white focus:outline-2 focus:outline-emerald-700" /></label>}
      {mode === 'signup' && <><p className="text-xs text-slate-600">Use pelo menos 8 caracteres e uma senha que você não utiliza em outros serviços.</p><label className="block text-sm font-semibold text-slate-700">Confirmar senha<input type="password" autoComplete="new-password" minLength={8} value={confirmation} onChange={e => setConfirmation(e.target.value)} required disabled={busy} className="mt-1 block w-full min-h-11 rounded-xl border border-slate-300 px-3 bg-white focus:outline-2 focus:outline-emerald-700" /></label></>}
      {error && <p role="alert" className="text-sm text-rose-800 bg-rose-50 rounded-xl p-3">{error}</p>}
      {message && <p role="status" className="text-sm text-emerald-900 bg-emerald-50 rounded-xl p-3">{message}</p>}
      <button disabled={busy} type="submit" className={`${button} w-full bg-emerald-700 text-white inline-flex justify-center items-center gap-2`}><LogIn className="w-4 h-4" />{busy ? 'Aguarde…' : mode === 'signup' ? 'Criar conta' : mode === 'reset' ? 'Enviar instruções' : 'Entrar'}</button>
      <div className="flex flex-wrap gap-3">{['login', 'signup', 'reset'].filter(value => value !== mode).map(value => <button key={value} type="button" disabled={busy} className="min-h-11 text-sm font-semibold text-emerald-800 underline underline-offset-4" onClick={() => { setMode(value); setError(''); setMessage(''); setPassword(''); setConfirmation(''); }}>{value === 'login' ? 'Já tenho uma conta' : value === 'signup' ? 'Criar conta gratuita' : 'Esqueci minha senha'}</button>)}</div>
    </form>
    <p className="text-xs text-slate-600">Você pode continuar usando o site sem entrar. Nesse modo, os registros ficam somente neste navegador. Entrar não envia os dados antigos automaticamente.</p>
  </section>;
}
