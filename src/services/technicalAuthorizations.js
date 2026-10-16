import { doc, collection, getDoc, onSnapshot, query, where, runTransaction, serverTimestamp } from 'firebase/firestore';
import { firestore } from './firebase.js';

const idFor = (ownerUid, technicianUid) => `${ownerUid}~${technicianUid}`;
export function watchTechnicalAuthorizations(mode, uid, next, error) {
  const ref = collection(firestore, 'fieldAuthorizations');
  return onSnapshot(mode === 'audit' ? ref : query(ref, where(mode === 'technician' ? 'technicianUid' : 'ownerUid', '==', uid)), snapshot => next(snapshot.docs.map(item => ({ ...item.data(), id: item.id }))), error);
}
export async function requestTechnicalAuthorization(ownerUid, technicianUid, actorUid, note = 'Solicitação de acompanhamento técnico.', assistedId = null) {
  const uid = technicianUid.trim(), requestNote = note.trim();
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(uid) || uid === ownerUid) throw new Error('Informe o código de outra conta de técnico.');
  if (requestNote.length < 10 || requestNote.length > 2000) throw new Error('Descreva o pedido com 10 a 2.000 caracteres.');
  const ref = doc(firestore, 'fieldAuthorizations', idFor(ownerUid, uid));
  await runTransaction(firestore, async transaction => {
    const previous = await transaction.get(ref);
    if (previous.data()?.active || previous.data()?.status === 'pending') throw new Error('Este atendimento já está autorizado ou aguardando análise. Confira a aba Autorizações.');
    const eventRef = doc(collection(firestore, 'fieldAuthorizations', ref.id, 'history'));
    const value = { ownerUid, technicianUid: uid, assistedId, active: false, status: 'pending', requestNote, requestedBy: actorUid, requestedAt: serverTimestamp(),
      auditNote: '', auditName: '', auditedBy: null, auditedAt: null, changedBy: actorUid, changedAt: serverTimestamp(), eventId: eventRef.id };
    transaction.set(ref, value);
    transaction.set(eventRef, { status: 'pending', note: requestNote, by: actorUid, at: serverTimestamp() });
  });
}
export async function decideTechnicalAuthorization(user, id, decision, note) {
  if (!['approved', 'rejected', 'changes_requested', 'revoked'].includes(decision)) throw new Error('Decisão inválida.');
  const auditNote = note.trim();
  if (auditNote.length < 10 || auditNote.length > 2000) throw new Error('Descreva a decisão com 10 a 2.000 caracteres.');
  const ref = doc(firestore, 'fieldAuthorizations', id);
  const profile = await getDoc(doc(firestore, 'accountProfiles', user.uid));
  await runTransaction(firestore, async transaction => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists() || (decision !== 'revoked' && snapshot.data().status !== 'pending')) throw new Error('Este pedido não está aguardando análise. Atualize a lista.');
    const eventRef = doc(collection(firestore, 'fieldAuthorizations', id, 'history'));
    transaction.update(ref, { active: decision === 'approved', status: decision, auditNote, auditName: profile.data()?.fullName || '', auditedBy: user.uid, auditedAt: serverTimestamp(), changedBy: user.uid, changedAt: serverTimestamp(), eventId: eventRef.id });
    transaction.set(eventRef, { status: decision, note: auditNote, by: user.uid, at: serverTimestamp() });
  });
}
export function watchAuthorizationHistory(id, next, error) {
  return onSnapshot(collection(firestore, 'fieldAuthorizations', id, 'history'), snapshot => next(snapshot.docs.map(item => ({ ...item.data(), id: item.id }))), error);
}
