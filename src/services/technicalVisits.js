import { collection, doc, getDoc, getDocs, query, where, orderBy, startAt, endAt, limit, onSnapshot, runTransaction, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore';
import { firestore } from './firebase.js';
import { validateVisitReport, validateIndependentVisit } from './technicalVisitData.js';
import { validateTechnicianIdentity } from './technicianIdentity.js';
import { propertySearchKey } from './propertyDirectory.js';

export async function searchRegisteredProperties(text) {
  const prefix = propertySearchKey(text);
  if (prefix.length < 2) return [];
  const result = await getDocs(query(collection(firestore, 'propertyDirectory'), orderBy('nameSearch'), startAt(prefix), endAt(prefix + '\uf8ff'), limit(8)));
  return result.docs.map(item => ({ ...item.data(), id: item.id }));
}
export async function syncPropertyDirectory() {
  const farms = await getDocs(collection(firestore, 'fieldFarms'));
  for (let start = 0; start < farms.docs.length; start += 100) {
    const batch = writeBatch(firestore);
    farms.docs.slice(start, start + 100).forEach(item => {
      const farm = item.data();
      batch.set(doc(firestore, 'propertyDirectory', item.id), { ownerUid: item.id, name: farm.name, nameSearch: propertySearchKey(farm.name), updatedAt: serverTimestamp() });
    });
    await batch.commit();
  }
}

export async function saveTechnicianIdentity(user, value) {
  const profile = await getDoc(doc(firestore, 'accountProfiles', user.uid));
  if (!profile.data()?.fullName) throw new Error('Defina primeiro o nome completo da conta.');
  await setDoc(doc(firestore, 'technicianIdentities', user.uid), { ...validateTechnicianIdentity({ ...value, fullName: profile.data().fullName }), updatedAt: serverTimestamp() });
}
export async function readTechnicianIdentity(uid) {
  const snapshot = await getDoc(doc(firestore, 'technicianIdentities', uid));
  return snapshot.exists() ? snapshot.data() : null;
}

export const authorizationId = (ownerUid, technicianUid) => `${ownerUid}~${technicianUid}`;
export async function submitIndependentVisit(user, input) {
  const value = validateIndependentVisit(input);
  if (value.clientEmail === user.email.toLowerCase()) throw new Error('Informe o e-mail do produtor, diferente da sua conta.');
  const ref = doc(collection(firestore, 'fieldInspectionReports'));
  const batch = writeBatch(firestore);
  batch.set(ref, { clientEmail: value.clientEmail, recipientUid: value.recipientUid, propertyName: value.propertyName, technicianUid: user.uid, technicianEmail: user.email,
    visitedOn: value.visitedOn, summary: value.notes, latitude: value.location.latitude, longitude: value.location.longitude,
    licenseStatus: value.licenseStatus, licenseNumber: value.license?.number || '', licenseRegisteredOn: value.license?.registeredOn || '', licenseExpiresOn: value.license?.expiresOn || '',
    ownerUid: null, status: 'pending', createdAt: serverTimestamp(), decidedAt: null });
  batch.set(doc(firestore, 'technicalNotebooks', user.uid, 'inspections', ref.id), { notes: value.privateNotes, createdAt: serverTimestamp() });
  await batch.commit();
  return ref.id;
}
export async function decideIndependentVisit(user, id, accepted) {
  const ref = doc(firestore, 'fieldInspectionReports', id);
  await runTransaction(firestore, async transaction => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists() || snapshot.data().status !== 'pending') throw new Error('Este registro já foi analisado.');
    if (snapshot.data().recipientUid !== user.uid && snapshot.data().clientEmail !== user.email.toLowerCase()) throw new Error('Este registro não pertence à sua conta.');
    transaction.update(ref, { status: accepted ? 'accepted' : 'rejected', ownerUid: user.uid, decidedAt: serverTimestamp() });
  });
}
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
  const name = String(farmProfile?.nomeFazenda || 'Propriedade sem nome').slice(0, 200);
  const batch = writeBatch(firestore);
  batch.set(doc(firestore, 'fieldFarms', user.uid), { ownerUid: user.uid, ownerEmail: user.email.toLowerCase(),
    name: String(farmProfile?.nomeFazenda || 'Propriedade sem nome').slice(0, 200),
    ponds: ponds.map(pond => ({ id: pond.id, name: String(pond.nome).slice(0, 200), latitude: pond.latitude ?? null, longitude: pond.longitude ?? null })), updatedAt: serverTimestamp() });
  batch.set(doc(firestore, 'propertyDirectory', user.uid), { ownerUid: user.uid, name, nameSearch: propertySearchKey(name), updatedAt: serverTimestamp() });
  await batch.commit();
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
export async function readPrivateVisit(uid, id, independent = false) {
  const snapshot = await getDoc(doc(firestore, 'technicalNotebooks', uid, independent ? 'inspections' : 'visits', id));
  return snapshot.data()?.notes || 'Sem anotações privadas.';
}
export { applyAcceptedVisit, checkVisitApproval } from './technicalVisitLocal.js';
