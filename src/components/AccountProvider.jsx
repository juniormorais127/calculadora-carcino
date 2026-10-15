import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import Dexie, { liveQuery } from 'dexie';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../services/firebase.js';
import { db as guestDb, getAccountDatabase, exportLocalDatabase, importLocalDatabase } from '../services/db.js';
import { createCloudSync } from '../services/cloudSync.js';
import { remoteFor } from '../services/cloudRemote.js';
import { serializeData } from '../services/cloudData.js';

const AccountContext = createContext(null);
const metadata = new Dexie('CarcinoGestaoCloudMetadata');
metadata.version(1).stores({ accounts: 'uid' });
export const useAccount = () => useContext(AccountContext);
export const useDatabase = () => useAccount()?.database || guestDb;

function AccountSession({ user, children }) {
  const database = useMemo(() => user ? getAccountDatabase(user.uid) : guestDb, [user?.uid]);
  const [syncStatus, setSyncStatus] = useState({ state: user ? 'syncing' : 'local', message: user ? 'Conectando sua conta…' : 'Modo local: dados somente neste navegador.' });
  const [dataVersion, setDataVersion] = useState(0);
  const controller = useRef(null);
  useEffect(() => {
    if (!user) return;
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
  }, [database, user?.uid]);
  const value = {
    user, database, syncStatus, dataVersion,
    sync: () => controller.current?.sync(),
    useCloud: () => controller.current?.useCloud(),
    logout: () => signOut(auth),
    metadata,
  };
  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export default function AccountProvider({ children }) {
  const [user, setUser] = useState(undefined);
  useEffect(() => onAuthStateChanged(auth, setUser, () => setUser(null)), []);
  if (user === undefined) return <div role="status" className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-700 p-6">Preparando o acesso ao CarcinoGestão…</div>;
  return <AccountSession key={user?.uid || 'local'} user={user}>{children}</AccountSession>;
}
