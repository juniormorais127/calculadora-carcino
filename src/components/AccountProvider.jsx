import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import Dexie, { liveQuery } from 'dexie';
import { onIdTokenChanged, signOut } from 'firebase/auth';
import { auth } from '../services/firebase.js';
import { db as guestDb, getAccountDatabase, exportLocalDatabase, importLocalDatabase } from '../services/db.js';
import { createCloudSync } from '../services/cloudSync.js';
import { remoteFor } from '../services/cloudRemote.js';
import { serializeData } from '../services/cloudData.js';
import { flushPurchaseEvents } from '../services/purchaseTracking.js';
import { registerAccountProfile } from '../services/accountProfiles.js';
import { doc, onSnapshot } from 'firebase/firestore';
import { firestore } from '../services/firebase.js';

export const AccountContext = createContext(null);
const metadata = new Dexie('CarcinoGestaoCloudMetadata');
metadata.version(1).stores({ accounts: 'uid' });
export const useAccount = () => useContext(AccountContext);
export const useDatabase = () => useAccount()?.database || guestDb;

function AccountSession({ user, children, syncProduction }) {
  const [access, setAccess] = useState(null);
  const [accessLoading, setAccessLoading] = useState(!!user);
  const [accessError, setAccessError] = useState('');
  useEffect(() => {
    if (!user) return;
    let disposed = false;
    const register = () => {
      if (navigator.onLine) void registerAccountProfile(user).catch(() => { if (!disposed) setAccessError('Não foi possível atualizar o cadastro. Tente novamente com internet.'); });
    };
    register();
    const unsubscribe = onSnapshot(doc(firestore, 'accountProfiles', user.uid), snapshot => {
      setAccess(snapshot.exists() ? snapshot.data() : null); setAccessError(''); setAccessLoading(false);
    }, () => { setAccessError('Não foi possível consultar sua permissão de acesso.'); setAccessLoading(false); });
    window.addEventListener('online', register);
    return () => { disposed = true; unsubscribe(); window.removeEventListener('online', register); };
  }, [user?.uid]);
  const database = useMemo(() => user ? getAccountDatabase(user.uid) : guestDb, [user?.uid]);
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
    if (!user || !syncProduction || !user.emailVerified) return;
    let timer;
    let disposed = false;
    const sync = createCloudSync({
      remote: remoteFor(user.uid),
      readLocal: async () => JSON.parse(await exportLocalDatabase(database)),
      replaceLocal: async (data, expected) => {
        await database.transaction('rw', database.tables, async () => {
          if (expected && serializeData(JSON.parse(await exportLocalDatabase(database))) !== expected) {
            throw Object.assign(new Error('Os registros locais foram alterados.'), { code: 'sync/conflict' });
          }
          await importLocalDatabase(JSON.stringify(data), database);
        });
        if (!disposed) setDataVersion(version => version + 1);
      },
      readMeta: () => metadata.accounts.get(user.uid),
      saveMeta: async data => metadata.transaction('rw', metadata.accounts, async () => {
        const old = await metadata.accounts.get(user.uid);
        await metadata.accounts.put({ ...old, ...data, uid: user.uid });
      }),
      onStatus: setSyncStatus,
    });
    controller.current = sync;
    const schedule = () => {
      clearTimeout(timer);
      setSyncStatus(old => old.state === 'conflict' ? old : { state: 'pending', message: 'Verificando alterações para sincronizar…' });
      timer = setTimeout(() => {
        if (navigator.onLine) void sync.sync();
        else setSyncStatus({ state: 'pending', message: 'Sem internet. Alterações salvas neste aparelho; aguardando sincronização.' });
      }, 700);
    };
    const subscription = liveQuery(() => exportLocalDatabase(database)).subscribe({ next: schedule, error: () => setSyncStatus({ state: 'pending', message: 'Não foi possível acessar a cópia local.' }) });
    window.addEventListener('online', schedule);
    window.addEventListener('offline', schedule);
    window.addEventListener('focus', schedule);
    schedule();
    return () => {
      disposed = true; clearTimeout(timer); subscription.unsubscribe(); sync.stop();
      controller.current = null;
      window.removeEventListener('online', schedule); window.removeEventListener('offline', schedule); window.removeEventListener('focus', schedule);
    };
  }, [database, user?.uid, user?.emailVerified, syncProduction]);
  const value = {
    user, database, syncStatus, dataVersion, access, accessError, accessLoading,
    sync: () => controller.current?.sync(),
    useCloud: () => controller.current?.useCloud(),
    logout: () => signOut(auth),
    metadata,
  };
  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export default function AccountProvider({ children, syncProduction = true }) {
  const [{ user }, setIdentity] = useState({ user: undefined });
  useEffect(() => onIdTokenChanged(auth, user => setIdentity({ user }), () => setIdentity({ user: null })), []);
  if (user === undefined) return <div role="status" className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-700 p-6">Preparando o acesso ao CarcinoGestão…</div>;
  return <AccountSession key={user?.uid || 'local'} user={user} syncProduction={syncProduction}>{children}</AccountSession>;
}
