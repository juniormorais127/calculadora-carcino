import React, { useEffect, useState } from 'react';
import { Info, ChevronDown } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { androidUpdateApi } from '../services/androidUpdates.js';
import { version } from '../../package.json';

export default function AboutSettings() {
  const [open, setOpen] = useState(false);
  const [installed, setInstalled] = useState(null);
  const [versionError, setVersionError] = useState(false);
  const native = Capacitor.getPlatform() === 'android';
  useEffect(() => {
    let active = true;
    androidUpdateApi.installed().then(info => { if (active) setInstalled(info); }).catch(() => { if (active) setVersionError(true); });
    return () => { active = false; };
  }, []);
  return <section className="rounded-2xl border border-slate-200 bg-white p-5">
    <button type="button" aria-expanded={open} aria-controls="about-app-content" onClick={() => setOpen(value => !value)} className="flex min-h-12 w-full items-center gap-3 rounded-xl text-left font-bold text-slate-900 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700">
      <Info className="size-5 shrink-0" aria-hidden="true" /><span className="flex-1">Sobre</span><ChevronDown className={`size-5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
    </button>
    <div id="about-app-content" hidden={!open} className="space-y-5 pt-4 text-sm leading-relaxed text-slate-700">
      <div><h3 className="text-lg font-bold text-slate-900">CarcinoGestão</h3><p>Gestão da carcinicultura: viveiros, produção e acompanhamento de visitas às propriedades.</p></div>
      <dl className="space-y-2">
        <div><dt className="font-semibold text-slate-900">{native ? 'Versão instalada do aplicativo' : 'Versão web'}</dt><dd>{native ? (installed ? `${installed.versionName} · compilação ${installed.versionCode}` : versionError ? 'Não foi possível consultar a versão instalada. Feche e abra o aplicativo para tentar novamente.' : 'Consultando versão instalada…') : version}</dd></div>
        <div><dt className="font-semibold text-slate-900">Plataforma</dt><dd>{native ? 'Aplicativo Android' : 'Navegador web'}</dd></div>
      </dl>
      <div><h4 className="font-semibold text-slate-900">Dados e privacidade</h4><p>Os registros da sua conta são sincronizados quando há conexão. Fotos de visitas e rascunhos do caderno de campo ficam neste dispositivo; não são enviados à nuvem.</p><p className="mt-2">Exporte os relatórios que deseja guardar. Desinstalar o aplicativo ou limpar os dados pode apagar os arquivos locais.</p></div>
      <div><h4 className="font-semibold text-slate-900">Atualizações e ajuda</h4><p>No Android, o aviso de atualização aparece quando há uma versão mais recente. O download fica em Ajustes, em Aplicativo Android. Ao solicitar suporte, informe a versão exibida acima e descreva o problema, sem compartilhar sua senha.</p></div>
      <a className="inline-flex min-h-12 items-center font-semibold text-emerald-800 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-emerald-700" href="https://juniormorais127.github.io/calculadora-carcino/" target="_blank" rel="noopener noreferrer">Acessar o site do CarcinoGestão</a>
    </div>
  </section>;
}
