import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { initializeFirestore, memoryLocalCache, connectFirestoreEmulator } from 'firebase/firestore';

// Public web-app configuration. Access is enforced by Authentication and Firestore rules.
export const firebaseConfig = {
  apiKey: 'AIzaSyCZFdPGJMK8XyKLDj2P5awhvYaQ55RW56g',
  authDomain: 'carcinogestao.firebaseapp.com',
  projectId: 'carcinogestao',
  storageBucket: 'carcinogestao.firebasestorage.app',
  messagingSenderId: '596153233528',
  appId: '1:596153233528:web:577906d9c8e766412d7d8d',
};
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
auth.languageCode = 'pt-BR';
// The offline copy lives in a separate Dexie database for each UID.
// Do not use a shared Firestore persistent cache across accounts.
export const firestore = initializeFirestore(app, { localCache: memoryLocalCache() });
if (import.meta.env.DEV && import.meta.env.VITE_FIREBASE_EMULATORS === 'true') {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(firestore, '127.0.0.1', 8080);
}
