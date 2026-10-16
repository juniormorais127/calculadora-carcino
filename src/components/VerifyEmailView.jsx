import React, { useEffect, useState } from 'react';
import { getIdToken, reload, sendEmailVerification } from 'firebase/auth';
import { useAccount } from './AccountProvider.jsx';
import { authMessage } from './AccountView.jsx';
import { saveAccountPhone, saveAccountName } from '../services/accountProfiles.js';
import AccountNameEditor from './AccountNameEditor.jsx';
import PhoneEditor from './PhoneEditor.jsx';
import { publicSiteUrl } from '../services/firebase.js';

const button = 'min-h-11 rounded-xl border px-4 py-2 text-sm font-semibold disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700';
export default function VerifyEmailView() {
  const { user, logout, access, accessLoading } = useAccount();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [wait, setWait] = useState(0);
  useEffect(() => {
    const tick = () => {
      try { setWait(Math.max(0, Math.ceil((Number(localStorage.getItem(`verify-email-${user.uid}`) || 0) + 60000 - Date.now()) / 1000))); }
      catch { /* Cooldown is only a UI convenience; Firebase also rate limits. */ }
    };
    tick(); const timer = setInterval(tick, 1000); return () => clearInterval(timer);
  }, [user.uid]);
  async function send() {
    setBusy(true); setError(''); setMessage('');
    try {
      await sendEmailVerification(user, { url: publicSiteUrl });
      try { localStorage.setItem(`verify-email-${user.uid}`, String(Date.now())); } catch { /* optional */ }
      setWait(60);
      setMessage('Enviamos o link de confirmação. Abra o e-mail, confirme e depois toque em “Já confirmei meu e-mail”. Confira também o spam.');
    } catch (err) { setError(authMessage(err)); }
    finally { setBusy(false); }
  }
  async function check() {
    setBusy(true); setError(''); setMessage('');
    try {
      await reload(user);
      await getIdToken(user, true);
      if (!user.emailVerified) setMessage('Seu e-mail ainda não foi confirmado. Abra o link recebido e tente novamente.');
    } catch (err) { setError(authMessage(err)); }
    finally { setBusy(false); }
  }
  return <section className="py-6 space-y-5">
    <div className="space-y-2"><h2 className="text-2xl font-bold">Complete a verificação da conta</h2><p className="text-sm text-slate-700">Para acessar os serviços, confirme seu e-mail e informe seu nome completo e celular com DDD.</p></div>
    <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
      <p className="text-sm text-slate-700 break-all">Conta: <strong>{user.email}</strong></p>
      {!accessLoading && <AccountNameEditor value={access?.fullName} onSave={name => saveAccountName(user, name)} />}
      {error && <p role="alert" className="text-sm text-rose-800">{error}</p>}
      {message && <p role="status" className="text-sm text-emerald-900">{message}</p>}
      {accessLoading ? <p role="status" className="text-sm text-slate-700">Consultando cadastro...</p> : <>
        {access?.phone && <p className="text-sm text-emerald-900">Celular cadastrado: <strong>{access.phone}</strong></p>}
        <PhoneEditor phone={access?.phone} disabled={busy} onSave={phone => saveAccountPhone(user, phone)} />
      </>}
      {user.emailVerified ? <p className="text-sm text-emerald-900">E-mail confirmado.</p> : <>
      <p className="text-sm text-slate-700">Toque em Enviar confirmação e abra o link recebido. Seus registros anteriores serão mantidos.</p>
      <button className={`${button} w-full bg-emerald-700 border-emerald-700 text-white hover:bg-emerald-800`} disabled={busy || wait > 0} onClick={send}>{wait ? `Reenviar em ${wait}s` : 'Enviar confirmação'}</button>
      <button className={`${button} w-full border-slate-300 text-slate-700 hover:bg-slate-100`} disabled={busy} onClick={check}>{busy ? 'Aguarde…' : 'Já confirmei meu e-mail'}</button>
      </>}
    </div>
    <button className={`${button} border-slate-300 text-slate-700 hover:bg-slate-100`} disabled={busy} onClick={async () => { try { await logout(); } catch { setError('Não foi possível sair. Tente novamente.'); } }}>Sair e usar outra conta</button>
  </section>;
}
