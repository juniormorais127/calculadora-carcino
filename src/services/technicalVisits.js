import { collection, doc, getDoc, onSnapshot, runTransaction, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore';
import { firestore } from './firebase.js';
import { validateVisitReport } from './technicalVisitData.js';

export const authorizationId = (ownerUid, technicianUid) => `${ownerUid}~${technicianUid}`;
export function watchFieldRecords(name, field, uid, next, error) {
  const ref = collection(firestore, name);
  return onSnapshot(field ? query(ref, where(field, '==', uid)) : ref, snapshot => next(snapshot.docs.map(item => ({ ...item.data(), id: item.id }))), error);
}
export async function authorizeTechnician(ownerUid, technicianUid, actorUid, active = true) {
  const uid = technicianUid.trim();
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(uid) || uid === ownerUid) throw new Error('Confira o código do técnico. Ele deve ser de outra conta.');
  await setDoc(doc(firestore, 'fieldAuthorizations', authorizationId(ownerUid, uid)), { ownerUid, technicianUid: uid, active, changedBy: actorUid, changedAt: serverTimestamp() });
}
export async function readSharedFarm(ownerUid) {
  const snapshot = await getDoc(doc(firestore, 'fieldFarms', ownerUid));
  return snapshot.exists() ? snapshot.data() : null;
}
export async function publishSharedFarm(user, farmProfile, ponds) {
  await setDoc(doc(firestore, 'fieldFarms', user.uid), { ownerUid: user.uid,
    name: String(farmProfile?.nomeFazenda || 'Propriedade sem nome').slice(0, 200),
    ponds: ponds.map(pond => ({ id: pond.id, name: String(pond.nome).slice(0, 200), latitude: pond.latitude ?? null, longitude: pond.longitude ?? null })), updatedAt: serverTimestamp() });
}
export async function submitTechnicalVisit(user, farm, pond, input) {
  const value = validateVisitReport(input);
  const ref = doc(collection(firestore, 'technicalVisits'));
  const batch = writeBatch(firestore);
  const report = { ownerUid: farm.ownerUid, technicianUid: user.uid, technicianEmail: user.email, farmName: farm.name,
    pondId: pond.id, pondName: pond.name, visitedOn: value.visitedOn, summary: value.notes,
    correctLocation: !!input.correctLocation, latitude: input.correctLocation ? value.location.latitude : pond.latitude ?? null, longitude: input.correctLocation ? value.location.longitude : pond.longitude ?? null,
    previousLatitude: pond.latitude ?? null, previousLongitude: pond.longitude ?? null,
    licenseStatus: value.licenseStatus, licenseNumber: value.license?.number || '', licenseRegisteredOn: value.license?.registeredOn || '', licenseExpiresOn: value.license?.expiresOn || '',
    status: 'pending', createdAt: serverTimestamp(), decidedAt: null };
  batch.set(ref, report);
  batch.set(doc(firestore, 'technicalNotebooks', user.uid, 'visits', ref.id), { notes: value.privateNotes, createdAt: serverTimestamp() });
  await batch.commit();
  return ref.id;
}
export async function decideVisit(id, accepted) {
  const ref = doc(firestore, 'technicalVisits', id);
  await runTransaction(firestore, async transaction => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists() || snapshot.data().status !== 'pending') throw new Error('Esta visita já foi analisada. Atualize a lista.');
    transaction.update(ref, { status: accepted ? 'accepted' : 'rejected', decidedAt: serverTimestamp() });
  });
}
export async function readPrivateVisit(uid, id) {
  const snapshot = await getDoc(doc(firestore, 'technicalNotebooks', uid, 'visits', id));
  return snapshot.data()?.notes || 'Sem anotações privadas.';
}
export { applyAcceptedVisit, checkVisitApproval } from './technicalVisitLocal.js';
