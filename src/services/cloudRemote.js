import { collection, doc, getDocFromServer, getDocsFromServer, writeBatch, runTransaction, serverTimestamp } from 'firebase/firestore';
import { auth, firestore } from './firebase.js';
import { getIdTokenResult, reload } from 'firebase/auth';
import { createSessionVerifier } from './verifiedSession.js';
import { chunkData, normalizeData } from './cloudData.js';
const verifySession = createSessionVerifier({ currentUser: () => auth.currentUser, readToken: getIdTokenResult, refreshUser: reload });

export function remoteFor(uid) {
  const head = doc(firestore, 'users', uid, 'state', 'current');
  const chunkRef = (snapshot, index) => doc(firestore, 'users', uid, 'snapshots', snapshot, 'chunks', String(index));
  const removeSnapshot = async snapshot => {
    if (!snapshot) return;
    const docs = await getDocsFromServer(collection(firestore, 'users', uid, 'snapshots', snapshot, 'chunks'));
    for (let i = 0; i < docs.docs.length; i += 400) {
      const batch = writeBatch(firestore);
      docs.docs.slice(i, i + 400).forEach(item => batch.delete(item.ref));
      await batch.commit();
    }
  };
  return {
    async read() {
      await verifySession(uid);
      // A writer may publish during a read; retry instead of returning mixed versions.
      for (let attempt = 0; attempt < 3; attempt++) {
        const manifest = await getDocFromServer(head);
        if (!manifest.exists()) return { revision: 0, data: null };
        const info = manifest.data();
        if (!Number.isSafeInteger(info.chunks) || info.chunks < 1 || info.chunks > 400) throw new Error('Formato da cópia na nuvem inválido.');
        const chunks = await Promise.all(Array.from({ length: info.chunks }, (_, index) => getDocFromServer(chunkRef(info.snapshotId, index))));
        const check = await getDocFromServer(head);
        if (check.data()?.snapshotId !== info.snapshotId || chunks.some(item => !item.exists())) continue;
        return { revision: info.revision, data: normalizeData(JSON.parse(chunks.map(item => item.data().text).join(''))) };
      }
      throw new Error('A conta está sendo atualizada em outro aparelho. Tente novamente.');
    },
    async write(data, revision) {
      await verifySession(uid);
      const chunks = chunkData(data);
      if (chunks.length > 400) throw new Error('A cópia excedeu o limite de sincronização. Exporte um backup em Ajustes.');
      const snapshotId = crypto.randomUUID();
      // Bound each request below Firestore's 10 MiB transaction/request limit.
      try {
        for (let start = 0; start < chunks.length; start += 10) {
          const batch = writeBatch(firestore);
          chunks.slice(start, start + 10).forEach((text, index) => batch.set(chunkRef(snapshotId, start + index), { text }));
          await batch.commit();
        }
      } catch (error) {
        await removeSnapshot(snapshotId).catch(() => {});
        throw error;
      }
      let obsolete;
      try {
        await runTransaction(firestore, async transaction => {
          const current = await transaction.get(head);
          const info = current.data();
          if ((info?.revision || 0) !== revision) {
            const error = new Error('Existem alterações em outro aparelho.'); error.code = 'sync/conflict'; throw error;
          }
          obsolete = info?.previousSnapshotId;
          transaction.set(head, { revision: revision + 1, snapshotId, chunks: chunks.length,
            previousSnapshotId: info?.snapshotId || null, updatedAt: serverTimestamp() });
        });
      } catch (error) {
        // Only remove unpublished chunks on a confirmed revision conflict. A network
        // timeout could mean that publication succeeded, so preserve data in that case.
        if (error.code === 'sync/conflict') await removeSnapshot(snapshotId).catch(() => {});
        throw error;
      }
      // Keep the current and previous committed snapshots; cleanup is best effort.
      await removeSnapshot(obsolete).catch(() => {});
      return revision + 1;
    },
  };
}
