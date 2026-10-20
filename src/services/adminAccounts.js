import { initializeApp, deleteApp } from 'firebase/app';
import { initializeAuth, inMemoryPersistence, createUserWithEmailAndPassword, deleteUser, sendPasswordResetEmail } from 'firebase/auth';
import { collection, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { auth, firestore, firebaseConfig, publicSiteUrl } from './firebase.js';
import { validateAccountName } from './accountName.js';
import { normalizePhone } from './accountPhone.js';

export async function createAdministrativeAccount({email,fullName,phone}) {
  email=String(email||'').trim().toLowerCase();fullName=validateAccountName(fullName);phone=normalizePhone(phone);
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error('Informe um e-mail válido que pertença à pessoa responsável pelo acesso.');
  const actor=auth.currentUser;if(!actor?.emailVerified)throw new Error('Confirme o e-mail da conta Sênior antes de criar acessos.');
  const app=initializeApp(firebaseConfig,`admin-provision-${crypto.randomUUID()}`);
  const provisioning=initializeAuth(app,{persistence:inMemoryPersistence});
  let credential;
  try{
    const random=Array.from(crypto.getRandomValues(new Uint8Array(48)),value=>value.toString(16).padStart(2,'0')).join('')+'aA!7';
    credential=await createUserWithEmailAndPassword(provisioning,email,random);
    const batch=writeBatch(firestore),uid=credential.user.uid;
    batch.set(doc(firestore,'accountNames',uid),{fullName,createdAt:serverTimestamp()});
    batch.set(doc(firestore,'accountProfiles',uid),{email,fullName,phone,role:'administrator',premium:true,expiresAt:null,canAuthorizeTechnicalSupport:true,createdAt:serverTimestamp(),lastSeenAt:null,changedBy:actor.uid,changedAt:serverTimestamp()});
    batch.set(doc(collection(firestore,'adminActivity')),{actorUid:actor.uid,actorEmail:actor.email,action:'admin.created',collection:'accountProfiles',entityId:uid,label:email,occurredAt:serverTimestamp(),revision:0});
    try{await batch.commit();}catch(error){await deleteUser(credential.user).catch(()=>{});throw error;}
    try{await sendPasswordResetEmail(auth,email,{url:publicSiteUrl});return{uid,email,sent:true};}catch{return{uid,email,sent:false};}
  }catch(error){if(error.code==='auth/email-already-in-use')throw new Error('Este e-mail já tem conta. Abra Usuários e permissões e use a conta existente; somente o Sênior pode conceder perfil de administrador.');throw error;}
  finally{await deleteApp(app);}
}
