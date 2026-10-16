import { doc, runTransaction, serverTimestamp, updateDoc } from 'firebase/firestore';
import { firestore } from './firebase.js';
import { SENIOR_UID } from './accountPermissions.js';

export async function registerAccountProfile(user) {
  const ref = doc(firestore, 'accountProfiles', user.uid);
  await runTransaction(firestore, async transaction => {
    const profile = await transaction.get(ref);
    const visit = { email: user.email, lastSeenAt: serverTimestamp() };
    const defaultRole = user.uid === SENIOR_UID ? 'senior' : 'producer';
    if (profile.exists()) transaction.update(ref, { ...visit, ...(!profile.data().role || user.uid === SENIOR_UID ? { role: defaultRole } : {}) });
    else transaction.set(ref, { ...visit, role: defaultRole, createdAt: serverTimestamp(), premium: false, expiresAt: null, changedBy: null, changedAt: null });
  });
}

export async function saveAccountPhone(user, phone) {
  if (!/^\+[1-9]\d{7,14}$/.test(phone)) throw new Error('Informe um celular válido com código do país e DDD.');
  await registerAccountProfile(user);
  await updateDoc(doc(firestore, 'accountProfiles', user.uid), { phone });
}
