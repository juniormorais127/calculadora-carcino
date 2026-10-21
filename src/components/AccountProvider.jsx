import React, { createContext, useContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Dexie, { liveQuery } from 'dexie';
import { onIdTokenChanged, signOut } from 'firebase/auth';
import { auth } from '../services/firebase.js';
import { db as guestDb, getAccountDatabase, exportLocalDatabase, importLocalDatabase } from '../services/db.js';
import { createCloudSync } from '../services/cloudSync.js';
import { remoteFor } from '../services/cloudRemote.js';
import { serializeData } from '../services/cloudData.js';
import { readSyncMetadata, saveSyncMetadata } from '../services/localSyncMetadata.js';
import { flushPurchaseEvents } from '../services/purchaseTracking.js';
import { registerAccountProfile } from '../services/accountProfiles.js';
import { doc, onSnapshot } from 'firebase/firestore';
import { firestore } from '../services/firebase.js';
import { isNativeApp } from '../services/deviceFiles.js';
const nativeProfiles = new Dexie('CarcinoGestao-native-account-cache');
nativeProfiles.version(1).stores({ profiles: '&uid' });

export const AccountContext = createContext(null);
const metadata = new Dexie('CarcinoGestaoCloudMetadata');
metadata.version(1).stores({ accounts: 'uid' });
export const useAccount = () => useContext(AccountContext);
export const useDatabase = () => useAccount()?.database || guestDb;

function AccountSession({ user, children, syncProduction, createRemote }) {
  const [localReady, setLocalReady] = useState(false);
  const markLocalReady = useCallback(() => setLocalReady(true), []);
  const [access, setAccess] = useState(null);
  const [accessLoading, setAccessLoading] = useState(!!user);
  const [accessError, setAccessError] = useState('');
  const [technicianIdentity, setTechnicianIdentity] = useState(null);
  const [identityLoading, setIdentityLoading] = useState(false);
  const [identityError, setIdentityError] = useState('');
  useEffect(() => {
    setTechnicianIdentity(null); setIdentityError('');
    if (!user || access?.role !== 'field_technician') { setIdentityLoading(false); return; }
    setIdentityLoading(true);
    return onSnapshot(doc(firestore, 'technicianIdentities', user.uid), snapshot => { setTechnicianIdentity(snapshot.data() || null); setIdentityLoading(false); setIdentityError(''); }, () => { setIdentityLoading(false); setIdentityError('Não foi possível consultar sua identificação profissional. Confira a conexão.'); });
  }, [user?.uid, access?.role]);
  useEffect(() => {
    if (!user) return;
    let disposed = false;
    let receivedServerProfile = false;
    const profileTimeout = setTimeout(() => {
      if (!disposed && !receivedServerProfile) {
        setAccessError('A consulta ao cadastro demorou mais que o esperado. Os dados locais continuam disponíveis; tente sincronizar novamente quando a conexão estabilizar.');
        setAccessLoading(false);
      }
    }, 12000);
    if (isNativeApp()) void nativeProfiles.profiles.get(user.uid).then(cached => {
      if (!disposed && !receivedServerProfile && cached?.profile) { setAccess(cached.profile); setAccessLoading(false); }
    }).catch(() => {});
    const register = () => {
      if (navigator.onLine) void registerAccountProfile(user).catch(() => { if (!disposed) setAccessError('Não foi possível atualizar o cadastro. Tente novamente com internet.'); });
    };
    register();
    const unsubscribe = onSnapshot(doc(firestore, 'accountProfiles', user.uid), snapshot => {
      if (isNativeApp() && snapshot.metadata.fromCache && !snapshot.exists()) return;
      receivedServerProfile = true;
      clearTimeout(profileTimeout);
      setAccess(snapshot.exists() ? snapshot.data() : null); setAccessError(''); setAccessLoading(false);
      if (isNativeApp()) void nativeProfiles.profiles.put({ uid: user.uid, profile: snapshot.exists() ? snapshot.data() : null }).catch(() => {});
    }, () => { clearTimeout(profileTimeout); setAccessError('Não foi possível consultar sua permissão de acesso.'); setAccessLoading(false); });
    window.addEventListener('online', register);
    return () => { disposed = true; clearTimeout(profileTimeout); unsubscribe(); window.removeEventListener('online', register); };
  }, [user?.uid]);
  const database = useMemo(() => user ? getAccountDatabase(user.uid) : guestDb, [user?.uid]);
  const readMeta = useCallback(() => readSyncMetadata(database, () => metadata.accounts.get(user.uid)), [database, user?.uid]);
  const [syncStatus, setSyncStatus] = useState({ state: user ? 'syncing' : 'local', message: user ? 'Conectando sua conta…' : 'Modo local: dados somente neste navegador.' });
  const [dataVersion, setDataVersion] = useState(0);
  const controller = useRef(null);
  useEffect(() => {
    if (!user) return;
    void flushPurchaseEvents();
    window.addEventListener('online', flushPurchaseEvents);
    window.addEventListener('focus', flushPurchaseEvents);
    const retryMetrics = setInterval(flushPurchaseEvents, 30000);
    return () => { clearInterval(retryMetrics); window.removeEventListener('online', flushPurchaseEvents); window.removeEventListener('focus', flushPurchaseEvents); };
  }, [user?.uid]);
  useEffect(() => {
    if (!user || !syncProduction || !user.emailVerified || !localReady) return;
    let timer;
    let disposed = false;
    let lastState = 'pending', watching = false, stopRemote = () => {};
    const remote = createRemote(user.uid);
    const watchRemote = () => {
      if (disposed || watching) return;
      watching = true;
      stopRemote = remote.watchChanges(revision => {
        void readMeta().then(meta => { if (!disposed && revision !== (meta?.revision || 0)) schedule(); }).catch(() => {});
      }, () => { watching = false; lastState = 'pending'; });
    };
    const sync = createCloudSync({
      remote,
      readLocal: async () => JSON.parse(await exportLocalDatabase(database)),
      replaceLocal: async (data, expected, nextMeta) => {
        const previousMeta = await readMeta();
        await database.transaction('rw', database.tables, async () => {
          if (expected && serializeData(JSON.parse(await exportLocalDatabase(database))) !== expected) {
            throw Object.assign(new Error('Os registros locais foram alterados.'), { code: 'sync/conflict' });
          }
          await importLocalDatabase(JSON.stringify(data), database);
          await saveSyncMetadata(database, nextMeta || {}, previousMeta);
        });
        if (!disposed) setDataVersion(version => version + 1);
      },
      readMeta,
      saveMeta: async data => saveSyncMetadata(database, data, await readMeta()),
      onStatus: value => { lastState = value.state; setSyncStatus(value); if (value.state === 'synced') watchRemote(); },
    });
    controller.current = sync;
    const schedule = () => {
      clearTimeout(timer);
      lastState = 'pending';
      setSyncStatus({ state: 'pending', message: navigator.onLine ? 'Atualizando a nuvem automaticamente…' : 'Sem internet. Alterações guardadas neste aparelho; envio automático ao reconectar.' });
      timer = setTimeout(() => {
        if (navigator.onLine) void sync.sync();
        else setSyncStatus({ state: 'pending', message: 'Sem internet. Alterações salvas neste aparelho; aguardando sincronização.' });
      }, 700);
    };
    let lastSignature;
    const subscription = liveQuery(async () => serializeData(JSON.parse(await exportLocalDatabase(database)))).subscribe({ next: signature => { if (signature !== lastSignature) { lastSignature = signature; schedule(); } }, error: () => setSyncStatus({ state: 'pending', message: 'Não foi possível acessar a cópia local.' }) });
    const retryPending = setInterval(() => { if (!disposed && navigator.onLine && lastState === 'pending') void sync.sync(); }, 15000);
    window.addEventListener('online', schedule);
    window.addEventListener('offline', schedule);
    window.addEventListener('focus', schedule);
    schedule();
    return () => {
      disposed = true; clearTimeout(timer); clearInterval(retryPending); stopRemote(); subscription.unsubscribe(); sync.stop();
      controller.current = null;
      window.removeEventListener('online', schedule); window.removeEventListener('offline', schedule); window.removeEventListener('focus', schedule);
    };
  }, [database, user?.uid, user?.emailVerified, syncProduction, localReady, readMeta, createRemote]);
  const value = {
    user, database, syncStatus, dataVersion, access, accessError, accessLoading, technicianIdentity, identityLoading, identityError, markLocalReady,
    sync: () => controller.current?.sync(),
    useCloud: () => controller.current?.useCloud(),
    logout: () => signOut(auth),
    metadata: { accounts: { get: uid => user && uid === user.uid ? readMeta() : metadata.accounts.get(uid), put: value => metadata.accounts.put(value) } },
  };
  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export default function AccountProvider({ children, syncProduction = true, observeAuth = onIdTokenChanged, createRemote = remoteFor }) {
  const [{ user }, setIdentity] = useState({ user: undefined });
  const [startupError, setStartupError] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setStartupError(true), 12000);
    const stop = observeAuth(auth, user => { clearTimeout(timer); setStartupError(false); setIdentity({ user }); }, () => { clearTimeout(timer); setStartupError(true); });
    return () => { clearTimeout(timer); stop(); };
  }, [observeAuth]);
  if (user === undefined) return <main className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-700 p-6"><div className="max-w-md space-y-4">{startupError ? <><h1 className="text-xl font-bold text-slate-900">Não foi possível concluir o acesso</h1><p role="alert">A sessão demorou mais que o esperado para responder. Verifique a conexão e tente abrir novamente. Seus registros neste aparelho foram preservados.</p><button type="button" className="min-h-12 rounded-xl bg-emerald-800 px-4 py-3 font-semibold text-white" onClick={() => window.location.reload()}>Tentar novamente</button></> : <p role="status">Preparando o acesso ao CarcinoGestão…</p>}</div></main>;
  return <AccountSession key={user?.uid || 'local'} user={user} syncProduction={syncProduction} createRemote={createRemote}>{children}</AccountSession>;
}
