import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { androidUpdateApi } from '../services/androidUpdates.js';
import { hasAndroidUpdate } from '../services/androidRelease.js';
const UpdatesContext = createContext(null);
const button = 'min-h-12 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:opacity-50';
export default function AppUpdatesProvider({ children, api = androidUpdateApi }) {
  const [state, setState] = useState({ installed: null, release: null, checking: true, error: '' });
  const [downloadError, setDownloadError] = useState('');
  const request = useRef(null), lastCheck = useRef(0);
  const check = useCallback(async (force = false) => {
    if (!force && Date.now() - lastCheck.current < 60000) return;
    lastCheck.current = Date.now();
    request.current?.abort();
    const controller = new AbortController(); request.current = controller;
    let timer;
    const timeout = new Promise((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(new Error('Update check timeout')); }, 10000); });
    setState(previous => ({ ...previous, checking: true, error: '' }));
    try {
      const [installed, release] = await Promise.race([Promise.all([api.installed(), api.release(controller.signal)]), timeout]);
      if (request.current === controller && !controller.signal.aborted) setState({ installed, release, checking: false, error: '' });
    } catch {
      if (request.current === controller) setState(previous => ({ ...previous, checking: false, error: 'Não foi possível verificar a atualização agora. Confira a conexão e tente novamente.' }));
    } finally { clearTimeout(timer); }
  }, [api]);
  useEffect(() => {
    let disposed = false, stopResume;
    const automatic = () => { if (document.visibilityState !== 'hidden') void check(); };
    void check(true);
    window.addEventListener('online', automatic); window.addEventListener('focus', automatic);
    const interval = setInterval(automatic, 6 * 60 * 60 * 1000);
    api.onResume(() => void check()).then(stop => { if (disposed) stop(); else stopResume = stop; }).catch(() => {});
    return () => { disposed = true; request.current?.abort(); request.current = null; stopResume?.(); clearInterval(interval); window.removeEventListener('online', automatic); window.removeEventListener('focus', automatic); };
  }, [api, check]);
  const available = hasAndroidUpdate(state.installed, state.release);
  const download = async () => {
    if (!state.release || (state.installed && state.release.versionCode < state.installed.versionCode)) return;
    setDownloadError('');
    try { await api.open(state.release.downloadUrl); }
    catch (error) { setDownloadError(error.message || 'Não foi possível iniciar o download.'); }
  };
  return <UpdatesContext.Provider value={{ ...state, available, download, downloadError, check }}>{children}</UpdatesContext.Provider>;
}
function InstallInstructions() {
  return <div className="space-y-2 text-sm text-slate-700"><p>Após baixar, abra <strong>Arquivos → Downloads → CarcinoGestao-teste.apk → Atualizar</strong>. O nome do gerenciador de arquivos pode variar no celular.</p><p>Se o Android solicitar, autorize a instalação por esse navegador. <strong>Instale por cima: não desinstale nem limpe os dados</strong>, para preservar fotos e relatórios locais.</p><p>O site continua disponível pelo navegador, inclusive em dispositivos sem o aplicativo.</p></div>;
}
export function AppUpdateNotice() {
  const updates = useContext(UpdatesContext);
  if (!updates?.available) return null;
  return <section role="status" aria-label="Atualização do aplicativo" className="border-b border-emerald-300 bg-emerald-50 px-4 py-4 text-emerald-950"><div className="mx-auto max-w-6xl space-y-3"><h2 className="font-bold">Atualização do aplicativo disponível</h2><p className="text-sm">Instalada: {updates.installed.versionName} ({updates.installed.versionCode}) · Nova: {updates.release.versionName} ({updates.release.versionCode}).</p><button type="button" className={`${button} bg-emerald-800 text-white hover:bg-emerald-900`} onClick={() => void updates.download()}><Download className="size-4" />Baixar atualização do APK</button><details><summary className="min-h-12 cursor-pointer py-3 text-sm font-semibold">Como instalar a atualização</summary><InstallInstructions /></details>{updates.downloadError && <p role="alert" className="text-sm text-rose-900">{updates.downloadError}</p>}</div></section>;
}
export function AndroidDownloadSettings() {
  const updates = useContext(UpdatesContext);
  if (!updates) return null;
  const olderDownload = updates.installed && updates.release && updates.release.versionCode < updates.installed.versionCode;
  return <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5"><h3 className="text-lg font-bold text-slate-900">Aplicativo Android</h3><p className="text-sm text-slate-700">Use o aplicativo no celular ou continue usando a versão web neste navegador. O download do APK é opcional.</p>
    {updates.installed && <p className="text-sm text-slate-700">Versão instalada: {updates.installed.versionName} · compilação {updates.installed.versionCode}.</p>}
    {updates.release && <p className="text-sm text-slate-700">APK disponível: {updates.release.versionName} · compilação {updates.release.versionCode}.</p>}
    {!updates.checking && !updates.error && updates.installed && updates.release && !updates.available && !olderDownload && <p role="status" className="text-sm font-semibold text-emerald-800">Seu aplicativo está atualizado.</p>}
    {olderDownload && <p className="text-sm text-slate-700">A versão instalada é mais recente que o APK publicado. Nenhuma atualização é necessária.</p>}
    <div className="flex flex-wrap gap-3"><button type="button" className={`${button} bg-emerald-800 text-white hover:bg-emerald-900`} disabled={!updates.release || !!olderDownload} onClick={() => void updates.download()}><Download className="size-4" />{updates.available ? 'Baixar atualização do APK' : 'Baixar APK Android'}</button><button type="button" className={`${button} border border-slate-300 text-slate-800 hover:bg-slate-50`} disabled={updates.checking} onClick={() => void updates.check(true)}><RefreshCw className="size-4" />{updates.checking ? 'Verificando versão…' : 'Verificar atualização'}</button></div>
    <InstallInstructions />{updates.error && <p role="status" className="text-sm text-slate-700">{updates.error}</p>}{updates.downloadError && <p role="alert" className="text-sm text-rose-900">{updates.downloadError}</p>}
  </section>;
}
