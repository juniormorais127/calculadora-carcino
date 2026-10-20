import { describe,test,before,after } from 'node:test';
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment,assertSucceeds,assertFails } from '@firebase/rules-unit-testing';
import { doc,setDoc,getDoc,getDocs,collection,query,where,writeBatch,serverTimestamp,updateDoc,deleteDoc } from 'firebase/firestore';

describe('licenciamento, análises e auditoria protegidos no servidor',{skip:!process.env.FIRESTORE_EMULATOR_HOST},()=>{
  let env;
  const db=(uid,verified=true)=>env.authenticatedContext(uid,{email:`${uid}@example.com`,email_verified:verified}).firestore();
  before(async()=>{env=await initializeTestEnvironment({projectId:'demo-professional-records',firestore:{rules:readFileSync('firestore.rules','utf8')}});await env.withSecurityRulesDisabled(async context=>{for(const [uid,role]of [['tech','field_technician'],['other','field_technician'],['admin','administrator'],['senior','senior'],['client','producer']])await setDoc(doc(context.firestore(),'accountProfiles',uid),{role,email:`${uid}@example.com`,fullName:'Nome Completo',premium:false,expiresAt:null});});});
  after(async()=>{await env.cleanup();});
  function save(actor,id,revision=1,technicianUid='tech',extra={}){
    const store=db(actor),batch=writeBatch(store),auditId=`${id}-${revision}`;
    const payload={data:{propertyName:'Fazenda de teste',licenseType:'LS'},checklist:{},stage:'draft',technicianUid,ownerUid:null,createdBy:'tech',createdAt:revision===1?serverTimestamp():extra.createdAt,updatedAt:serverTimestamp(),updatedBy:actor,revision,auditId,...extra};
    batch.set(doc(store,'licensingCases',id),payload);
    batch.set(doc(store,'licensingCases',id,'history',auditId),{...payload,savedBy:actor});
    batch.set(doc(store,'adminActivity',auditId),{actorUid:actor,actorEmail:`${actor}@example.com`,action:revision===1?'record.created':'record.updated',collection:'licensingCases',entityId:id,label:'Fazenda de teste',occurredAt:serverTimestamp(),revision});
    return batch.commit();
  }
  test('técnico salva rascunhos e somente autor/admin podem ler ou editar com histórico',async()=>{
    await assertSucceeds(save('tech','case'));
    const first=(await getDoc(doc(db('tech'),'licensingCases','case'))).data();
    await assertSucceeds(getDoc(doc(db('admin'),'licensingCases','case')));
    await assertFails(getDoc(doc(db('other'),'licensingCases','case')));
    await assertFails(getDoc(doc(db('client'),'licensingCases','case')));
    await assertFails(getDoc(doc(db('tech',false),'licensingCases','case')));
    await assertSucceeds(getDocs(query(collection(db('tech'),'licensingCases'),where('technicianUid','==','tech'))));
    await assertFails(getDocs(collection(db('other'),'licensingCases')));
    await assertFails(save('other','case',2,'tech',{createdAt:first.createdAt}));
    await assertSucceeds(save('admin','case',2,'tech',{createdAt:first.createdAt}));
    await assertFails(updateDoc(doc(db('tech'),'licensingCases','case'),{stage:'issued'}));
    await assertFails(updateDoc(doc(db('admin'),'licensingCases','case','history','case-1'),{stage:'issued'}));
    await assertFails(deleteDoc(doc(db('admin'),'adminActivity','case-1')));
    await assertFails(getDocs(collection(db('tech'),'adminActivity')));
    await assertSucceeds(getDocs(collection(db('admin'),'adminActivity')));
    await assertFails(setDoc(doc(db('tech'),'licensingCases','no-audit'),{...first,updatedAt:serverTimestamp()}));
  });
  test('somente Sênior provisiona administrador e nenhuma senha entra no perfil',async()=>{
    const payload={email:'new@example.com',fullName:'Nova Conta Administrativa',phone:'+5579999999999',role:'administrator',premium:true,expiresAt:null,canAuthorizeTechnicalSupport:true,createdAt:serverTimestamp(),lastSeenAt:null,changedBy:'senior',changedAt:serverTimestamp()};
    const store=db('senior'),batch=writeBatch(store);batch.set(doc(store,'accountNames','new'),{fullName:payload.fullName,createdAt:serverTimestamp()});batch.set(doc(store,'accountProfiles','new'),payload);await assertSucceeds(batch.commit());
    await assertFails(setDoc(doc(db('admin'),'accountProfiles','illegal'),{...payload,changedBy:'admin'}));
    await assertFails(updateDoc(doc(db('senior'),'accountProfiles','new'),{password:'not-allowed'}));
  });
});
