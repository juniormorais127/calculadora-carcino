import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { firestore } from './firebase.js';

export async function registerAccountProfile(user) {
  const ref = doc(firestore, 'accountProfiles', user.uid);
  await runTransaction(firestore, async transaction => {
    const profile = await transaction.get(ref);
    const visit = { email: user.email, lastSeenAt: serverTimestamp() };
    if (profile.exists()) transaction.update(ref, visit);
    else transaction.set(ref, { ...visit, createdAt: serverTimestamp(), premium: false, expiresAt: null, changedBy: null, changedAt: null });
  });
}
