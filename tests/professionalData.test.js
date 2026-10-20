import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyLicensingData, validateLicensingDraft, missingLicensingFields, prefillLicensingData, checklistFor } from '../src/services/licensingData.js';
import { emptyEnvironmentalTest, validateEnvironmentalTest } from '../src/services/environmentalData.js';
test('licenciamento permite rascunho incompleto sem simular licença oficial',()=>{
  const data={...emptyLicensingData(),propertyName:'Fazenda Teste'};
  assert.equal(validateLicensingDraft({data,stage:'draft'}).data.propertyName,'Fazenda Teste');
  assert.ok(missingLicensingFields(data).length>20);
  assert.throws(()=>validateLicensingDraft({data,stage:'issued'}),/número oficial/);
  assert.ok(checklistFor('LS').some(([id])=>id==='map'));
});
test('preenchimento aproveita apenas dados disponíveis sem inventar CPF, ART ou coordenada UTM',()=>{
  const data=prefillLicensingData({profile:{fullName:'Ana Maria',phone:'+5579999999999'},identity:{creaNumber:'CREA 123'},user:{email:'ana@example.com'},property:{name:'Fazenda Azul',ponds:[{latitude:-10.9,longitude:-37.1}]}});
  assert.equal(data.technicianName,'Ana Maria');assert.equal(data.technicianCouncil,'CREA 123');assert.equal(data.clientDocument,'');assert.equal(data.art,'');assert.equal(data.utmEasting,'');assert.equal(data.latitude,'-10.9');
});
test('análises registram unidades/métodos e resultados qualitativos sem diagnóstico automático',()=>{
  const record=emptyEnvironmentalTest('soil');record.data.propertyName='Fazenda Teste';record.data.parameters[0].value='7,2';record.data.parameters.push({name:'Textura',value:'Arenosa',unit:'',method:'Laboratório'});
  const value=validateEnvironmentalTest(record);assert.equal(value.type,'soil');assert.equal(value.data.parameters.at(-1).value,'Arenosa');
  assert.throws(()=>validateEnvironmentalTest(emptyEnvironmentalTest()),/propriedade/);
});

test('perfil profissional ausente nao impede abrir um rascunho',()=>{assert.equal(prefillLicensingData({profile:{fullName:'Ana Maria'},identity:null}).technicianName,'Ana Maria');});
