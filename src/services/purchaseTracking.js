import Dexie from 'dexie';
import { collection, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, firestore } from './firebase.js';

const outbox = new Dexie('CarcinoGestaoPurchaseOutbox');
outbox.version(1).stores({ events: 'id,uid' });
let flushing = false;
export async function flushPurchaseEvents() {
  const uid = auth.currentUser?.uid;
  if (!uid || !navigator.onLine || flushing) return;
  flushing = true;
  try {
    for (const item of await outbox.events.where('uid').equals(uid).toArray()) {
      if (auth.currentUser?.uid !== uid) break;
      const { id, ...event } = item;
      const ref = doc(firestore, 'purchaseEvents', id);
      // Stable document ID and a read on retry prevent counting an upload twice.
      const existing = await getDoc(ref);
      if (!existing.exists()) await setDoc(ref, { ...event, receivedAt: serverTimestamp() });
      await outbox.events.delete(id);
    }
  } catch (error) {
    console.warn('Métricas de compras aguardando conexão:', error.code || 'indisponível');
  } finally { flushing = false; }
}
export async function trackPurchase(kind, target = {}) {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  try {
    const id = doc(collection(firestore, 'purchaseEvents')).id;
    await outbox.events.add({ id, uid, kind, targetId: target.id || 'compras', targetName: target.name || 'Onde Comprar', category: target.category || 'Geral', occurredAt: Date.now() });
    void flushPurchaseEvents();
    return id;
  } catch { /* Measurement never blocks a quote or phone call. */ }
}
