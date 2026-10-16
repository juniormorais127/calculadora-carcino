import { describe, test, before, after } from 'node:test';
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, collection, query, where, getDocs, getDoc, setDoc, updateDoc, writeBatch, serverTimestamp, Timestamp } from 'firebase/firestore';
import { writeAuthorizationRequest, writeAuthorizationDecision } from './helpers/fieldAuthorization.js';

describe('cadastros assistidos: auditoria, ativacao, nomes unicos e privacidade', { skip: !process.env.FIRESTORE_EMULATOR_HOST }, () => {
  let env;
  const stores = new Map();
  const db = (uid, verified = true) => {
    const key = `${uid}:${verified}`;
    if (!stores.has(key)) stores.set(key, env.authenticatedContext(uid, { email: `${uid}@example.com`, email_verified: verified }).firestore());
    return stores.get(key);
  };
  const code = 'a'.repeat(32), otherCode = 'b'.repeat(32);
  let activeCode = code;
  const producer = () => ({ fullName: '', phone: '+5579999999999', email: '', propertyName: 'Fazenda São João', propertyKey: 'fazenda-sao-joao', revision: 1, auditEventId: null, technicianEmail: 'assistTech@example.com', address: 'Povoado do Rio, s/n', city: 'Aracaju', state: 'SE', reference: '', latitude: -11, longitude: -37, presentialConsent: true,
    marketingConsent: false, initialMarketingConsent: false, marketingChangedBy: 'assistTech', marketingChangedAt: serverTimestamp(), marketingNoticeVersion: 'regional-offers-v1',
    technicianUid: 'assistTech', technicianName: 'Ana Tecnica', createdAt: serverTimestamp(), auditStatus: 'pending', auditBy: null, auditName: '', auditNote: '', auditedAt: null,
    activationCode: code, activationExpiresAt: Timestamp.fromMillis(Date.now() + 86400000), ownerUid: null, claimedAt: null, clientDecision: 'pending', clientDecidedAt: null });
  function create(uid, id = 'assist-one', overrides = {}) {
    const store = db(uid), value = { ...producer(), ...overrides }, batch = writeBatch(store);
    batch.set(doc(store, 'assistedProducers', id), value);
    batch.set(doc(store, 'propertyNames', value.propertyKey), { source: 'assisted', sourceId: id, ownerUid: null });
    batch.set(doc(store, 'assistedActivations', value.activationCode), { producerId: id, fullName: value.fullName, propertyName: value.propertyName, expiresAt: value.activationExpiresAt, claimedUid: null, claimedAt: null });
    batch.set(doc(store, 'technicalNotebooks', uid, 'assistedClients', id), { alias: 'Seu Ze', createdAt: serverTimestamp() });
    return batch.commit();
  }
  const approve = async (uid, status = 'approved') => {
    const store = db(uid), ref = doc(store, 'assistedProducers', 'assist-one'), original = await getDoc(ref), event = doc(collection(store, 'assistedProducers', 'assist-one', 'auditHistory')), batch = writeBatch(store), note = 'Conferidos os dados e o atendimento presencial.';
    batch.update(ref, { auditStatus: status, auditBy: uid, auditName: 'Nome assistAdmin', auditNote: note, auditedAt: serverTimestamp(), auditEventId: event.id });
    batch.set(event, { status, note, by: uid, name: 'Nome assistAdmin', reviewedAt: serverTimestamp(), snapshot: original.data() }); return batch.commit();
  };
  function claim(uid, verified = true, token = activeCode) {
    const store = db(uid, verified), batch = writeBatch(store);
    batch.update(doc(store, 'assistedProducers', 'assist-one'), { ownerUid: uid, claimedAt: serverTimestamp() });
    batch.update(doc(store, 'assistedActivations', token), { claimedUid: uid, claimedAt: serverTimestamp() });
    batch.update(doc(store, 'propertyNames', 'fazenda-sao-joao'), { ownerUid: uid });
    return batch.commit();
  }
  before(async () => {
    env = await initializeTestEnvironment({ projectId: 'demo-carcino', firestore: { rules: readFileSync('firestore.rules', 'utf8') } });
    await env.withSecurityRulesDisabled(async context => {
      for (const [uid, role] of [['assistTech', 'field_technician'], ['assistOtherTech', 'field_technician'], ['assistAdmin', 'administrator'], ['assistClient', 'producer'], ['assistStranger', 'producer'], ['assistReviewer', 'producer']]) {
        const fullName = uid === 'assistTech' ? 'Ana Tecnica' : `Nome ${uid}`;
        await setDoc(doc(context.firestore(), 'accountProfiles', uid), { role, fullName, email: `${uid}@example.com`, createdAt: serverTimestamp(), lastSeenAt: serverTimestamp(), premium: false, expiresAt: null, changedBy: null, changedAt: null });
        await setDoc(doc(context.firestore(), 'accountNames', uid), { fullName, createdAt: serverTimestamp() });
      }
      await setDoc(doc(context.firestore(), 'technicianIdentities', 'assistTech'), { fullName: 'Ana Tecnica', employmentType: 'private' });
    });
  });
  after(async () => env?.cleanup());
  test('matriz de acesso de ponta a ponta sem permitir aceite automatico ou duplicacao', async () => {
    await assertFails(create('assistStranger'));
    await assertFails(create('assistTech', 'invalid', { propertyName: '', propertyKey: 'invalid' }));
    await assertSucceeds(create('assistTech'));
    await assertFails(create('assistTech', 'duplicate', { propertyName: 'FAZENDA SAO JOAO', activationCode: otherCode }));
    await assertFails(create('assistTech', 'forged-key', { propertyName: 'Fazenda São João', propertyKey: 'outro-nome', activationCode: otherCode }));
    for (const uid of ['assistTech', 'assistAdmin']) await assertSucceeds(getDoc(doc(db(uid), 'assistedProducers', 'assist-one')));
    for (const uid of ['assistClient', 'assistOtherTech', 'assistStranger']) await assertFails(getDoc(doc(db(uid), 'assistedProducers', 'assist-one')));
    for (const uid of ['assistClient', 'assistOtherTech', 'assistAdmin']) await assertFails(getDoc(doc(db(uid), 'technicalNotebooks', 'assistTech', 'assistedClients', 'assist-one')));
    await assertSucceeds(getDoc(doc(db('assistTech'), 'technicalNotebooks', 'assistTech', 'assistedClients', 'assist-one')));
    await assertSucceeds(getDocs(query(collection(db('assistTech'), 'assistedProducers'), where('technicianUid', '==', 'assistTech'))));
    await assertFails(getDocs(collection(db('assistOtherTech'), 'assistedProducers')));
    await assertFails(getDoc(doc(db('assistClient'), 'assistedActivations', code)));
    await assertFails(claim('assistClient'));
    await assertFails(approve('assistTech'));
    await assertFails(approve('assistAdmin', 'accepted'));
    await assertSucceeds(approve('assistAdmin', 'changes_requested'));
    await assertFails(claim('assistClient'));
    const correction = writeBatch(db('assistTech')), revisedCode = 'c'.repeat(32), revisedExpiry = Timestamp.fromMillis(Date.now() + 86400000);
    correction.update(doc(db('assistTech'), 'assistedProducers', 'assist-one'), { address: 'Endereco corrigido apos conferencia presencial', revision: 2, auditStatus: 'pending', auditBy: null, auditName: '', auditNote: '', auditedAt: null, auditEventId: null, activationCode: revisedCode, activationExpiresAt: revisedExpiry, initialMarketingConsent: false, marketingChangedBy: 'assistTech', marketingChangedAt: serverTimestamp() });
    correction.set(doc(db('assistTech'), 'assistedActivations', revisedCode), { producerId: 'assist-one', fullName: '', propertyName: 'Fazenda São João', expiresAt: revisedExpiry, claimedUid: null, claimedAt: null });
    correction.set(doc(db('assistTech'), 'technicalNotebooks', 'assistTech', 'assistedClients', 'assist-one'), { alias: 'Seu Ze', createdAt: serverTimestamp() });
    await assertSucceeds(correction.commit()); activeCode = revisedCode;
    await assertFails(updateDoc(doc(db('assistTech'), 'assistedProducers', 'assist-one'), { address: 'Edicao fora da revisao' }));
    await assertSucceeds(getDocs(collection(db('assistAdmin'), 'assistedProducers', 'assist-one', 'auditHistory')));
    await assertFails(getDocs(collection(db('assistOtherTech'), 'assistedProducers', 'assist-one', 'auditHistory')));
    await assertSucceeds(approve('assistAdmin'));
    await assertFails(approve('assistAdmin', 'rejected'));
    await assertFails(updateDoc(doc(db('assistTech'), 'assistedProducers', 'assist-one'), { fullName: 'Outra Pessoa' }));
    await assertFails(getDoc(doc(db('assistClient'), 'assistedActivations', code)));
    await assertSucceeds(getDoc(doc(db('assistClient'), 'assistedActivations', activeCode)));
    await assertFails(getDocs(collection(db('assistClient'), 'assistedActivations')));
    await assertFails(claim('assistClient', false));
    await assertFails(claim('assistTech'));
    await assertFails(updateDoc(doc(db('assistClient'), 'assistedProducers', 'assist-one'), { ownerUid: 'assistClient', claimedAt: serverTimestamp() }));
    const visit = { technicianUid: 'assistTech', visitedOn: '2026-10-16', summary: 'Atendimento presencial e conferencia do endereco.', latitude: -11, longitude: -37, licenseStatus: 'unlicensed', licenseNumber: '', licenseRegisteredOn: '', licenseExpiresOn: '', status: 'pending', createdAt: serverTimestamp(), decidedAt: null };
    const report = writeBatch(db('assistTech'));
    report.set(doc(db('assistTech'), 'assistedProducers', 'assist-one', 'visits', 'visit-one'), visit);
    report.set(doc(db('assistTech'), 'technicalNotebooks', 'assistTech', 'assistedVisits', 'visit-one'), { producerId: 'assist-one', notes: 'Anotacao privada.', createdAt: serverTimestamp() });
    await assertSucceeds(report.commit());
    await assertFails(updateDoc(doc(db('assistAdmin'), 'assistedProducers', 'assist-one', 'visits', 'visit-one'), { status: 'accepted', decidedAt: serverTimestamp() }));
    await assertSucceeds(claim('assistClient'));
    await assertFails(claim('assistStranger'));
    await assertSucceeds(getDocs(query(collection(db('assistClient'), 'assistedProducers'), where('ownerUid', '==', 'assistClient'))));
    await assertSucceeds(getDoc(doc(db('assistClient'), 'assistedProducers', 'assist-one', 'visits', 'visit-one')));
    await assertFails(getDoc(doc(db('assistOtherTech'), 'assistedProducers', 'assist-one', 'visits', 'visit-one')));
    for (const uid of ['assistClient', 'assistAdmin', 'assistOtherTech']) await assertFails(getDoc(doc(db(uid), 'technicalNotebooks', 'assistTech', 'assistedVisits', 'visit-one')));
    await assertFails(setDoc(doc(db('assistTech'), 'assistedProducers', 'assist-one', 'visits', 'after-claim'), visit));
    await assertSucceeds(writeAuthorizationRequest(db('assistClient'), 'assistClient', 'assistClient', 'assistTech'));
    await assertFails(setDoc(doc(db('assistTech'), 'assistedProducers', 'assist-one', 'visits', 'still-pending'), visit));
    await assertFails(writeAuthorizationDecision(db('assistReviewer'), 'assistReviewer', 'assistClient', 'assistTech'));
    await assertFails(updateDoc(doc(db('assistReviewer'), 'accountProfiles', 'assistReviewer'), { canAuthorizeTechnicalSupport: true }));
    await assertSucceeds(updateDoc(doc(db('assistAdmin'), 'accountProfiles', 'assistReviewer'), { canAuthorizeTechnicalSupport: true, changedBy: 'assistAdmin', changedAt: serverTimestamp() }));
    await assertSucceeds(writeAuthorizationDecision(db('assistReviewer'), 'assistReviewer', 'assistClient', 'assistTech', 'changes_requested'));
    await assertFails(setDoc(doc(db('assistTech'), 'assistedProducers', 'assist-one', 'visits', 'still-changes'), visit));
    await assertSucceeds(writeAuthorizationRequest(db('assistTech'), 'assistTech', 'assistClient', 'assistTech', 'assist-one'));
    await assertFails(writeAuthorizationDecision(db('assistTech'), 'assistTech', 'assistClient', 'assistTech'));
    await assertSucceeds(writeAuthorizationDecision(db('assistReviewer'), 'assistReviewer', 'assistClient', 'assistTech'));
    await assertSucceeds(setDoc(doc(db('assistTech'), 'assistedProducers', 'assist-one', 'visits', 'after-grant'), visit));
    await assertSucceeds(updateDoc(doc(db('assistClient'), 'assistedProducers', 'assist-one'), { clientDecision: 'accepted', clientDecidedAt: serverTimestamp() }));
    await assertSucceeds(updateDoc(doc(db('assistClient'), 'assistedProducers', 'assist-one', 'visits', 'visit-one'), { status: 'accepted', decidedAt: serverTimestamp() }));
    await assertFails(updateDoc(doc(db('assistClient'), 'assistedProducers', 'assist-one', 'visits', 'visit-one'), { status: 'rejected', decidedAt: serverTimestamp() }));
    await assertFails(updateDoc(doc(db('assistTech'), 'assistedProducers', 'assist-one'), { marketingConsent: true }));
    const consent = writeBatch(db('assistClient'));
    consent.update(doc(db('assistClient'), 'assistedProducers', 'assist-one'), { marketingConsent: true, marketingChangedBy: 'assistClient', marketingChangedAt: serverTimestamp(), marketingEventId: 'consent-one' });
    consent.set(doc(db('assistClient'), 'assistedProducers', 'assist-one', 'consentHistory', 'consent-one'), { enabled: true, actorUid: 'assistClient', occurredAt: serverTimestamp(), noticeVersion: 'regional-offers-v1' });
    await assertSucceeds(consent.commit());
    await assertFails(updateDoc(doc(db('assistClient'), 'assistedProducers', 'assist-one'), { marketingConsent: false }));
    await assertFails(updateDoc(doc(db('assistClient'), 'assistedProducers', 'assist-one', 'consentHistory', 'consent-one'), { enabled: false }));
    const withdraw = writeBatch(db('assistTech'));
    withdraw.update(doc(db('assistTech'), 'assistedProducers', 'assist-one'), { marketingConsent: false, marketingChangedBy: 'assistTech', marketingChangedAt: serverTimestamp(), marketingEventId: 'withdraw-one' });
    withdraw.set(doc(db('assistTech'), 'assistedProducers', 'assist-one', 'consentHistory', 'withdraw-one'), { enabled: false, actorUid: 'assistTech', occurredAt: serverTimestamp(), noticeVersion: 'regional-offers-v1' });
    await assertSucceeds(withdraw.commit());
    await assertFails(updateDoc(doc(db('assistStranger'), 'propertyNames', 'fazenda-sao-joao'), { ownerUid: 'assistStranger' }));
  });
});
