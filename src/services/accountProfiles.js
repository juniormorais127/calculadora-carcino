import { doc, runTransaction, serverTimestamp, updateDoc } from 'firebase/firestore';
import { firestore } from './firebase.js';
import { SENIOR_UID } from './accountPermissions.js';
import { validateAccountName } from './accountName.js';

export async function registerAccountProfile(user) {
  const ref = doc(firestore, 'accountProfiles', user.uid);
  await runTransaction(firestore, async transaction => {
    const profile = await transaction.get(ref);
    const name = await transaction.get(doc(firestore, 'accountNames', user.uid));
    const visit = { email: user.email, lastSeenAt: serverTimestamp() };
    const defaultRole = user.uid === SENIOR_UID ? 'senior' : 'producer';
    if (profile.exists() && profile.data().fullName && !name.exists()) transaction.set(doc(firestore, 'accountNames', user.uid), { fullName: validateAccountName(profile.data().fullName), createdAt: serverTimestamp() });
    if (profile.exists()) transaction.update(ref, { ...visit, ...(!profile.data().role || user.uid === SENIOR_UID ? { role: defaultRole } : {}) });
    else transaction.set(ref, { ...visit, ...(name.exists() ? { fullName: name.data().fullName } : {}), role: defaultRole, createdAt: serverTimestamp(), premium: false, expiresAt: null, changedBy: null, changedAt: null });
  });
}

export async function saveAccountName(user, value) {
  const fullName = validateAccountName(value);
  await registerAccountProfile(user);
  await runTransaction(firestore, async transaction => {
    const ref = doc(firestore, 'accountProfiles', user.uid), fixed = doc(firestore, 'accountNames', user.uid);
    const profile = await transaction.get(ref), name = await transaction.get(fixed);
    const existing = name.data()?.fullName || profile.data()?.fullName;
    if (existing && existing !== fullName) throw new Error('O nome desta conta já foi definido e não pode ser alterado.');
    if (!name.exists()) transaction.set(fixed, { fullName, createdAt: serverTimestamp() });
    if (!profile.data()?.fullName) transaction.update(ref, { fullName });
  });
}

export async function saveAccountPhone(user, phone) {
  if (!/^\+[1-9]\d{7,14}$/.test(phone)) throw new Error('Informe um celular válido com código do país e DDD.');
  await registerAccountProfile(user);
  await updateDoc(doc(firestore, 'accountProfiles', user.uid), { phone });
}
