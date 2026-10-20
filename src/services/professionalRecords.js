import { collection, doc, getDocs, query, where, onSnapshot, runTransaction, serverTimestamp } from 'firebase/firestore';
import { firestore } from './firebase.js';
import { validateLicensingDraft } from './licensingData.js';
import { validateEnvironmentalTest } from './environmentalData.js';

export function watchProfessionalRecords(kind, uid, administrative, next, error) {
  const ref = collection(firestore, kind);
  return onSnapshot(administrative ? ref : query(ref, where('technicianUid', '==', uid)), snapshot => next(snapshot.docs.map(item => ({ ...item.data(), id: item.id })).sort((a,b) => (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0))), error);
}
export async function saveProfessionalRecord(kind, user, input) {
  if (!['licensingCases','environmentalTests'].includes(kind)) throw new Error('Tipo de registro inválido.');
  const value = kind === 'licensingCases' ? validateLicensingDraft(input) : validateEnvironmentalTest(input);
  const ref = input.id ? doc(firestore, kind, input.id) : doc(collection(firestore, kind));
  await runTransaction(firestore, async transaction => {
    const existing = await transaction.get(ref), old = existing.data();
    if (old && Number(input.revision) !== old.revision) throw new Error('Outro acesso alterou este registro. Reabra a versão atual antes de salvar; suas alterações continuam no formulário.');
    const audit = doc(collection(firestore, 'adminActivity'));
    const history = doc(firestore, kind, ref.id, 'history', audit.id);
    const payload = { ...value, technicianUid: old?.technicianUid || input.technicianUid || user.uid, ownerUid: old?.ownerUid ?? input.ownerUid ?? null, createdBy: old?.createdBy || user.uid, createdAt: old?.createdAt || serverTimestamp(), updatedAt: serverTimestamp(), updatedBy: user.uid, revision: (old?.revision || 0) + 1, auditId: audit.id };
    transaction.set(ref, payload);
    transaction.set(history, { ...payload, savedBy: user.uid });
    transaction.set(audit, { actorUid: user.uid, actorEmail: user.email || '', action: old ? 'record.updated' : 'record.created', collection: kind, entityId: ref.id, label: value.data.propertyName, occurredAt: serverTimestamp(), revision: payload.revision });
  });
  return ref.id;
}
export async function readProfessionalHistory(kind, id) {
  return (await getDocs(collection(firestore, kind, id, 'history'))).docs.map(item => item.data()).sort((a,b) => b.revision - a.revision);
}
export async function loadProfessionalProperties(user, administrative = false) {
  const assistedRef = collection(firestore, 'assistedProducers');
  const assisted = await getDocs(administrative ? assistedRef : query(assistedRef, where('technicianUid', '==', user.uid)));
  const result = assisted.docs.map(item => ({ ...item.data(), sourceId: item.id, name: item.data().propertyName, ownerUid: item.data().ownerUid || null }));
  if (administrative) {
    const farms = await getDocs(collection(firestore, 'fieldFarms'));
    result.push(...farms.docs.map(item => ({ ...item.data(), sourceId: item.id })));
  } else {
    const grants = await getDocs(query(collection(firestore, 'fieldAuthorizations'), where('technicianUid', '==', user.uid)));
    const farms = await Promise.allSettled(grants.docs.filter(item => item.data().active).map(async item => {
      const { getDoc } = await import('firebase/firestore');
      const snapshot = await getDoc(doc(firestore, 'fieldFarms', item.data().ownerUid));
      return snapshot.exists() ? { ...snapshot.data(), sourceId: snapshot.id } : null;
    }));
    result.push(...farms.filter(item => item.status === 'fulfilled' && item.value).map(item => item.value));
  }
  return result;
}
