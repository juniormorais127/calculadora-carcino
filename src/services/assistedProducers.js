import { collection, doc, getDoc, onSnapshot, query, where, writeBatch, runTransaction, serverTimestamp, Timestamp } from 'firebase/firestore';
import { firestore } from './firebase.js';
import { validateAssistedProducer, normalizeActivationCode, newActivationCode } from './assistedProducerData.js';
import { validateVisitReport } from './technicalVisitData.js';
import { propertyNameKey } from './propertyDirectory.js';

export function watchAssistedProducers(mode, uid, next, error) {
  const ref = collection(firestore, 'assistedProducers');
  return onSnapshot(mode === 'admin' ? ref : query(ref, where(mode === 'technician' ? 'technicianUid' : 'ownerUid', '==', uid)), snapshot => next(snapshot.docs.map(item => ({ ...item.data(), id: item.id }))), error);
}
export async function createAssistedProducer(user, input) {
  const { privateAlias, ...value } = validateAssistedProducer(input);
  const profile = await getDoc(doc(firestore, 'technicianIdentities', user.uid));
  if (!profile.data()?.fullName) throw new Error('Complete sua identificação profissional antes de cadastrar um produtor.');
  const ref = doc(collection(firestore, 'assistedProducers'));
  const activationCode = newActivationCode(), expiresAt = Timestamp.fromMillis(Date.now() + 30 * 86400000);
  const propertyKey = propertyNameKey(value.propertyName);
  await runTransaction(firestore, async batch => {
  const nameRef = doc(firestore, 'propertyNames', propertyKey), reserved = await batch.get(nameRef);
  if (reserved.exists()) {
    const previous = reserved.data().source === 'assisted' ? await batch.get(doc(firestore, 'assistedProducers', reserved.data().sourceId)).catch(() => null) : null;
    if (previous?.data()?.auditStatus !== 'rejected' || previous.data().technicianUid !== user.uid) throw new Error('Este nome de propriedade já está cadastrado. Selecione o cadastro existente ou informe um nome que identifique outra propriedade.');
  }
  batch.set(nameRef, { source: 'assisted', sourceId: ref.id, ownerUid: null });
  batch.set(ref, { ...value, propertyKey, revision: 1, auditEventId: null, technicianEmail: user.email, initialMarketingConsent: value.marketingConsent, marketingChangedBy: user.uid, marketingChangedAt: serverTimestamp(), marketingNoticeVersion: 'regional-offers-v1', technicianUid: user.uid, technicianName: profile.data().fullName,
    createdAt: serverTimestamp(), auditStatus: 'pending', auditBy: null, auditName: '', auditNote: '', auditedAt: null,
    activationCode, activationExpiresAt: expiresAt, ownerUid: null, claimedAt: null, clientDecision: 'pending', clientDecidedAt: null });
  batch.set(doc(firestore, 'assistedActivations', activationCode), { producerId: ref.id, fullName: value.fullName, propertyName: value.propertyName, expiresAt, claimedUid: null, claimedAt: null });
  batch.set(doc(firestore, 'technicalNotebooks', user.uid, 'assistedClients', ref.id), { alias: privateAlias, createdAt: serverTimestamp() });
  });
  return ref.id;
}
export async function auditAssistedProducer(user, id, decision, note) {
  const status = typeof decision === 'boolean' ? decision ? 'approved' : 'rejected' : decision;
  if (!['approved', 'rejected', 'changes_requested'].includes(status)) throw new Error('Selecione uma decisão válida.');
  const auditNote = String(note || '').trim();
  if (auditNote.length < 10 || auditNote.length > 2000) throw new Error('Descreva a análise administrativa com 10 a 2.000 caracteres.');
  const profile = await getDoc(doc(firestore, 'accountProfiles', user.uid));
  const ref = doc(firestore, 'assistedProducers', id);
  await runTransaction(firestore, async transaction => {
    const snapshot = await transaction.get(ref);
    if (snapshot.data()?.auditStatus !== 'pending') throw new Error('Este cadastro já foi analisado. Atualize a lista.');
    const auditRef = doc(collection(firestore, 'assistedProducers', id, 'auditHistory'));
    transaction.set(auditRef, { status, note: auditNote, by: user.uid, name: profile.data()?.fullName || '', reviewedAt: serverTimestamp(), snapshot: snapshot.data() });
    transaction.update(ref, { auditStatus: status, auditBy: user.uid, auditName: profile.data()?.fullName || '', auditNote, auditedAt: serverTimestamp(), auditEventId: auditRef.id });
  });
}
export async function resubmitAssistedProducer(user, id, input) {
  const { privateAlias, ...value } = validateAssistedProducer(input), propertyKey = propertyNameKey(value.propertyName);
  await runTransaction(firestore, async transaction => {
    const ref = doc(firestore, 'assistedProducers', id), original = await transaction.get(ref);
    const nameRef = doc(firestore, 'propertyNames', propertyKey), reserved = await transaction.get(nameRef);
    if (original.data()?.auditStatus !== 'changes_requested' || original.data()?.ownerUid) throw new Error('Este cadastro não está aguardando ajustes. Atualize a lista.');
    if (reserved.exists() && (reserved.data().source !== 'assisted' || reserved.data().sourceId !== id)) throw new Error('Este nome de propriedade já está reservado para outro cadastro.');
    const activationCode = newActivationCode(), expiresAt = Timestamp.fromMillis(Date.now() + 30 * 86400000);
    if (!reserved.exists()) transaction.set(nameRef, { source: 'assisted', sourceId: id, ownerUid: null });
    transaction.update(ref, { ...value, propertyKey, revision: original.data().revision + 1, auditStatus: 'pending', auditBy: null, auditName: '', auditNote: '', auditedAt: null, auditEventId: null,
      activationCode, activationExpiresAt: expiresAt, initialMarketingConsent: value.marketingConsent, marketingChangedBy: user.uid, marketingChangedAt: serverTimestamp() });
    transaction.set(doc(firestore, 'assistedActivations', activationCode), { producerId: id, fullName: value.fullName, propertyName: value.propertyName, expiresAt, claimedUid: null, claimedAt: null });
    transaction.set(doc(firestore, 'technicalNotebooks', user.uid, 'assistedClients', id), { alias: privateAlias, createdAt: serverTimestamp() });
  });
}
export function watchAssistedAudit(id, next, error) {
  return onSnapshot(collection(firestore, 'assistedProducers', id, 'auditHistory'), snapshot => next(snapshot.docs.map(item => ({ ...item.data(), id: item.id }))), error);
}
export async function renewAssistedActivation(user, id) {
  const ref = doc(firestore, 'assistedProducers', id);
  await runTransaction(firestore, async transaction => {
    const snapshot = await transaction.get(ref), item = snapshot.data();
    if (!item || item.ownerUid || item.auditStatus !== 'approved') throw new Error('Somente cadastros aprovados e sem conta vinculada podem receber outro código.');
    const activationCode = newActivationCode(), expiresAt = Timestamp.fromMillis(Date.now() + 30 * 86400000);
    transaction.update(ref, { activationCode, activationExpiresAt: expiresAt });
    transaction.set(doc(firestore, 'assistedActivations', activationCode), { producerId: id, fullName: item.fullName, propertyName: item.propertyName, expiresAt, claimedUid: null, claimedAt: null });
  });
}
export async function previewAssistedActivation(code) {
  try {
    const snapshot = await getDoc(doc(firestore, 'assistedActivations', normalizeActivationCode(code)));
    if (!snapshot.exists()) throw new Error();
    return snapshot.data();
  } catch { throw new Error('Código indisponível. Confira se o cadastro foi aprovado e peça ao técnico um código válido, se necessário.'); }
}
export async function claimAssistedProducer(user, code) {
  const ref = doc(firestore, 'assistedActivations', normalizeActivationCode(code));
  try {
    await runTransaction(firestore, async transaction => {
      const snapshot = await transaction.get(ref), ticket = snapshot.data();
      if (!ticket || ticket.claimedUid || ticket.expiresAt.toMillis() <= Date.now()) throw new Error();
      transaction.update(ref, { claimedUid: user.uid, claimedAt: serverTimestamp() });
      transaction.update(doc(firestore, 'assistedProducers', ticket.producerId), { ownerUid: user.uid, claimedAt: serverTimestamp() });
      transaction.update(doc(firestore, 'propertyNames', propertyNameKey(ticket.propertyName)), { ownerUid: user.uid });
    });
  } catch { throw new Error('Não foi possível vincular. O código pode ter expirado, já ter sido usado ou ainda aguardar auditoria. Atualize a lista antes de tentar novamente.'); }
}
export async function decideAssistedProducer(user, id, accepted) {
  await runTransaction(firestore, async transaction => {
    const ref = doc(firestore, 'assistedProducers', id), snapshot = await transaction.get(ref);
    if (snapshot.data()?.ownerUid !== user.uid || snapshot.data()?.clientDecision !== 'pending') throw new Error('Este cadastro já foi analisado ou não pertence à sua conta.');
    transaction.update(ref, { clientDecision: accepted ? 'accepted' : 'rejected', clientDecidedAt: serverTimestamp() });
  });
}
export function watchAssistedVisits(id, next, error) {
  return onSnapshot(collection(firestore, 'assistedProducers', id, 'visits'), snapshot => next(snapshot.docs.map(item => ({ ...item.data(), id: item.id }))), error);
}
export async function submitAssistedVisit(user, producerId, input) {
  const value = validateVisitReport(input), ref = doc(collection(firestore, 'assistedProducers', producerId, 'visits'));
  const batch = writeBatch(firestore);
  batch.set(ref, { technicianUid: user.uid, visitedOn: value.visitedOn, summary: value.notes, ...value.location,
    licenseStatus: value.licenseStatus, licenseNumber: value.license?.number || '', licenseRegisteredOn: value.license?.registeredOn || '', licenseExpiresOn: value.license?.expiresOn || '',
    status: 'pending', createdAt: serverTimestamp(), decidedAt: null });
  batch.set(doc(firestore, 'technicalNotebooks', user.uid, 'assistedVisits', ref.id), { producerId, notes: value.privateNotes, createdAt: serverTimestamp() });
  await batch.commit();
  return ref.id;
}
export async function decideAssistedVisit(user, producerId, id, accepted) {
  await runTransaction(firestore, async transaction => {
    const ref = doc(firestore, 'assistedProducers', producerId, 'visits', id), snapshot = await transaction.get(ref);
    if (snapshot.data()?.status !== 'pending') throw new Error('Esta visita já foi analisada.');
    transaction.update(ref, { status: accepted ? 'accepted' : 'rejected', decidedAt: serverTimestamp() });
  });
}
export async function readAssistedPrivateNotes(uid, id) {
  const snapshot = await getDoc(doc(firestore, 'technicalNotebooks', uid, 'assistedVisits', id));
  return snapshot.data()?.notes || 'Sem anotações privadas.';
}
export async function readAssistedAlias(uid, id) {
  const snapshot = await getDoc(doc(firestore, 'technicalNotebooks', uid, 'assistedClients', id));
  return snapshot.data()?.alias || '';
}
export async function setAssistedMarketing(user, id, enabled) {
  const ref = doc(firestore, 'assistedProducers', id);
  const event = doc(collection(firestore, 'assistedProducers', id, 'consentHistory'));
  const batch = writeBatch(firestore);
  batch.update(ref, { marketingConsent: enabled, marketingChangedBy: user.uid, marketingChangedAt: serverTimestamp(), marketingEventId: event.id });
  batch.set(event, { enabled, actorUid: user.uid, occurredAt: serverTimestamp(), noticeVersion: 'regional-offers-v1' });
  await batch.commit();
}
