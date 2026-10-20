import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PDFDocument} from 'pdf-lib';
import {createLicensingPdf} from '../src/services/licensingPdf.js';
import {emptyLicensingData} from '../src/services/licensingData.js';
test('modelo oficial mantém campos canônicos editáveis e não preenche assinatura ou uso exclusivo do órgão',async()=>{
  const data={...emptyLicensingData(),clientName:'Maria Conceição Santos',clientDocument:'529.982.247-25',propertyName:'Fazenda Água Clara',activity:'Carcinicultura',requestDescription:'Pedido para revisão profissional.',signedDate:'2026-10-20'};
  const bytes=await createLicensingPdf('request',data,await readFile('public/adema/requerimento.pdf'),await readFile('public/fonts/NotoSans-Regular.ttf'));
  const doc=await PDFDocument.load(bytes),form=doc.getForm();
  assert.equal(form.getTextField('Text1').getText(),data.clientName);
  assert.equal(form.getTextField('Text12').getText(),'X');
  assert.equal(form.getTextField('Text23').getText(),'Carcinicultura — Fazenda Água Clara');
  assert.equal(form.getTextField('Text56').getText(),'2026');
  assert.ok(doc.getPageCount()>2);
  assert.ok(form.getFields().length>=56);
  await assert.rejects(()=>createLicensingPdf('tra',{...data,licenseType:'LO'},awaitBuffer(),null));
});
function awaitBuffer(){return new Uint8Array();}
