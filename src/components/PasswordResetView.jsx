import React, { useEffect, useRef, useState } from 'react';
import { verifyPasswordResetCode, confirmPasswordReset, applyActionCode } from 'firebase/auth';
import { auth } from '../services/firebase.js';

const input = 'mt-1 block w-full min-h-11 rounded-xl border border-slate-300 px-3 bg-white focus:outline-2 focus:outline-emerald-700';
const button = 'min-h-11 rounded-xl px-4 py-2 text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:opacity-60';
function errorMessage(error) {
  if (['auth/expired-action-code', 'auth/invalid-action-code', 'auth/user-disabled', 'auth/user-not-found'].includes(error.code)) return 'Este link expirou ou já foi utilizado. Solicite um novo e-mail de recuperação.';
  if (error.code === 'auth/weak-password') return 'Escolha uma senha com pelo menos 8 caracteres.';
  if (error.code === 'auth/network-request-failed') return 'Não foi possível conectar. Confira sua internet e tente novamente.';
  return 'Não foi possível concluir. Tente novamente ou solicite um novo link.';
}

export default function PasswordResetView({ code, mode }) {
  const [state, setState] = useState('checking');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const operation = useRef(null);
  useEffect(() => {
    let disposed = false;
    setState('checking'); setError('');
    const timeout = setTimeout(() => {
      if (!disposed) { setError('A verificação demorou mais que o esperado. Confira a conexão e tente novamente.'); setState('invalid'); }
    }, 12000);
    async function check() {
      try {
        if (!code) throw { code: 'auth/invalid-action-code' };
        if (mode === 'resetPassword') {
          const address = await verifyPasswordResetCode(auth, code);
          if (!disposed) { setEmail(address); setState('ready'); }
        } else if (['verifyEmail', 'recoverEmail'].includes(mode)) {
          const key = `${mode}:${code}:${attempt}`;
          if (operation.current?.key !== key) operation.current = { key, promise: applyActionCode(auth, code) };
          await operation.current.promise;
          if (!disposed) setState('success');
        } else throw { code: 'auth/invalid-action-code' };
      } catch (err) {
        if (!disposed) { setError(errorMessage(err)); setState('invalid'); }
      } finally { clearTimeout(timeout); }
    }
    void check();
    return () => { disposed = true; clearTimeout(timeout); };
  }, [code, mode, attempt]);
  const submit = async event => {
    event.preventDefault(); setError('');
    if (password !== confirmation) { setError('As senhas precisam ser iguais.'); return; }
    setState('saving');
    try {
      await confirmPasswordReset(auth, code, password);
      setPassword(''); setConfirmation(''); setState('success');
    } catch (err) {
      setError(errorMessage(err));
      setState(['auth/expired-action-code', 'auth/invalid-action-code'].includes(err.code) ? 'invalid' : 'ready');
    }
  };
  const reset = mode === 'resetPassword';
  return <section className="py-6 space-y-5">
    <div className="space-y-2"><h2 className="text-2xl font-bold">{state === 'success' ? (reset ? 'Senha redefinida' : 'E-mail atualizado') : reset ? 'Escolha sua nova senha' : 'Confirmar seu e-mail'}</h2>
      <p className="text-sm text-slate-700">{state === 'success' ? 'Tudo pronto. Você já pode acessar sua conta no CarcinoGestão.' : 'Recupere seu acesso com segurança, aqui no CarcinoGestão.'}</p></div>
    {state === 'checking' && <p role="status" className="text-sm text-slate-700">Verificando seu link…</p>}
    {['ready', 'saving'].includes(state) && <form onSubmit={submit} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
      <p className="text-sm text-slate-700 break-all">Conta: <strong>{email}</strong></p>
      <label className="block text-sm font-semibold text-slate-700">Nova senha<input className={input} type="password" autoComplete="new-password" minLength={8} required value={password} disabled={state === 'saving'} onChange={e => setPassword(e.target.value)} /></label>
      <p className="text-xs text-slate-600">Use pelo menos 8 caracteres e uma senha que você não utiliza em outros serviços.</p>
      <label className="block text-sm font-semibold text-slate-700">Confirmar nova senha<input className={input} type="password" autoComplete="new-password" minLength={8} required value={confirmation} disabled={state === 'saving'} onChange={e => setConfirmation(e.target.value)} /></label>
      {error && <p role="alert" className="text-sm text-rose-800">{error}</p>}
      <button className={`${button} w-full bg-emerald-700 text-white`} disabled={state === 'saving'}>{state === 'saving' ? 'Salvando…' : 'Salvar nova senha'}</button>
    </form>}
    {state === 'invalid' && <div className="space-y-3"><p role="alert" className="text-sm text-rose-800">{error}</p><button className={`${button} border border-slate-300`} onClick={() => setAttempt(n => n + 1)}>Tentar novamente</button></div>}
    <a className={`${button} inline-flex items-center ${state === 'success' ? 'bg-emerald-700 text-white' : 'text-emerald-800 underline underline-offset-4'}`} href={`${import.meta.env.BASE_URL}${state === 'invalid' ? '?recuperar=1' : ''}`}>{state === 'invalid' ? 'Solicitar novo link' : 'Voltar ao acesso'}</a>
  </section>;
}
