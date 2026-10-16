import { doc, collection, getDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
export async function writeAuthorizationRequest(store, actorUid, ownerUid, technicianUid, assistedId = null, note = 'Solicito acompanhamento tecnico nesta propriedade.') {
  const ref = doc(store, 'fieldAuthorizations', `${ownerUid}~${technicianUid}`), event = doc(collection(store, 'fieldAuthorizations', ref.id, 'history')), batch = writeBatch(store);
  batch.set(ref, { ownerUid, technicianUid, assistedId, active: false, status: 'pending', requestNote: note, requestedBy: actorUid, requestedAt: serverTimestamp(), auditNote: '', auditName: '', auditedBy: null, auditedAt: null, changedBy: actorUid, changedAt: serverTimestamp(), eventId: event.id });
  batch.set(event, { status: 'pending', note, by: actorUid, at: serverTimestamp() });
  return batch.commit();
}
export async function writeAuthorizationDecision(store, actorUid, ownerUid, technicianUid, status = 'approved') {
  const name = (await getDoc(doc(store, 'accountProfiles', actorUid))).data()?.fullName || '';
  const ref = doc(store, 'fieldAuthorizations', `${ownerUid}~${technicianUid}`), event = doc(collection(store, 'fieldAuthorizations', ref.id, 'history')), batch = writeBatch(store), note = 'Conferidos o pedido e o atendimento tecnico.';
  batch.update(ref, { active: status === 'approved', status, auditNote: note, auditName: name, auditedBy: actorUid, auditedAt: serverTimestamp(), changedBy: actorUid, changedAt: serverTimestamp(), eventId: event.id });
  batch.set(event, { status, note, by: actorUid, at: serverTimestamp() });
  return batch.commit();
}
